# 🗣️ Articulation Workshop

Pronunciation practice for English learners (ESL) and kids working on speech sounds.

- **Flip cards for every English sound and spelling.** 46 sound cards (all 24 consonants, short/long vowels, diphthongs, r-controlled vowels) plus 63 spelling cards: consonant digraphs, trigraphs, quadgraphs, vowel teams, magic e, bossy r, and silent letters.
  - **Front 🎤 Your turn:** record yourself saying a word or the practice sentence. The speech checker (Whisper) tells you what it heard. If you said a known look-alike word ("sink" for "think", "dock" for "dog", "eschool" for "school"), it says what probably went wrong.
  - **Back 👂 Listen:** hear the word (normal speed or slow) and the sentence. The back also shows how to make the sound, every way to spell it, words with the sound at the start, middle, and end, minimal pairs, notes for 19 first languages, and notes for kids and parents.
- **Learn:** 19 short lessons: how sounds are made, voiced vs. voiceless, plosives (with aspiration), fricatives, affricates, nasals, liquids and glides, the H sound (dropped, added, or scratchy H), word endings (final devoicing, dropped finals, added vowels, the -ng → -nk click), -ed/-s endings, TH, V/W/B, short vs. long vowels, schwa and stress, clusters, homophones/homographs/minimal pairs, spelling patterns, kids' speech patterns, and clear speech for slurring.
- **Minimal pairs game:** *Listen* mode (which word did you hear?) and *Say* mode (did the checker hear the word you meant?). It can be filtered to the sounds that are hard for your first language.
- **Homophones:** a quiz plus a list, and heteronyms (read/read, lead/lead).
- **Spelling chart:** every common spelling of every sound. Tap one to hear it.
- **Progress** for each learner (handy for 1–2 people sharing a device), stars, a "needs practice" deck, and a backup file you can export and import.

- **First-language suggestions:** pick one of 20 first languages and get a ranked "start here" list of sounds and lessons for those speakers (with ✓ where the checkup agrees), plus tips on every card.
- **Sentence checkup** on first use: read 9 short sentences, and the app suggests which sounds (and habits like dropping word endings) to practice first. Retake it any time.
- **Search** for any word, spelling or sound ("thumb", "igh", "schwa", "θ"); any word not on a card gets its own practice card.
- **Three looks** (Playroom, Studio, Pop) in Settings → Look, each with dark mode; swipe between cards; installable and works offline.

No build step: the frontend is plain HTML/CSS/ES modules in `public/`.

**Guides:** [docs/HOSTING.md](docs/HOSTING.md) (free hosting without a home server) · [docs/ANDROID.md](docs/ANDROID.md) (Google Play) · [docs/WORKSHOP.md](docs/WORKSHOP.md) (design decisions and accuracy measurements)

> This is a practice tool, not a diagnosis or a replacement for a speech-language pathologist.

---

## Deploy

Pick **one**. Every option runs the same frontend and the same small API (`/api/health`, `/api/transcribe`, `/api/tts`). [docs/WORKSHOP.md](docs/WORKSHOP.md) has the comparison, the accuracy measurements, and why I'd pick **B behind a Cloudflare Tunnel**.

### Option A: Cloudflare Workers (zero maintenance)

Whisper runs on Cloudflare's GPUs through Workers AI, so there's no server to look after. 1–2 users fit comfortably in the free daily allowance.

```bash
npm install
npx wrangler login
npx wrangler deploy            # → https://articulation.<you>.workers.dev
# optional: keep strangers off your AI quota
npx wrangler secret put APP_PASSCODE
```

If you set a passcode, enter it once under **Settings → Speech checker** on each device.

- Speech-to-text: `@cf/openai/whisper-large-v3-turbo`
- Voice: `@cf/deepgram/aura-1` (consistent and natural, cached at the edge). Each device can switch to its built-in voice in Settings.
- Local dev: `npx wrangler dev` (the AI binding calls your Cloudflare account).

### Option B: Your own server (Docker) — my pick

```bash
docker compose up -d                          # → http://your-server:8000
cloudflared tunnel --url http://localhost:8000   # free HTTPS URL, no open ports
```

- Speech-to-text: [faster-whisper](https://github.com/SYSTRAN/faster-whisper), CPU is fine. Set `WHISPER_MODEL` in `docker-compose.yml` (`base.en` is fast, `small.en` is the default and more accurate).
- **Better word checking:** this backend also does *forced-choice scoring*. It asks Whisper how likely the audio is to be the target word versus each of its look-alikes, so results don't depend only on Whisper's open guess. See the workshop doc for the numbers.
- Voice: a local [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) voice (`KOKORO_VOICE`, default `af_heart` in the Docker image; ~330 MB downloaded on first use), which sounds more natural than Piper. Set `KOKORO_VOICE=` (empty) to use Piper instead.
- Alternative voice: a local [Piper](https://github.com/OHF-Voice/piper1-gpl) voice (`PIPER_VOICE`, downloaded on first use). Remove that line to use each device's built-in voice.
- Recordings never leave your server.
- **Browsers only allow the microphone on HTTPS (or localhost).** Put it behind a reverse proxy with TLS (Caddy, nginx + Let's Encrypt), or use a Cloudflare Tunnel.

Without Docker:

```bash
pip install -r server/requirements.txt   # + piper-tts for the server voice
uvicorn server.app:app --host 0.0.0.0 --port 8000
```

### Option C: Hybrid

Deploy option A, then point its speech checks at your server: add `"vars": { "STT_ORIGIN": "https://your-tunnel-url" }` to `wrangler.jsonc` (and `npx wrangler secret put STT_PASSCODE` if your server uses a passcode). Cloudflare serves the site and voice, and your server does the forced-choice checking.

### Static only

`public/` also works on any static host (Cloudflare Pages, Vercel, Netlify, GitHub Pages). Recording, playback, the voice, lessons, and games all work. The speech checker shows as offline, and learners compare their recording with the model voice by ear.

## Develop

```bash
npm test                       # scoring + data integrity tests (node:test, no deps)
uvicorn server.app:app --reload --port 8000   # or: npx wrangler dev
```

| Path | What |
|---|---|
| `public/js/data/phonemes.js` | All sounds: mouth instructions, spellings, words by position, sentences, minimal pairs, notes per first language, kids' notes |
| `public/js/data/graphemes.js` | Digraphs, trigraphs, vowel teams, silent letters… |
| `public/js/data/lessons.js` | The Learn section |
| `public/js/data/homophones.js` | Homophones and heteronyms |
| `public/js/score.js` | Compares the target with what Whisper heard; diagnoses error patterns |
| `public/js/audio.js`, `wav.js` | Mic → trimmed, normalized 16 kHz mono WAV, auto-stop on silence |
| `worker/index.js` | Cloudflare Worker API |
| `server/app.py` | Self-hosted API (faster-whisper + optional Piper) |

The content is plain data, so to add a word, sentence, or first-language note you only edit one of the data files.
