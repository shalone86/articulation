// Cloudflare Worker: serves the static app (public/) and a small API.
//
//   GET  /api/health      → { stt, tts, backend, model }
//   POST /api/transcribe  → body: audio/wav (16 kHz mono) → { text, words }
//   GET  /api/tts?text=…&voice=asteria → audio/mpeg
//
//   GET  /.well-known/assetlinks.json → proves the Android app owns this site (see docs/ANDROID.md)
//
// Optional secret APP_PASSCODE: when set, API calls need header x-app-passcode.
// Optional var STT_ORIGIN (e.g. https://you-articulation.hf.space): send speech checks to the
// self-hosted server instead (it adds forced-choice scoring); the site and voice stay here.
// If that server is slow to answer (asleep) or down, checks fall back to Workers AI.
//   STT_PASSCODE  secret: that server's APP_PASSCODE, if it has one
//   STT_TOKEN     secret: a Hugging Face token, if the Space is private
// Optional vars ANDROID_PACKAGE and ANDROID_SHA256 (comma-separated fingerprints) for assetlinks.

const STT_MODEL = "@cf/openai/whisper-large-v3-turbo";
const TTS_MODEL = "@cf/deepgram/aura-1";
const TTS_VOICES = new Set(["angus", "asteria", "arcas", "orion", "orpheus", "athena", "luna", "zeus", "perseus", "helios", "hera", "stella"]);
const MAX_AUDIO_BYTES = 2 * 1024 * 1024; // ~60 s of 16 kHz mono WAV
const ORIGIN_TIMEOUT_MS = 12000; // a sleeping Hugging Face Space takes longer than this to wake

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/.well-known/assetlinks.json") return assetLinks(env);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);

    if (env.APP_PASSCODE && request.headers.get("x-app-passcode") !== env.APP_PASSCODE) {
      return json({ error: "passcode required" }, 401);
    }
    try {
      switch (`${request.method} ${url.pathname}`) {
        case "GET /api/health":
          if (env.STT_ORIGIN) return await proxyHealth(env);
          return json({ stt: !!env.AI, tts: !!env.AI, backend: "Cloudflare Workers AI", model: STT_MODEL.split("/").pop() });
        case "POST /api/transcribe": {
          const audio = await request.arrayBuffer();
          if (!audio.byteLength) return json({ error: "empty audio" }, 400);
          if (audio.byteLength > MAX_AUDIO_BYTES) return json({ error: "audio too long" }, 413);
          if (env.STT_ORIGIN) {
            const r = await proxyTranscribe(audio, url, env).catch((e) => (console.warn("STT origin failed:", e.message), null));
            if (r?.ok) return r;
          }
          return await transcribe(audio, env);
        }
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

async function transcribe(audio, env) {
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

function originHeaders(env) {
  const h = {};
  if (env.STT_PASSCODE) h["x-app-passcode"] = env.STT_PASSCODE;
  if (env.STT_TOKEN) h.authorization = `Bearer ${env.STT_TOKEN}`;
  return h;
}

async function proxyTranscribe(audio, url, env) {
  const r = await fetch(`${env.STT_ORIGIN.replace(/\/$/, "")}/api/transcribe${url.search}`, {
    method: "POST",
    headers: { "content-type": "audio/wav", ...originHeaders(env) },
    body: audio,
    signal: AbortSignal.timeout(ORIGIN_TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`origin ${r.status}`);
  return new Response(r.body, { status: 200, headers: { "content-type": "application/json" } });
}

async function proxyHealth(env) {
  try {
    const r = await fetch(`${env.STT_ORIGIN.replace(/\/$/, "")}/api/health`, {
      headers: originHeaders(env), signal: AbortSignal.timeout(5000),
    });
    const h = await r.json();
    return json({ ...h, tts: !!env.AI, backend: `${h.backend} via Cloudflare` });
  } catch (e) {
    // Speech server asleep or down: checks still work through Workers AI.
    return json({ stt: !!env.AI, tts: !!env.AI, backend: "Cloudflare Workers AI (fallback)", model: STT_MODEL.split("/").pop() });
  }
}

function assetLinks(env) {
  if (!env.ANDROID_PACKAGE || !env.ANDROID_SHA256) return json([], 200);
  return json([{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: env.ANDROID_PACKAGE,
      sha256_cert_fingerprints: env.ANDROID_SHA256.split(",").map((s) => s.trim()),
    },
  }]);
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
