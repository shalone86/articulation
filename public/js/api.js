// Talks to the backend (Cloudflare Worker or the self-hosted server — same API).

import { settings } from "./store.js";

// The family code for speech checks: the same one parents enter on angelio.org (same device and site),
// or in Settings here. See worker/codes.js.
export const familyCode = () => { try { return localStorage.getItem("angelio:code") || ""; } catch { return ""; } };
export const setFamilyCode = (c) => { try { c ? localStorage.setItem("angelio:code", c) : localStorage.removeItem("angelio:code"); } catch { /* ignore */ } };
const headers = () => ({
  ...(settings().passcode ? { "x-app-passcode": settings().passcode } : {}),
  ...(familyCode() ? { "x-angelio-code": familyCode() } : {}),
});

/** { valid, name, limit, left } for a family code (never throws). */
export async function checkFamilyCode(code) {
  try { const r = await fetch(`api/code?c=${encodeURIComponent(code)}`); return r.ok ? await r.json() : { valid: false }; }
  catch { return { valid: false, offline: true }; }
}

const GATE_MESSAGES = {
  "need-code": "You’ve used today’s free speech checks. A grown-up can enter a family code in Settings. You can still listen and compare!",
  limit: "This month’s speech checks for your family code are used up. You can still listen and compare!",
  "bad-code": "That family code doesn’t work. Check it in Settings.",
  revoked: "That family code has been turned off.",
  busy: "Speech checks are resting for today. You can still listen and compare!",
};

let healthCache;
/** { stt: bool, tts: bool, backend: string, model: string } — never throws. */
export async function health(force = false) {
  if (healthCache && !force) return healthCache;
  try {
    const r = await fetch("api/health", { headers: headers() });
    healthCache = r.ok ? await r.json() : { stt: false, tts: false, error: `HTTP ${r.status}` };
  } catch (e) {
    healthCache = { stt: false, tts: false, error: "No backend reachable (static hosting?)" };
  }
  return healthCache;
}

/**
 * Send a WAV blob to Whisper. Returns { text, words?, scores? }.
 * candidates (optional): words to score by forced choice (self-hosted backend only).
 */
export async function transcribe(wav, candidates = []) {
  const q = candidates.length ? `?candidates=${encodeURIComponent(candidates.join(","))}` : "";
  const r = await fetch(`api/transcribe${q}`, {
    method: "POST",
    headers: { "content-type": "audio/wav", ...headers() },
    body: wav,
  });
  if (r.status === 401) throw new Error("The passcode is missing or wrong. Set it in Settings.");
  if (r.status === 402 || r.status === 503) {
    const j = await r.clone().json().catch(() => ({}));
    if (GATE_MESSAGES[j.reason]) throw new Error(GATE_MESSAGES[j.reason]);
  }
  if (!r.ok) throw new Error(`Speech check failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

/** Fetch server TTS audio as a Blob (or throw). */
export async function serverTts(text, voice) {
  // TTS audio is cached for a month; bump v when the server's voice output changes.
  const q = new URLSearchParams({ text, voice: voice || "", v: "5" });
  const r = await fetch(`api/tts?${q}`, { headers: headers() });
  if (!r.ok) throw new Error(`TTS ${r.status}`);
  return r.blob();
}
