// Cloudflare Worker: serves the static app (public/) and a small API.
//
//   GET  /api/health      → { stt, tts, backend, model }
//   POST /api/transcribe  → body: audio/wav (16 kHz mono) → { text, words }
//   GET  /api/tts?text=…&voice=asteria → audio/mpeg
//
// Optional secret APP_PASSCODE: when set, API calls need header x-app-passcode.
// Optional var STT_ORIGIN (e.g. https://whisper.example.com): send speech checks to the
// self-hosted server instead (it adds forced-choice scoring); the site and voice stay here.
// If that server has its own APP_PASSCODE, set it as the secret STT_PASSCODE.

const STT_MODEL = "@cf/openai/whisper-large-v3-turbo";
const TTS_MODEL = "@cf/deepgram/aura-1";
const TTS_VOICES = new Set(["angus", "asteria", "arcas", "orion", "orpheus", "athena", "luna", "zeus", "perseus", "helios", "hera", "stella"]);
const MAX_AUDIO_BYTES = 2 * 1024 * 1024; // ~60 s of 16 kHz mono WAV

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    if (env.APP_PASSCODE && request.headers.get("x-app-passcode") !== env.APP_PASSCODE) {
      return json({ error: "passcode required" }, 401);
    }
    try {
      switch (`${request.method} ${url.pathname}`) {
        case "GET /api/health":
          if (env.STT_ORIGIN) return await proxyHealth(env);
          return json({ stt: !!env.AI, tts: !!env.AI, backend: "Cloudflare Workers AI", model: STT_MODEL.split("/").pop() });
        case "POST /api/transcribe":
          if (env.STT_ORIGIN) return await proxyTranscribe(request, url, env);
          return await transcribe(request, env);
        case "GET /api/tts":
          return await tts(request, url, env, ctx);
        default:
          return json({ error: "not found" }, 404);
      }
    } catch (e) {
      console.error(e);
      return json({ error: String(e?.message ?? e) }, 500);
    }
  },
};

async function transcribe(request, env) {
  const audio = await request.arrayBuffer();
  if (!audio.byteLength) return json({ error: "empty audio" }, 400);
  if (audio.byteLength > MAX_AUDIO_BYTES) return json({ error: "audio too long" }, 413);

  const out = await env.AI.run(STT_MODEL, {
    audio: toBase64(audio),
    task: "transcribe",
    // Force English: with accented speech Whisper's language detection can
    // guess wrong and "translate" the attempt.
    language: "en",
    // Short single-word clips: don't let earlier text steer the result.
    condition_on_previous_text: false,
    vad_filter: false,
  });
  const words = (out.segments ?? []).flatMap((s) => s.words ?? []).map((w) => ({ word: w.word, start: w.start, end: w.end }));
  return json({ text: (out.text ?? "").trim(), words });
}

const originHeaders = (env) => (env.STT_PASSCODE ? { "x-app-passcode": env.STT_PASSCODE } : {});

async function proxyTranscribe(request, url, env) {
  const r = await fetch(`${env.STT_ORIGIN.replace(/\/$/, "")}/api/transcribe${url.search}`, {
    method: "POST",
    headers: { "content-type": "audio/wav", ...originHeaders(env) },
    body: await request.arrayBuffer(),
  });
  return new Response(r.body, { status: r.status, headers: { "content-type": "application/json" } });
}

async function proxyHealth(env) {
  try {
    const r = await fetch(`${env.STT_ORIGIN.replace(/\/$/, "")}/api/health`, { headers: originHeaders(env) });
    const h = await r.json();
    return json({ ...h, tts: !!env.AI, backend: `${h.backend} via Cloudflare` });
  } catch (e) {
    return json({ stt: false, tts: !!env.AI, error: `speech server unreachable: ${e.message}` });
  }
}

async function tts(request, url, env, ctx) {
  const text = (url.searchParams.get("text") ?? "").trim().slice(0, 300);
  if (!text) return json({ error: "missing text" }, 400);
  const voice = TTS_VOICES.has(url.searchParams.get("voice")) ? url.searchParams.get("voice") : "asteria";

  // Same text + voice → same audio, so cache it at the edge.
  const cacheKey = new Request(`https://tts.cache/${voice}/${encodeURIComponent(text)}`);
  const cache = caches.default;
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const raw = await env.AI.run(TTS_MODEL, { text, speaker: voice, encoding: "mp3" }, { returnRawResponse: true });
  if (!raw.ok) return json({ error: `tts failed (${raw.status})` }, 502);
  const res = new Response(raw.body, {
    headers: { "content-type": "audio/mpeg", "cache-control": "public, max-age=2592000" },
  });
  ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
