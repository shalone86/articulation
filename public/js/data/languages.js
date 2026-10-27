// First languages (L1) we have targeted pronunciation notes for.
// Notes in phonemes.js are keyed by these ids.
export const LANGUAGES = [
  { id: "arabic", name: "Arabic" },
  { id: "cantonese", name: "Cantonese" },
  { id: "farsi", name: "Farsi / Persian" },
  { id: "french", name: "French" },
  { id: "german", name: "German" },
  { id: "greek", name: "Greek" },
  { id: "hindi", name: "Hindi / Urdu" },
  { id: "italian", name: "Italian" },
  { id: "japanese", name: "Japanese" },
  { id: "korean", name: "Korean" },
  { id: "mandarin", name: "Mandarin Chinese" },
  { id: "polish", name: "Polish" },
  { id: "portuguese", name: "Portuguese" },
  { id: "russian", name: "Russian / Ukrainian" },
  { id: "spanish", name: "Spanish" },
  { id: "tagalog", name: "Tagalog / Filipino" },
  { id: "thai", name: "Thai" },
  { id: "turkish", name: "Turkish" },
  { id: "vietnamese", name: "Vietnamese" },
];

export const languageName = (id) =>
  LANGUAGES.find((l) => l.id === id)?.name ?? id;
