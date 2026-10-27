// Turns phoneme and grapheme data into practice cards, grouped into decks.

import { PHONEMES, phonemeById, phonemeWords, MANNERS } from "./data/phonemes.js";
import { GRAPHEMES, GRAPHEME_TYPES } from "./data/graphemes.js";
import { settings, allCardProgress } from "./store.js";
import { languageName } from "./data/languages.js";

function soundCard(p) {
  return {
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
  { id: "consonants", name: "Consonant sounds", emoji: "🅱️", group: "Sounds", cards: sounds((p) => p.group === "consonant") },
  { id: "vowels", name: "Vowel sounds", emoji: "🅰️", group: "Sounds", cards: sounds((p) => p.group === "vowel" || p.group === "diphthong") },
  { id: "r-vowels", name: "R-controlled vowels", emoji: "🏴‍☠️", group: "Sounds", cards: sounds((p) => p.group === "r-vowel") },
  ...Object.entries(MANNERS)
    .filter(([m]) => m !== "glide")
    .map(([m, info]) => ({
      id: m,
      name: m === "liquid" ? "Liquids & glides" : info.name,
      emoji: { plosive: "💥", fricative: "🌬️", affricate: "🚂", nasal: "👃", liquid: "🌊" }[m],
      group: "Sounds by type",
      cards: sounds((p) => p.manner === m || (m === "liquid" && p.manner === "glide")),
    })),
  { id: "voicing", name: "Voiced/voiceless partners", emoji: "🐝", group: "Sounds by type", cards: sounds((p) => !!p.partner) },
  { id: "digraphs", name: "Consonant digraphs", emoji: "🔠", group: "Spellings", cards: spellings("consonant-digraph", "glued") },
  { id: "trigraphs", name: "Trigraphs & quadgraphs", emoji: "🔡", group: "Spellings", cards: spellings("trigraph", "quadgraph") },
  { id: "vowel-teams", name: "Vowel teams", emoji: "👯", group: "Spellings", cards: spellings("vowel-digraph") },
  { id: "magic-e", name: "Magic e", emoji: "🪄", group: "Spellings", cards: spellings("split-digraph") },
  { id: "bossy-r", name: "Bossy R spellings", emoji: "🦖", group: "Spellings", cards: spellings("r-controlled") },
  { id: "silent", name: "Silent letters", emoji: "🤫", group: "Spellings", cards: spellings("silent") },
  {
    id: "focus", name: "My focus sounds", emoji: "🎯", group: "For you",
    describe: () => settings().language
      ? `Sounds that are often tricky for ${languageName(settings().language)} speakers.`
      : "Pick your first language in Settings to get a personal deck.",
    cards: () => SOUND_CARDS.filter((c) => settings().language && c.p.esl?.[settings().language]),
  },
  {
    id: "review", name: "Needs practice", emoji: "🔁", group: "For you",
    describe: () => "Cards where your last try didn’t match.",
    cards: () => {
      const prog = allCardProgress();
      return ALL_CARDS.filter((c) => prog[c.id] && !["correct", "homophone"].includes(prog[c.id].last));
    },
  },
];

export const deckById = Object.fromEntries(DECKS.map((d) => [d.id, d]));
export { GRAPHEME_TYPES };
