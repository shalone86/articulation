// Compare what the speech recognizer heard with what the learner was trying to say.
// Pure functions (no DOM) so they can be unit-tested in Node.

import { homophonesOf } from "./data/homophones.js";

const NUMBERS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

// Things Whisper tends to "hear" in silence or noise.
const HALLUCINATIONS = new Set([
  "thank you", "thanks for watching", "thank you for watching", "you", "bye", "okay", "so",
  "thank you very much", "please subscribe", "subtitles by the amaraorg community",
]);

export function normalize(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/(\w)'(\w)/g, "$1$2") // they're → theyre
    .replace(/(\w)-(\w)/g, "$1$2") // yo-yo → yoyo
    .replace(/\b\d+\b/g, (n) => NUMBERS[+n] ?? n)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const tokens = (text) => (normalize(text) ? normalize(text).split(" ") : []);

export function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

/** Words that count as "said correctly" for target (itself + homophones). */
function acceptable(target) {
  const t = normalize(target);
  return new Set([t, ...homophonesOf(t)]);
}

/** Map of confusable word → [target, partner] from a card's minimal pairs. */
function partnersFor(target, pairs) {
  const t = normalize(target);
  const out = new Set();
  for (const [a, b] of pairs ?? []) {
    if (normalize(a) === t) out.add(normalize(b));
    if (normalize(b) === t) out.add(normalize(a));
  }
  return out;
}

const VOWEL_TAILS = new Set(["a", "e", "i", "o", "u", "y", "uh", "ah", "oh", "ie", "ee", "oo", "er"]);
const VOICED_TO_VOICELESS = { b: "p", d: "t", g: "k", v: "f", z: "s" };

/** Guess what kind of change turned target into heard. Returns {kind, message} or null. */
export function diagnose(target, heard) {
  const t = normalize(target);
  const h = normalize(heard);
  if (!t || !h || t === h) return null;

  if (t.startsWith("h") && h === t.slice(1))
    return { kind: "h-dropped", message: "The /h/ at the start went missing. Breathe out a little puff of air before the vowel." };
  if (h === "h" + t)
    return { kind: "h-added", message: "An extra /h/ crept in at the start. This word starts right on the vowel." };
  if (/^s[ptkcqmnlw]/.test(t) && /^[eiau]s/.test(h) && h.slice(1) === t)
    return { kind: "added-vowel-start", message: "It sounded like there was an extra vowel before the s (“e-” + word). Start straight on the hiss: ssss…" };
  if (h.startsWith(t) && VOWEL_TAILS.has(h.slice(t.length)))
    return { kind: "added-vowel-end", message: "It sounded like an extra vowel was added at the end. Close the last sound and stop — no extra breath of voice." };
  if (/ng$/.test(t) && (h === t.slice(0, -1) + "k" || h === t.slice(0, -2) + "nk"))
    return { kind: "ng-to-nk", message: "The -ng ending turned into -nk. Hold the hum through your nose and stop — no click at the end." };
  if (/ng$/.test(t) && h === t.slice(0, -1))
    return { kind: "ng-to-n", message: "The -ng ending sounded like -n. Lift the back of your tongue (like for /g/) and hum." };
  if (t.startsWith(h) && t.length - h.length <= 2 && h.length >= 1)
    return { kind: "final-dropped", message: "The end of the word got lost. Make sure your mouth closes the last sound." };

  // Final voiced → voiceless (dog → dock, bed → bet, leave → leaf, eyes → ice)
  const tEnd = t.replace(/e$/, "").slice(-1);
  const devoiced = VOICED_TO_VOICELESS[tEnd];
  if (devoiced) {
    const stem = t.replace(/e$/, "").slice(0, -1);
    const hStem = h.replace(/e$/, "");
    if (hStem.startsWith(stem.slice(0, Math.max(1, stem.length - 1))) && /[ptkfsc]k?$/.test(hStem) && hStem.length <= stem.length + 2)
      return { kind: "final-devoiced", message: "The last sound lost its buzz (a voiced sound became voiceless). Stretch the vowel and keep your voice on to the very end." };
  }

  let pre = 0;
  while (pre < Math.min(t.length, h.length) && t[pre] === h[pre]) pre++;
  let suf = 0;
  while (suf < Math.min(t.length, h.length) - pre && t[t.length - 1 - suf] === h[h.length - 1 - suf]) suf++;
  const where = pre === 0 ? "beginning" : suf === 0 ? "end" : "middle";
  return { kind: `changed-${where}`, message: `The ${where} of the word sounded different.` };
}

/**
 * Score a single-word attempt.
 * @returns {{result: "correct"|"homophone"|"swap"|"close"|"different"|"nothing", heard: string, word?: string, diagnosis?: object}}
 *   result:
 *     correct    – recognizer wrote the target word
 *     homophone  – wrote a word that sounds identical (counts as correct)
 *     swap       – wrote the known minimal-pair partner (e.g. "sink" for "think")
 *     close      – a near miss by spelling distance
 *     different  – something else
 *     nothing    – no speech / only recognizer noise
 */
export function scoreWord(target, transcript, { pairs = [] } = {}) {
  const heard = normalize(transcript);
  if (!heard || (HALLUCINATIONS.has(heard) && !acceptable(target).has(heard)))
    return { result: "nothing", heard };

  const t = normalize(target);
  const ok = acceptable(target);
  const partners = partnersFor(target, pairs);
  const words = heard.split(" ");

  // Phrase match, e.g. target "ice cream" or a homophone like "they're".
  if (ok.has(heard) || ok.has(heard.replace(/ /g, "")))
    return { result: heard.replace(/ /g, "") === t || heard === t ? "correct" : "homophone", heard, word: heard };

  const rank = { correct: 5, homophone: 4, swap: 3, close: 2, different: 1 };
  let best = { result: "different", heard, word: words[0] };
  for (const w of words) {
    let r;
    if (w === t) r = { result: "correct", word: w };
    else if (ok.has(w)) r = { result: "homophone", word: w };
    else if (partners.has(w)) r = { result: "swap", word: w };
    else if (levenshtein(w, t) <= Math.max(1, Math.floor(t.length / 3))) r = { result: "close", word: w };
    else r = { result: "different", word: w };
    if (rank[r.result] > rank[best.result]) best = { ...r, heard };
  }
  if (best.result === "different" && words.length > 1) {
    // Pick the word closest to the target to explain.
    best.word = words.reduce((a, b) => (levenshtein(a, t) <= levenshtein(b, t) ? a : b));
  }
  if (["swap", "close", "different"].includes(best.result)) best.diagnosis = diagnose(t, best.word);
  return best;
}

/**
 * Align a sentence attempt word by word.
 * @returns {{score: number, words: {word: string, status: "ok"|"missed"|"changed", heard?: string}[], extra: string[]}}
 */
export function scoreSentence(target, transcript) {
  const T = tokens(target);
  const H = tokens(transcript);
  const same = (a, b) => a === b || acceptable(a).has(b);
  // Edit-distance alignment over words.
  const n = T.length, m = H.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (same(T[i - 1], H[j - 1]) ? 0 : 1));

  const words = [];
  const extra = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (same(T[i - 1], H[j - 1]) ? 0 : 1)) {
      words.unshift(same(T[i - 1], H[j - 1])
        ? { word: T[i - 1], status: "ok" }
        : { word: T[i - 1], status: "changed", heard: H[j - 1] });
      i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      words.unshift({ word: T[i - 1], status: "missed" });
      i--;
    } else {
      extra.unshift(H[j - 1]);
      j--;
    }
  }
  const ok = words.filter((w) => w.status === "ok").length;
  return { score: n ? ok / n : 0, words, extra };
}

export const isSuccess = (r) => r.result === "correct" || r.result === "homophone";

/** Words to send for forced-choice scoring: the target, its homophones and its look-alikes. */
export function candidatesFor(target, pairs = []) {
  return [...new Set([...acceptable(target), ...partnersFor(target, pairs)])].slice(0, 8);
}

// How much more likely (in log-probability) a look-alike must be before we call it a swap,
// and how far the target may trail the best rival and still count as said.
// Tuned on real recordings (Google Speech Commands, whisper base.en): correct words that open
// transcription misheard trailed by 0.1–5.0; wrong words trailed by ≥ 2.1; a real "no"
// judged as "go" by ≥ 7.6. At 1.5 no wrong word was accepted.
const SWAP_MARGIN = 1.0;
const ACCEPT_MARGIN = -1.5;

/**
 * Second opinion from forced-choice scores ({word: logprob}, from the self-hosted backend).
 * Open transcription of a single short word often misses even when it was said well
 * ("pig" → "Pick."); here Whisper only has to choose between the target and its look-alikes.
 */
export function refineWithScores(result, target, scores, pairs = []) {
  if (!scores || isSuccess(result) || result.result === "nothing") return result;
  const ok = acceptable(target);
  const partners = partnersFor(target, pairs);
  const targetScore = Math.max(...[...ok].map((w) => scores[w] ?? -Infinity));
  if (!Number.isFinite(targetScore)) return result;
  // Rivals: the look-alikes, plus whatever open transcription heard (the server scores those too).
  let rival = null;
  for (const [w, sc] of Object.entries(scores)) {
    const nw = normalize(w);
    if (ok.has(nw) || !Number.isFinite(sc)) continue;
    if (!rival || sc > scores[rival]) rival = w;
  }
  const rivalScore = rival ? scores[rival] : -Infinity;
  if (rival && partners.has(normalize(rival)) && rivalScore > targetScore + SWAP_MARGIN)
    return { result: "swap", heard: result.heard, word: normalize(rival), diagnosis: diagnose(target, rival), checked: true };
  if (targetScore >= rivalScore + ACCEPT_MARGIN)
    return { result: "correct", heard: result.heard, word: normalize(target), checked: true };
  return result;
}
