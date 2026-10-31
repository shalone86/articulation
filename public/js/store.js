// Settings and per-learner progress, kept in this browser's localStorage.

const KEY = "articulation:v1";

const DEFAULTS = {
  learners: ["Me"],
  current: "Me",
  settings: {
    language: "", // learner's first language id (for ESL tips)
    showIpa: true,
    ttsSource: "auto", // auto | server | browser
    voice: "", // browser voice name
    serverVoice: "thalia",
    autoSay: true, // say the word when moving to the next card
    rate: 0.9,
    passcode: "",
    kidMode: false,
    look: "playroom", // playroom | studio | pop
  },
  last: null, // { deck, card } — "continue where you left off"
  progress: {}, // learner → { cards: { cardId: {tries, wins, last, at, words: {w: [tries, wins]}} }, pairs: {tries, wins} }
};

let state = load();

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (s) return { ...DEFAULTS, ...s, settings: { ...DEFAULTS.settings, ...s.settings } };
  } catch { /* private mode or corrupted — fall through */ }
  return structuredClone(DEFAULTS);
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
}

export const settings = () => state.settings;
export function setSetting(k, v) { state.settings[k] = v; save(); }

export const lastCard = () => state.last;
export function setLastCard(deck, card) { state.last = { deck, card }; save(); }

export const learners = () => state.learners;
export const currentLearner = () => state.current;
export function setLearner(name) {
  name = name.trim();
  if (!name) return;
  if (!state.learners.includes(name)) state.learners.push(name);
  state.current = name;
  save();
}
export function removeLearner(name) {
  state.learners = state.learners.filter((l) => l !== name);
  delete state.progress[name];
  if (!state.learners.length) state.learners = ["Me"];
  if (!state.learners.includes(state.current)) state.current = state.learners[0];
  save();
}

function mine() {
  return (state.progress[state.current] ??= { cards: {}, pairs: { tries: 0, wins: 0 } });
}

export function cardProgress(id) {
  return mine().cards[id] ?? { tries: 0, wins: 0, words: {} };
}

/** Record an attempt. result is a score result string ("correct", "swap", ...). */
export function recordAttempt(cardId, word, success, result) {
  const c = (mine().cards[cardId] ??= { tries: 0, wins: 0, words: {} });
  c.tries++;
  if (success) c.wins++;
  c.last = result;
  c.at = Date.now();
  const w = (c.words[word] ??= [0, 0]);
  w[0]++;
  if (success) w[1]++;
  save();
}

/** Remember which card the learner was on in a deck, so the deck page can offer "Continue". */
export function setResume(deckId, cardId) {
  (mine().resume ??= {})[deckId] = cardId;
  save();
}
export const resume = (deckId) => mine().resume?.[deckId];

/** new | tried (never matched) | learning (some matches) | mastered (3 stars) */
export function cardStatus(id) {
  const c = cardProgress(id);
  if (!c.tries) return "new";
  if (stars(id) === 3) return "mastered";
  return c.wins ? "learning" : "tried";
}

/** new | tried | won for one practice word on a card. */
export function wordStatus(cardId, word) {
  const w = cardProgress(cardId).words[word];
  return !w ? "new" : w[1] > 0 ? "won" : "tried";
}

/** Latest sentence checkup for this learner: { at, suggested, sounds, patterns, clear, total }. */
export const checkup = () => mine().checkup ?? null;
export function setCheckup(result) {
  const { suggested, sounds, patterns, clear, total } = result;
  mine().checkup = { at: Date.now(), suggested, sounds: sounds.slice(0, 10), patterns, clear, total };
  save();
}
/** The learner chose "maybe later" on the welcome checkup. */
export const checkupSkipped = () => !!mine().checkupSkipped;
export function skipCheckup() { mine().checkupSkipped = true; save(); }

export function recordPair(success) {
  const p = mine().pairs;
  p.tries++;
  if (success) p.wins++;
  save();
}

export const pairStats = () => mine().pairs;
export const allCardProgress = () => mine().cards;

/** 0–3 stars: based on how many different words were said correctly. */
export function stars(cardId) {
  const c = cardProgress(cardId);
  const wordsWon = Object.values(c.words).filter(([, w]) => w > 0).length;
  return wordsWon >= 5 ? 3 : wordsWon >= 3 ? 2 : wordsWon >= 1 ? 1 : 0;
}

export function exportData() { return JSON.stringify(state, null, 2); }
export function importData(json) {
  const s = JSON.parse(json);
  if (!s || !Array.isArray(s.learners)) throw new Error("That file doesn’t look like an Articulation backup.");
  state = { ...DEFAULTS, ...s, settings: { ...DEFAULTS.settings, ...s.settings } };
  save();
}
