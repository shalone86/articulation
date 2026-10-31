// Text-to-speech: server voice (Workers AI / Deepgram Aura or Piper) when available,
// otherwise the browser's built-in speechSynthesis.
//
// Reliability notes (these caused "tap to hear does nothing until I refresh"):
// - Chrome's speechSynthesis can get stuck: speak() right after cancel() is dropped,
//   or onend never fires and everything queues behind a dead utterance. We keep a
//   reference to the utterance (so it isn't garbage-collected), wait a beat after
//   cancel(), watch for a start event, and reset the engine if it never starts.
// - Mobile browsers only allow audio playback during a tap. Server audio is
//   prefetched for the current card, and one <audio> element is reused, so a tap
//   plays immediately instead of after a network round trip.
// - Every playback promise settles (ended, paused, error or timeout), so a failed
//   play can never block the next one.

import { settings } from "./store.js";
import { health, serverTts } from "./api.js";

const cache = new Map(); // `${voice}|${text}` → Promise<object URL>
const player = typeof Audio !== "undefined" ? new Audio() : null;
let playId = 0;
let utterance; // keep a reference: Chrome drops events for GC'd utterances

export function browserVoices() {
  if (!("speechSynthesis" in window)) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("en"));
}

function pickVoice() {
  const voices = browserVoices();
  const chosen = voices.find((v) => v.name === settings().voice);
  if (chosen) return chosen;
  const us = voices.filter((v) => /en[-_]US/i.test(v.lang));
  const pool = us.length ? us : voices;
  // Prefer the higher-quality voices most platforms ship.
  return pool.find((v) => /natural|neural|enhanced|premium|google us|samantha|aria|jenny/i.test(v.name)) ?? pool[0];
}

async function useServer() {
  const src = settings().ttsSource;
  if (src === "browser") return false;
  if (src === "server") return true;
  return !!(await health()).tts;
}

function serverUrl(text) {
  const key = `${settings().serverVoice}|${text}`;
  if (!cache.has(key)) {
    const p = serverTts(text, settings().serverVoice).then((blob) => URL.createObjectURL(blob));
    p.catch(() => cache.delete(key)); // let a later tap retry
    cache.set(key, p);
  }
  return cache.get(key);
}

/** Warm the cache for words the learner is likely to tap next. Never throws. */
export async function prefetch(texts) {
  try {
    if (!(await useServer())) return;
    for (const t of texts) serverUrl(t).catch(() => {});
  } catch { /* offline — the browser voice will be used */ }
}

export function stop() {
  playId++;
  if (player && !player.paused) player.pause();
  if ("speechSynthesis" in window && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Play a URL through the shared player; resolves when done (never hangs). */
function playThrough(url, rate, id) {
  return new Promise((resolve, reject) => {
    const done = () => { player.onended = player.onpause = player.onerror = null; clearTimeout(timer); resolve(); };
    player.onended = player.onpause = done;
    player.onerror = () => { done(); reject(new Error("Audio could not be played.")); };
    const timer = setTimeout(done, 30000);
    player.src = url;
    player.preservesPitch = true;
    player.playbackRate = rate;
    player.play().catch((e) => { done(); if (id === playId) reject(e); });
  });
}

async function speakBrowser(text, rate, id) {
  if (!("speechSynthesis" in window)) throw new Error("This device can’t speak text aloud.");
  const synth = speechSynthesis;
  if (synth.speaking || synth.pending) {
    synth.cancel();
    await sleep(80); // Chrome drops a speak() issued in the same tick as cancel()
  }
  if (id !== playId) return;
  synth.resume(); // un-stick a paused engine (Chrome on Android pauses in the background)
  const attempt = () => new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    utterance = u;
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-US";
    u.rate = rate;
    let started = false;
    const finish = (ok) => { clearTimeout(startTimer); clearTimeout(endTimer); resolve(ok); };
    u.onstart = () => { started = true; };
    u.onend = () => finish(true);
    u.onerror = () => finish(started);
    // If the engine never starts, it's stuck: report so we can reset and retry.
    const startTimer = setTimeout(() => !started && finish(false), 1500);
    // Some engines never fire onend; don't wait forever.
    const endTimer = setTimeout(() => finish(true), 2000 + text.length * 150 / rate);
    synth.speak(u);
  });
  if (await attempt()) return;
  if (id !== playId) return;
  synth.cancel();
  await sleep(150);
  if (!(await attempt())) throw new Error("The device voice didn’t respond. Try again, or pick another voice in Settings.");
}

/**
 * Say text aloud. slow=true plays at ~65% speed.
 * Resolves when playback ends.
 */
export async function speak(text, { slow = false } = {}) {
  stop();
  const id = playId;
  const rate = (settings().rate || 1) * (slow ? 0.65 : 1);
  if (player && (await useServer())) {
    try {
      const url = await serverUrl(text);
      if (id !== playId) return;
      return await playThrough(url, rate, id);
    } catch (e) {
      console.warn("Server voice failed, using the device voice", e);
      if (id !== playId) return;
    }
  }
  return speakBrowser(text, rate, id);
}

/** Play a recorded clip (object URL). */
export async function playUrl(url) {
  stop();
  if (!player) return;
  return playThrough(url, 1, playId);
}

// Voices load asynchronously in Chrome; touching getVoices() starts the load.
if ("speechSynthesis" in window) {
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener?.("voiceschanged", () => {});
}
