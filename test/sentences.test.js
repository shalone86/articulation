import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_CARDS } from "../public/js/decks.js";
import { sentenceFor } from "../public/js/data/word-sentences.js";

const hasWord = (s, w) => new RegExp(`(^|[^a-z])${w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z])`, "i").test(s);

test("every practice word has a sentence with that word in it", () => {
  const missing = [];
  for (const c of ALL_CARDS) for (const w of c.words) if (!hasWord(sentenceFor(c, w), w)) missing.push(`${c.id}: ${w}`);
  assert.deepEqual(missing, []);
});

test("a card's own sentence is kept when it has the word", () => {
  const c = ALL_CARDS.find((x) => x.sentence && x.words.some((w) => hasWord(x.sentence, w)));
  const w = c.words.find((x) => hasWord(c.sentence, x));
  assert.equal(sentenceFor(c, w), c.sentence);
});
