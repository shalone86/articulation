// Text-to-speech: server voice (Workers AI / Deepgram Aura) when available,
// otherwise the browser's built-in speechSynthesis.

import { settings } from "./store.js";
import { health, serverTts } from "./api.js";

const cache = new Map(); // text|voice → object URL
let current; // currently playing <audio> element

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
  const h = await health();
  if (src === "server") return true;
  return !!h.tts;
}

export function stop() {
  current?.pause();
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

/**
 * Say text aloud. slow=true plays at ~65% speed.
 * Resolves when playback ends.
 */
export async function speak(text, { slow = false } = {}) {
  stop();
  const rate = (settings().rate || 1) * (slow ? 0.65 : 1);
  if (await useServer()) {
    try {
      const key = `${text}|${settings().serverVoice}`;
      if (!cache.has(key)) cache.set(key, URL.createObjectURL(await serverTts(text, settings().serverVoice)));
      const a = new Audio(cache.get(key));
      a.preservesPitch = true;
      a.playbackRate = rate;
      current = a;
      await a.play();
      await new Promise((r) => { a.onended = r; a.onpause = r; });
      return;
    } catch (e) {
      console.warn("Server TTS failed, falling back to browser voice", e);
    }
  }
  if (!("speechSynthesis" in window)) throw new Error("This browser can’t speak text aloud.");
  await new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v?.lang ?? "en-US";
    u.rate = rate;
    u.onend = u.onerror = resolve;
    speechSynthesis.speak(u);
  });
}

/** Play a recorded clip (object URL). */
export async function playUrl(url) {
  stop();
  const a = new Audio(url);
  current = a;
  await a.play();
  await new Promise((r) => { a.onended = r; a.onpause = r; });
}

// Voices load asynchronously in Chrome.
if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => {};
