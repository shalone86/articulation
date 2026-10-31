import { test } from "node:test";
import assert from "node:assert/strict";
import { search, cardsForWord, patternsIn, wordCount } from "../public/js/search.js";

test("indexes hundreds of words", () => assert.ok(wordCount() > 400, String(wordCount())));

test("finds a practice word and the cards that use it", () => {
  const r = search("Thumb");
  assert.equal(r.words[0].word, "thumb");
  assert.ok(r.words[0].cards.some((c) => c.id === "s-th-voiceless"));
  assert.ok(cardsForWord("knight").some((c) => c.id === "g-kn"));
});

test("finds sounds and spellings by name and IPA", () => {
  assert.ok(search("igh").cards.some((c) => c.id === "g-igh"));
  assert.ok(search("θ").cards.some((c) => c.id === "s-th-voiceless"));
  assert.ok(search("schwa").cards.some((c) => c.id === "s-schwa"));
  assert.ok(search("fricative").cards.length >= 9);
});

test("finds lessons and homophones", () => {
  assert.ok(search("aspiration").lessons.some(({ l }) => l.id === "plosives"));
  assert.ok(search("flour").homophones.length === 1);
});

test("guesses spelling patterns in unknown words", () => {
  const ids = (w) => patternsIn(w).map((g) => g.id);
  assert.ok(ids("brighten").includes("g-igh"));
  assert.ok(!ids("brighten").includes("g-gh"));
  assert.ok(ids("shine").includes("g-sh") && ids("shine").includes("g-i_e"));
});

test("search lists homophones of the query as words", () => {
  const words = search("night").words.map((w) => w.word);
  assert.ok(words.includes("night") && words.includes("knight"), words.join(","));
});
