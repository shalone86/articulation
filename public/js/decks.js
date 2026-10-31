// Turns phoneme and grapheme data into practice cards, grouped into decks.

import { PHONEMES, phonemeById, phonemeWords, MANNERS } from "./data/phonemes.js";
import { GRAPHEMES, GRAPHEME_TYPES } from "./data/graphemes.js";
import { settings, allCardProgress, checkup } from "./store.js";
import { languageName } from "./data/languages.js";
import { l1Focus } from "./data/l1-focus.js";

/** Color family for a card: plosive | fricative | affricate | nasal | liquid | vowel | rvowel | spelling */
export function category(p) {
  if (!p) return "spelling";
  if (p.manner) return p.manner === "glide" ? "liquid" : p.manner;
  return p.group === "r-vowel" ? "rvowel" : "vowel";
}

function soundCard(p) {
  return {
    cat: category(p),
    id: `s-${p.id}`,
    kind: "sound",
    big: p.label,
    ipa: p.ipa,
    emoji: p.emoji,
    words: phonemeWords(p),
    sentence: p.sentence,
    pairs: p.pairs ?? [],
    p,
  };
}

function spellingCard(g) {
  // Use the minimal pairs of the sounds this spelling makes, for better feedback.
  const pairs = g.sounds.flatMap(([id]) => phonemeById[id]?.pairs ?? []);
  return {
    id: g.id,
    kind: "spelling",
    cat: "spelling",
    big: g.g,
    words: g.words,
    sentence: g.sentence,
    pairs,
    g,
  };
}

export const SOUND_CARDS = PHONEMES.map(soundCard);
export const SPELLING_CARDS = GRAPHEMES.map(spellingCard);
export const ALL_CARDS = [...SOUND_CARDS, ...SPELLING_CARDS];
export const cardById = Object.fromEntries(ALL_CARDS.map((c) => [c.id, c]));

const sounds = (pred) => () => SOUND_CARDS.filter((c) => pred(c.p));
const spellings = (...types) => () => SPELLING_CARDS.filter((c) => types.includes(c.g.type));

export const DECKS = [
  { id: "consonants", name: "Consonant sounds", emoji: "🅱️", cat: "plosive", group: "Sounds", cards: sounds((p) => p.group === "consonant") },
  { id: "vowels", name: "Vowel sounds", emoji: "🅰️", cat: "vowel", group: "Sounds", cards: sounds((p) => p.group === "vowel" || p.group === "diphthong") },
  { id: "r-vowels", name: "R-controlled vowels", emoji: "🏴‍☠️", cat: "rvowel", group: "Sounds", cards: sounds((p) => p.group === "r-vowel") },
  ...Object.entries(MANNERS)
    .filter(([m]) => m !== "glide")
    .map(([m, info]) => ({
      id: m,
      name: m === "liquid" ? "Liquids & glides" : info.name,
      emoji: { plosive: "💥", fricative: "🌬️", affricate: "🚂", nasal: "👃", liquid: "🌊" }[m],
      group: "Sounds by type",
      cat: m,
      cards: sounds((p) => p.manner === m || (m === "liquid" && p.manner === "glide")),
    })),
  { id: "voicing", name: "Voiced/voiceless partners", emoji: "🐝", cat: "fricative", group: "Sounds by type", cards: sounds((p) => !!p.partner) },
  { id: "digraphs", name: "Consonant digraphs", emoji: "🔠", cat: "spelling", group: "Spellings", cards: spellings("consonant-digraph", "glued") },
  { id: "trigraphs", name: "Trigraphs & quadgraphs", emoji: "🔡", cat: "spelling", group: "Spellings", cards: spellings("trigraph", "quadgraph") },
  { id: "vowel-teams", name: "Vowel teams", emoji: "👯", cat: "spelling", group: "Spellings", cards: spellings("vowel-digraph") },
  { id: "magic-e", name: "Magic e", emoji: "🪄", cat: "spelling", group: "Spellings", cards: spellings("split-digraph") },
  { id: "bossy-r", name: "Bossy R spellings", emoji: "🦖", cat: "spelling", group: "Spellings", cards: spellings("r-controlled") },
  { id: "silent", name: "Silent letters", emoji: "🤫", cat: "spelling", group: "Spellings", cards: spellings("silent") },
  {
    id: "checkup", name: "From my checkup", emoji: "🩺", cat: "rvowel", group: "For you",
    describe: () => checkup()
      ? "The sounds your sentence checkup suggested practicing first."
      : "Take the 2-minute sentence checkup to fill this deck.",
    cards: () => (checkup()?.suggested ?? []).map((id) => SOUND_CARDS.find((c) => c.p.id === id)).filter(Boolean),
  },
  {
    id: "focus", name: "My focus sounds", emoji: "🎯", cat: "affricate", group: "For you",
    describe: () => settings().language
      ? `Sounds that are often tricky for ${languageName(settings().language)} speakers.`
      : "Pick your first language in Settings to get a personal deck.",
    cards: () => {
      const lang = settings().language;
      if (!lang) return [];
      // The language's "start here" sounds first, in order, then every other sound with a note.
      const first = (l1Focus(lang)?.sounds ?? []).map((id) => SOUND_CARDS.find((c) => c.p.id === id)).filter(Boolean);
      return [...first, ...SOUND_CARDS.filter((c) => !first.includes(c) && c.p.esl?.[lang])];
    },
  },
  {
    id: "review", name: "Needs practice", emoji: "🔁", cat: "nasal", group: "For you",
    describe: () => "Cards where your last try didn’t match.",
    cards: () => {
      const prog = allCardProgress();
      return ALL_CARDS.filter((c) => prog[c.id] && !["correct", "homophone"].includes(prog[c.id].last));
    },
  },
];

export const deckById = Object.fromEntries(DECKS.map((d) => [d.id, d]));
export { GRAPHEME_TYPES };
