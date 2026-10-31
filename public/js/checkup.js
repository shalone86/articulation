// The first-run "checkup": the learner reads a few short sentences, and the words that
// don't come through clearly point to the sounds (and word-ending habits) to practice first.
// Pure module (no DOM) so the analysis can be tested in Node.

import { scoreSentence, diagnose, normalize } from "./score.js";

/**
 * Each sentence packs several words that test one sound each.
 * probes: word → phoneme id (the sound that word is there to test).
 * Contexts are chosen so look-alike words also make sense ("Very few vans" / "berry"),
 * which keeps the recognizer from silently "fixing" a mispronounced word.
 */
export const CHECKUP_SENTENCES = [
  // No sentence starts with a test word: the recognizer often garbles the very first word.
  { text: "Those three thin thieves think about the weather.", focus: "TH sounds",
    probes: { three: "th-voiceless", thin: "th-voiceless", thieves: "th-voiceless", think: "th-voiceless", weather: "th-voiced" } },
  { text: "Not very many vans went to the zoo for fun.", focus: "V, W, Z and F",
    probes: { very: "v", vans: "v", went: "w", zoo: "z", fun: "f" } },
  { text: "The light rain fell on the red roof.", focus: "L and R",
    probes: { light: "l", rain: "r", fell: "l", red: "r", roof: "r" } },
  { text: "Then she sells cheap shoes at the beach.", focus: "S, SH and CH",
    probes: { she: "sh", sells: "s", cheap: "ch", shoes: "sh", beach: "ch" } },
  { text: "The big dog had a bad bag.", focus: "Word endings and short A",
    probes: { big: "g", dog: "g", had: "d", bad: "short-a", bag: "g" } },
  { text: "His happy horse hid behind the house.", focus: "The H sound",
    probes: { happy: "h", horse: "h", hid: "h", behind: "h", house: "h" } },
  { text: "Please sit in the seat and fill the cup.", focus: "Short and long vowels",
    probes: { sit: "short-i", seat: "long-e", fill: "short-i", cup: "short-u" } },
  { text: "We speak slowly while singing at school.", focus: "Consonant clusters and NG",
    probes: { speak: "s", slowly: "s", singing: "ng", school: "s" } },
  { text: "We walked and played with a yellow jet yesterday.", focus: "-ed endings, Y and J",
    probes: { walked: "t", played: "d", yellow: "y", jet: "j", yesterday: "y" } },
];

// Word-pattern kinds from score.diagnose → the lesson that explains them.
const PATTERN_LESSONS = {
  "final-dropped": { lesson: "final-consonants", name: "Dropping the last sound", example: "cat → ca" },
  "final-devoiced": { lesson: "final-consonants", name: "Last sound losing its buzz", example: "dog → dock" },
  "added-vowel-end": { lesson: "final-consonants", name: "Adding a vowel at the end", example: "big → bigu" },
  "ng-to-nk": { lesson: "final-consonants", name: "-ng turning into -nk", example: "sing → sink" },
  "ng-to-n": { lesson: "nasals", name: "-ng turning into -n", example: "sing → sin" },
  "added-vowel-start": { lesson: "clusters", name: "Extra vowel before s-clusters", example: "school → eschool" },
  "h-dropped": { lesson: "h-sound", name: "Dropping the H", example: "house → ouse" },
  "h-added": { lesson: "h-sound", name: "Adding an H", example: "eat → heat" },
};

const UNCLEAR_PROBABILITY = 0.35; // a word the recognizer wrote, but wasn't sure about

/**
 * @param {{index: number, text: string, words?: {word: string, probability?: number}[]}[]} takes
 *   one transcript per recorded sentence (index into CHECKUP_SENTENCES)
 * @param {{prefer?: string[]}} [options] prefer: sounds common for the learner's first
 *   language; they win ties (never outrank stronger evidence)
 * @returns {{
 *   sounds: {id, score, probes, examples: {word, heard, status}[]}[],   // worst first
 *   patterns: {kind, name, lesson, example, count, examples: string[]}[],
 *   suggested: string[],      // phoneme ids to practice first (up to 4)
 *   clear: number, total: number,
 *   perSentence: {index, words: {word, status, heard?}[]}[],
 * }}
 */
export function analyzeCheckup(takes, { prefer = [] } = {}) {
  const sounds = new Map();
  const patterns = new Map();
  const perSentence = [];
  let clear = 0, total = 0;

  const add = (id, amount, example) => {
    const s = sounds.get(id) ?? { id, score: 0, probes: 0, examples: [] };
    s.probes++;
    s.score += amount;
    if (amount > 0) s.examples.push(example);
    sounds.set(id, s);
  };

  for (const take of takes) {
    const sentence = CHECKUP_SENTENCES[take.index];
    if (!sentence) continue;
    const aligned = scoreSentence(sentence.text, take.text);
    perSentence.push({ index: take.index, words: aligned.words });
    // Word confidences from the recognizer, in order (self-hosted backend only).
    const confidences = (take.words ?? []).map((w) => ({ word: normalize(w.word), p: w.probability }));
    const seen = new Set();
    for (const w of aligned.words) {
      const id = sentence.probes[w.word];
      if (!id || seen.has(w.word)) continue;
      seen.add(w.word);
      total++;
      if (w.status === "ok") {
        const conf = confidences.find((c) => c.word === w.word && c.p != null);
        if (conf && conf.p < UNCLEAR_PROBABILITY) {
          add(id, 0.5, { word: w.word, heard: w.word, status: "unclear" });
        } else {
          clear++;
          add(id, 0);
        }
      } else if (w.status === "changed") {
        add(id, 1, { word: w.word, heard: w.heard, status: "changed" });
        const d = diagnose(w.word, w.heard);
        const info = d && PATTERN_LESSONS[d.kind];
        if (info) {
          const p = patterns.get(d.kind) ?? { kind: d.kind, ...info, count: 0, examples: [] };
          p.count++;
          p.examples.push(`${w.word} → ${w.heard}`);
          patterns.set(d.kind, p);
        }
      } else {
        // Not heard at all: maybe mumbled, maybe just skipped while reading.
        add(id, 0.5, { word: w.word, heard: "", status: "missed" });
      }
    }
  }

  // Rank by miss rate, smoothed so one stray word doesn't outrank a sound that missed
  // three times out of four (score / (probes + 1)), then by how many misses.
  const rate = (x) => x.score / (x.probes + 1);
  const pref = (x) => (prefer.includes(x.id) ? prefer.indexOf(x.id) : prefer.length);
  const ranked = [...sounds.values()]
    .filter((s) => s.score > 0)
    .sort((a, b) => rate(b) - rate(a) || b.score - a.score || pref(a) - pref(b));
  return {
    sounds: ranked,
    patterns: [...patterns.values()].sort((a, b) => b.count - a.count),
    suggested: ranked.filter((s) => s.score >= 1).slice(0, 4).map((s) => s.id),
    clear,
    total,
    perSentence,
  };
}
