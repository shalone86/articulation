import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, scoreWord, scoreSentence, diagnose } from "../public/js/score.js";

test("normalize strips punctuation, case, apostrophes, hyphens, digits", () => {
  assert.equal(normalize("  Pig! "), "pig");
  assert.equal(normalize("They’re"), "theyre");
  assert.equal(normalize("Yo-yo."), "yoyo");
  assert.equal(normalize("2"), "two");
  assert.equal(normalize("8 cats"), "eight cats");
});

test("exact word is correct", () => {
  assert.equal(scoreWord("think", "Think.").result, "correct");
  assert.equal(scoreWord("think", "I think").result, "correct");
});

test("homophone counts as correct", () => {
  const r = scoreWord("knight", "Night.");
  assert.equal(r.result, "homophone");
  assert.equal(scoreWord("two", "2").result, "correct");
  assert.equal(scoreWord("their", "they're").result, "homophone");
});

test("minimal-pair partner is reported as a swap", () => {
  const r = scoreWord("think", "Sink.", { pairs: [["think", "sink"]] });
  assert.equal(r.result, "swap");
  assert.equal(r.word, "sink");
  // reverse direction works too
  assert.equal(scoreWord("sink", "think", { pairs: [["think", "sink"]] }).result, "swap");
});

test("silence and hallucinations are 'nothing'", () => {
  assert.equal(scoreWord("pig", "").result, "nothing");
  assert.equal(scoreWord("pig", " Thank you. ").result, "nothing");
  assert.equal(scoreWord("you", "You").result, "correct");
});

test("near misses are close, unrelated words are different", () => {
  assert.equal(scoreWord("rabbit", "wabbit").result, "close");
  assert.equal(scoreWord("elephant", "banana").result, "different");
});

test("diagnoses common patterns", () => {
  assert.equal(diagnose("hat", "at").kind, "h-dropped");
  assert.equal(diagnose("eat", "heat").kind, "h-added");
  assert.equal(diagnose("school", "eschool").kind, "added-vowel-start");
  assert.equal(diagnose("big", "bigu").kind, "added-vowel-end");
  assert.equal(diagnose("cat", "ca").kind, "final-dropped");
  assert.equal(diagnose("sing", "sink").kind, "ng-to-nk");
  assert.equal(diagnose("sing", "sin").kind, "ng-to-n");
  assert.equal(diagnose("dog", "dock").kind, "final-devoiced");
  assert.equal(diagnose("bed", "bet").kind, "final-devoiced");
  assert.equal(diagnose("leave", "leaf").kind, "final-devoiced");
  assert.equal(diagnose("think", "fink").kind, "changed-beginning");
});

test("sentence alignment marks missed and changed words", () => {
  const r = scoreSentence("I think three thin thieves", "I sink three tin thieves");
  assert.deepEqual(r.words.map((w) => w.status), ["ok", "changed", "ok", "changed", "ok"]);
  assert.equal(r.words[1].heard, "sink");
  assert.equal(r.score, 3 / 5);
  const m = scoreSentence("the big red dog", "the red dog");
  assert.deepEqual(m.words.map((w) => w.status), ["ok", "missed", "ok", "ok"]);
});

import { refineWithScores, candidatesFor, isSuccess } from "../public/js/score.js";

test("forced-choice scores rescue a misheard correct word", () => {
  const open = scoreWord("pig", "Pick.", { pairs: [["pig", "big"]] });
  assert.ok(!isSuccess(open));
  const r = refineWithScores(open, "pig", { pig: -3.1, big: -6.0, pick: -3.4 }, [["pig", "big"]]);
  assert.equal(r.result, "correct");
  assert.ok(r.checked);
});

test("forced-choice detects a minimal-pair swap", () => {
  const open = scoreWord("think", "Thing", { pairs: [["think", "sink"]] });
  const r = refineWithScores(open, "think", { think: -7, sink: -2, thing: -5 }, [["think", "sink"]]);
  assert.equal(r.result, "swap");
  assert.equal(r.word, "sink");
});

test("forced-choice does not accept a clearly different word", () => {
  const open = scoreWord("go", "banana", { pairs: [["go", "no"]] });
  const r = refineWithScores(open, "go", { go: -9, no: -8.5, banana: -1 }, [["go", "no"]]);
  assert.equal(r.result, "different");
});

test("candidates include homophones and look-alikes", () => {
  assert.deepEqual(candidatesFor("knight", [["knight", "kite"]]).sort(), ["kite", "knight", "night"]);
});
