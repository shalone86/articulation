// Search across practice words, sounds, spellings, lessons and homophones.
// Pure module (no DOM) so it can be tested in Node.

import { ALL_CARDS } from "./decks.js";
import { LESSONS } from "./data/lessons.js";
import { HOMOPHONES, homophonesOf } from "./data/homophones.js";
import { GRAPHEMES } from "./data/graphemes.js";
import { normalize } from "./score.js";

const stripHtml = (s) => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
const clean = (w) => w.replace(/ \(.*\)$/, ""); // "heart (with r)" → "heart"

// word → Set(cardId): every place a word is practiced or shown as an example.
const wordIndex = new Map();
function addWord(word, cardId) {
  const key = normalize(clean(word));
  if (!key || key.includes(" ")) return;
  if (!wordIndex.has(key)) wordIndex.set(key, { word: clean(word), cards: new Set() });
  wordIndex.get(key).cards.add(cardId);
}
for (const c of ALL_CARDS) {
  c.words.forEach((w) => addWord(w, c.id));
  c.p?.spellings.forEach(([, w]) => addWord(w, c.id));
  c.p?.pairs?.forEach(([a]) => addWord(a, c.id)); // the first word of a pair has this card's sound
  c.g?.sounds.forEach(([, w]) => addWord(w, c.id));
  for (const w of (c.sentence ?? "").split(/\s+/)) if (w.length > 3) addWord(w, c.id);
}

const lessonText = LESSONS.map((l) => ({
  l,
  text: [l.title, l.summary, ...l.sections.flatMap((s) => [s.h, stripHtml(s.html), ...(s.words ?? []), ...(s.pairs ?? []).flat()])].join(" ").toLowerCase(),
}));

export const wordCount = () => wordIndex.size;

/** Cards that practice this word (card objects). */
export function cardsForWord(word) {
  const hit = wordIndex.get(normalize(word));
  return hit ? [...hit.cards].map((id) => ALL_CARDS.find((c) => c.id === id)) : [];
}

/**
 * Spelling patterns that appear in an arbitrary word — a guess from letters alone,
 * longest patterns first, so "night" finds "igh" rather than "gh".
 */
export function patternsIn(word) {
  const w = normalize(word);
  const found = [];
  const taken = new Array(w.length).fill(false);
  const pats = GRAPHEMES
    .flatMap((g) => g.g.split(/\s*\/\s*/).map((s) => ({ s: s.replace(/ \(.*\)$/, ""), g })))
    .filter(({ s }) => /^[a-z_]+$/.test(s) && s.length >= 2)
    .sort((a, b) => b.s.length - a.s.length);
  for (const { s, g } of pats) {
    if (s.includes("_")) {
      // split digraph a_e: vowel, one consonant, final e
      const [v] = s;
      if (new RegExp(`${v}[^aeiou]e$`).test(w) && !found.includes(g)) found.push(g);
      continue;
    }
    let i = w.indexOf(s);
    while (i >= 0) {
      if (!taken.slice(i, i + s.length).some(Boolean)) {
        for (let k = i; k < i + s.length; k++) taken[k] = true;
        if (!found.includes(g)) found.push(g);
      }
      i = w.indexOf(s, i + 1);
    }
  }
  return found;
}

/**
 * @returns {{words: {word, cards}[], cards: card[], lessons: {l, snippet}[], homophones: string[][][]}}
 */
export function search(query) {
  const q = normalize(query);
  const raw = String(query ?? "").trim().toLowerCase();
  const out = { words: [], cards: [], lessons: [], homophones: [] };
  if (!q && !raw) return out;

  // Words: exact first, then prefix matches.
  const exact = wordIndex.get(q);
  if (exact) out.words.push(exact);
  for (const h of homophonesOf(q)) if (wordIndex.has(h)) out.words.push(wordIndex.get(h)); // night → knight
  if (q.length >= 2) {
    for (const [k, v] of wordIndex) {
      if (k !== q && k.startsWith(q) && !out.words.includes(v)) out.words.push(v);
      if (out.words.length >= 30) break;
    }
  }
  out.words = out.words.map((v) => ({ word: v.word, cards: [...v.cards].map((id) => ALL_CARDS.find((c) => c.id === id)) }));

  // Sounds & spellings by name, grapheme or IPA symbol.
  const strip = (s) => String(s ?? "").toLowerCase().replace(/[()]/g, "");
  out.cards = ALL_CARDS.filter((c) => {
    const names = [c.big, c.ipa, c.p?.label, c.p?.nick, c.g?.g, c.p?.manner, c.g?.type].map(strip);
    return names.some((n) => n && (n === raw || n.split(/[\s/]+/).includes(raw) || (raw.length >= 3 && n.includes(raw))));
  });

  // Lessons.
  if (raw.length >= 3) {
    for (const { l, text } of lessonText) {
      const i = text.indexOf(raw);
      if (i < 0) continue;
      out.lessons.push({ l, snippet: text.slice(Math.max(0, i - 50), i + raw.length + 70) });
    }
  }

  // Homophone groups containing the word.
  out.homophones = HOMOPHONES.filter((g) => g.some(([w]) => normalize(w) === q || (q.length >= 3 && normalize(w).startsWith(q))));
  return out;
}
