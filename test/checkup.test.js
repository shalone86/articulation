import { test } from "node:test";
import assert from "node:assert/strict";
import { CHECKUP_SENTENCES, analyzeCheckup } from "../public/js/checkup.js";
import { phonemeById } from "../public/js/data/phonemes.js";
import { normalize } from "../public/js/score.js";

test("every probe word is in its sentence and tests a real sound", () => {
  for (const s of CHECKUP_SENTENCES) {
    const words = normalize(s.text).split(" ");
    for (const [w, id] of Object.entries(s.probes)) {
      assert.ok(words.includes(w), `${w} not in "${s.text}"`);
      assert.ok(phonemeById[id], `${w} → unknown sound ${id}`);
    }
  }
});

test("a clean reading suggests nothing", () => {
  const r = analyzeCheckup(CHECKUP_SENTENCES.map((s, index) => ({ index, text: s.text })));
  assert.equal(r.suggested.length, 0);
  assert.equal(r.clear, r.total);
  assert.ok(r.total >= 40);
});

test("a typical ESL reading points at TH, V and word endings", () => {
  const heard = [
    "Those tree tin teeves sink about the wedder.", // th → t/s/d
    "Not berry many bans went to the zoo for fun.", // v → b
    "The light rain fell on the red roof.",
    "Then she sells cheap shoes at the beach.",
    "The bick dock had a bad back.",              // final devoicing
    "His happy horse hid behind the house.",
    "Please sit in the sit and fill the cup.",     // seat → sit
    "We espeak slowly while singing at eschool.",
    "We walked and played with a yellow jet yesterday.",
  ];
  const r = analyzeCheckup(heard.map((text, index) => ({ index, text })));
  assert.equal(r.suggested[0], "th-voiceless", JSON.stringify(r.suggested));
  assert.ok(r.suggested.includes("v"));
  assert.ok(r.suggested.includes("g"));
  const kinds = r.patterns.map((p) => p.kind);
  assert.ok(kinds.includes("final-devoiced"), kinds.join(","));
  assert.ok(kinds.includes("added-vowel-start"), kinds.join(","));
});

test("low-confidence words count as unclear, missing words count half", () => {
  const s = CHECKUP_SENTENCES[2];
  const r = analyzeCheckup([{ index: 2, text: "Light rain fell on the roof.",
    words: s.text.split(" ").map((w) => ({ word: w, probability: w.toLowerCase().startsWith("light") ? 0.1 : 0.9 })) }]);
  const l = r.sounds.find((x) => x.id === "l");
  const red = r.sounds.find((x) => x.id === "r");
  assert.equal(l.score, 0.5);
  assert.equal(red.score, 0.5); // "red" missing
});
