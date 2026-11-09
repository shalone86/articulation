// Cloudflare Worker: serves the static app (public/) and a small API.
//
//   GET  /api/health      → { stt, tts, backend, model }
//   POST /api/transcribe  → body: audio/wav (16 kHz mono) → { text, words }
//   GET  /api/tts?text=…&voice=helena → audio/mpeg
//
//   GET  /.well-known/assetlinks.json → proves the Android app owns this site (see docs/ANDROID.md)
//
// Optional secret APP_PASSCODE: when set, API calls need header x-app-passcode.
// Family codes (worker/codes.js, KV binding CODES): set var REQUIRE_CODE = "true" and speech checks need
// a code in header x-angelio-code after a few free tries a day. GET /api/code?c=… checks a code.
// Optional var STT_ORIGIN (e.g. https://you-articulation.hf.space), used only with var USE_OWN_STT = "true": send speech checks to the
// self-hosted server instead (it adds forced-choice scoring); the site and voice stay here.
// If that server is slow to answer (asleep) or down, checks fall back to Workers AI.
//   STT_PASSCODE  secret: that server's APP_PASSCODE, if it has one
//   STT_TOKEN     secret: a Hugging Face token, if the Space is private
// Optional vars ANDROID_PACKAGE and ANDROID_SHA256 (comma-separated fingerprints) for assetlinks.

import { checkSpeech, codeStatus } from "./codes.js";

const STT_MODEL = "@cf/openai/whisper-large-v3-turbo";
// All speech uses Aura-2 (the nicer voice), sent as WAV so Safari plays even single words.
const TTS_MODEL = "@cf/deepgram/aura-2-en";
// Aura-2 English voices, the default (helena) first (the Settings list shows them in this order).
const TTS_VOICE_LIST = ["helena", "thalia", "asteria", "luna", "athena", "aurora", "iris", "cora", "delia", "harmonia",
  "andromeda", "amalthea", "callista", "cordelia", "electra", "hera", "juno", "minerva", "ophelia", "pandora", "phoebe",
  "theia", "vesta", "apollo", "arcas", "aries", "atlas", "draco", "hermes", "hyperion", "janus", "jupiter", "mars",
  "neptune", "odysseus", "orion", "orpheus", "pluto", "saturn", "zeus"];
const TTS_VOICES = new Set(TTS_VOICE_LIST);
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
    // Speech checks run on Cloudflare Workers AI. Your own Whisper server (STT_ORIGIN) is only used
    // when USE_OWN_STT is "true", so a leftover STT_ORIGIN secret can't send checks to a Mac that's off.
    if (env.USE_OWN_STT !== "true") env = { ...env, STT_ORIGIN: undefined };
    try {
      switch (`${request.method} ${url.pathname}`) {
        case "GET /api/health":
          if (env.STT_ORIGIN) return await proxyHealth(env);
          return json({ stt: !!env.AI, tts: !!env.AI, backend: "Cloudflare Workers AI", model: STT_MODEL.split("/").pop(), voices: TTS_VOICE_LIST });
        case "POST /api/transcribe": {
          // Family codes (worker/codes.js): only when var REQUIRE_CODE is "true"; otherwise open as before.
          const gate = await checkSpeech(request, env);
          if (!gate.ok) return json(gate.body, gate.status);
          const audio = await request.arrayBuffer();
          if (!audio.byteLength) return json({ error: "empty audio" }, 400);
          if (audio.byteLength > MAX_AUDIO_BYTES) return json({ error: "audio too long" }, 413);
          let r = null;
          if (env.STT_ORIGIN) r = await proxyTranscribe(audio, url, env).catch((e) => (console.warn("STT origin failed:", e.message), null));
          if (!r?.ok) r = await transcribe(audio, env);
          if (r.ok) ctx.waitUntil(gate.charge());
          return r;
        }
        case "GET /api/code": {
          const st = await codeStatus(env, url.searchParams.get("c"));
          return json(st.valid ? { valid: true, name: st.name, limit: st.limit, left: st.left } : { valid: false, revoked: !!st.revoked });
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
    return json({ ...h, tts: !!env.AI, voices: TTS_VOICE_LIST, backend: `${h.backend} via Cloudflare` });
  } catch (e) {
    // Speech server asleep or down: checks still work through Workers AI.
    return json({ stt: !!env.AI, tts: !!env.AI, backend: "Cloudflare Workers AI (fallback)", model: STT_MODEL.split("/").pop(), voices: TTS_VOICE_LIST });
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
  const voice = TTS_VOICES.has(url.searchParams.get("voice")) ? url.searchParams.get("voice") : "helena";


  // Everything uses Aura-2 (the nicer voice), as 24 kHz WAV: Safari won't reliably play its
  // very short mp3 clips (single numbers).
  const cache = caches.default;
  const cacheKey = new Request(`https://tts.cache/v3/aura/${voice}/${encodeURIComponent(text)}`);
  const hit = await cache.match(cacheKey);
  if (hit) return hit;
  const raw = await env.AI.run(TTS_MODEL, { text, speaker: voice, encoding: "linear16", container: "wav", sample_rate: 24000 }, { returnRawResponse: true });
  if (!raw.ok) return json({ error: `tts failed (${raw.status})` }, 502);
  const res = new Response(await raw.arrayBuffer(), {
    headers: { "content-type": "audio/wav", "cache-control": "public, max-age=2592000", "x-voice-source": "aura" },
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
