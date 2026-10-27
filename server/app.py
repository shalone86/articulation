"""Self-hosted backend: the same API as the Cloudflare Worker, using faster-whisper.

    GET  /api/health      -> {stt, tts, backend, model}
    POST /api/transcribe  -> body: audio/wav (16 kHz mono) -> {text, words, scores?}
                             ?candidates=think,sink,tink  adds forced-choice scores:
                             Whisper's log-probability that the audio says each word
    GET  /api/tts         -> audio/wav from Piper if PIPER_VOICE is set, otherwise 501
                             (the app then falls back to the browser's voice)

Also serves the static app from ../public.

Environment:
    WHISPER_MODEL    faster-whisper model name or path (default: small.en)
    WHISPER_DEVICE   cpu | cuda | auto (default: auto)
    WHISPER_COMPUTE  compute type (default: int8 on cpu, float16 on cuda)
    APP_PASSCODE     optional; when set, API calls need header x-app-passcode
    PIPER_VOICE      optional Piper TTS voice (e.g. en_US-lessac-medium, or a path to
                     an .onnx file) for a consistent server voice; downloaded on first use
    PIPER_DIR        where Piper voices are stored (default: ./voices)
"""

import io
import os
import threading
import wave
from pathlib import Path

import numpy as np

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from faster_whisper import WhisperModel
from faster_whisper.audio import pad_or_trim
from faster_whisper.tokenizer import Tokenizer

MODEL_NAME = os.environ.get("WHISPER_MODEL", "small.en")
DEVICE = os.environ.get("WHISPER_DEVICE", "auto")
COMPUTE = os.environ.get("WHISPER_COMPUTE", "default")
PASSCODE = os.environ.get("APP_PASSCODE", "")
MAX_AUDIO_BYTES = 2 * 1024 * 1024
PIPER_VOICE = os.environ.get("PIPER_VOICE", "")
PIPER_DIR = Path(os.environ.get("PIPER_DIR", "voices"))
PUBLIC_DIR = Path(os.environ.get("PUBLIC_DIR", Path(__file__).resolve().parent.parent / "public"))

app = FastAPI(title="Articulation Workshop")
_model = None
_lock = threading.Lock()
_voice = None
_tts_cache: dict[str, bytes] = {}


def model() -> WhisperModel:
    global _model
    with _lock:
        if _model is None:
            _model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE)
        return _model


@app.middleware("http")
async def passcode(request: Request, call_next):
    if PASSCODE and request.url.path.startswith("/api/") and request.headers.get("x-app-passcode") != PASSCODE:
        return JSONResponse({"error": "passcode required"}, status_code=401)
    return await call_next(request)


@app.get("/api/health")
def health():
    return {"stt": True, "tts": bool(PIPER_VOICE), "backend": "self-hosted faster-whisper", "model": MODEL_NAME}


@app.post("/api/transcribe")
async def transcribe(request: Request):
    audio = await request.body()
    if not audio:
        raise HTTPException(400, "empty audio")
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(413, "audio too long")
    samples = decode(audio)
    segments, _info = model().transcribe(
        samples,
        language="en",  # accented speech can fool language detection
        beam_size=5,
        condition_on_previous_text=False,
        word_timestamps=True,
        vad_filter=False,
    )
    segments = list(segments)
    words = [
        {"word": w.word, "start": w.start, "end": w.end, "probability": round(w.probability, 3)}
        for s in segments
        for w in (s.words or [])
    ]
    result = {"text": "".join(s.text for s in segments).strip(), "words": words}
    candidates = [c.strip() for c in request.query_params.get("candidates", "").split(",") if c.strip()][:10]
    if candidates and isinstance(samples, np.ndarray):
        # Also score what open transcription heard, so a completely different word
        # can't win just because it wasn't on the list.
        heard = ["".join(ch for ch in w["word"].lower() if ch.isalpha() or ch == "'") for w in words][:3]
        result["scores"] = score_candidates(samples, list(dict.fromkeys(candidates + [h for h in heard if h])))
    return result


def score_candidates(samples: np.ndarray, candidates: list[str]) -> dict[str, float]:
    """Forced choice: how likely is it that the audio is each candidate word?

    Open transcription has to guess from all of English, and on a single short word
    it often guesses wrong even when the word was said well. Here we only ask Whisper
    to compare the target with its known look-alikes (minimal pairs).
    """
    m = model()
    tok = Tokenizer(m.hf_tokenizer, m.model.is_multilingual, task="transcribe", language="en")
    features = m.feature_extractor(samples)
    num_frames = features.shape[-1]
    encoded = m.encode(pad_or_trim(features))
    prompt = tok.sot_sequence + [tok.no_timestamps]
    scores = {}
    for word in candidates:
        best = -1e9
        for form in (f" {word.capitalize()}.", f" {word}"):
            res = m.model.align(encoded, prompt, [tok.encode(form) + [tok.eot]], num_frames)[0]
            best = max(best, float(np.sum(np.log(np.maximum(res.text_token_probs, 1e-12)))))
        scores[word] = round(best, 3)
    return scores


def decode(audio: bytes):
    """The app sends 16 kHz mono 16-bit WAV; read it directly (no ffmpeg/PyAV needed).
    Anything else is handed to faster-whisper's own decoder."""
    try:
        with wave.open(io.BytesIO(audio)) as w:
            if w.getframerate() == 16000 and w.getnchannels() == 1 and w.getsampwidth() == 2:
                return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    except wave.Error:
        pass
    return io.BytesIO(audio)


def piper_voice():
    global _voice
    with _lock:
        if _voice is None:
            from piper import PiperVoice  # optional dependency

            path = Path(PIPER_VOICE)
            if path.suffix != ".onnx":
                from piper.download_voices import download_voice

                PIPER_DIR.mkdir(parents=True, exist_ok=True)
                path = PIPER_DIR / f"{PIPER_VOICE}.onnx"
                if not path.exists():
                    download_voice(PIPER_VOICE, PIPER_DIR)
            _voice = PiperVoice.load(str(path))
        return _voice


@app.get("/api/tts")
def tts(text: str, voice: str = ""):
    if not PIPER_VOICE:
        raise HTTPException(501, "server TTS not configured; the app will use the browser voice")
    text = text.strip()[:300]
    if not text:
        raise HTTPException(400, "missing text")
    if text not in _tts_cache:
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            piper_voice().synthesize_wav(text, w)
        if len(_tts_cache) > 2000:
            _tts_cache.clear()
        _tts_cache[text] = buf.getvalue()
    return Response(_tts_cache[text], media_type="audio/wav", headers={"cache-control": "public, max-age=2592000"})


if os.environ.get("PRELOAD", "1") == "1":
    threading.Thread(target=model, daemon=True).start()

app.mount("/", StaticFiles(directory=PUBLIC_DIR, html=True), name="static")
