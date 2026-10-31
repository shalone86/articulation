import { test } from "node:test";
import assert from "node:assert/strict";
import { PHONEMES, phonemeById } from "../public/js/data/phonemes.js";
import { GRAPHEMES } from "../public/js/data/graphemes.js";
import { LESSONS } from "../public/js/data/lessons.js";
import { LANGUAGES } from "../public/js/data/languages.js";
import { HOMOPHONES, homophonesOf } from "../public/js/data/homophones.js";

const langIds = new Set(LANGUAGES.map((l) => l.id));

test("all sounds have unique ids and complete fields", () => {
  assert.ok(PHONEMES.length >= 44);
  assert.equal(new Set(PHONEMES.map((p) => p.id)).size, PHONEMES.length);
  for (const p of PHONEMES) {
    for (const f of ["ipa", "label", "key", "how", "tip", "sentence"]) assert.ok(p[f], `${p.id}.${f}`);
    assert.ok(p.spellings.length, `${p.id} spellings`);
    assert.ok(p.words || p.positions, `${p.id} words`);
    if (p.partner) assert.equal(phonemeById[p.partner]?.partner, p.id, `${p.id} partner is mutual`);
    for (const l of Object.keys(p.esl ?? {})) assert.ok(langIds.has(l), `${p.id}: unknown language ${l}`);
    for (const pair of p.pairs ?? []) assert.equal(pair.length, 2, `${p.id} pair ${pair}`);
  }
  assert.equal(PHONEMES.filter((p) => p.group === "consonant").length, 24);
});

test("graphemes reference real sounds", () => {
  assert.equal(new Set(GRAPHEMES.map((g) => g.id)).size, GRAPHEMES.length);
  for (const g of GRAPHEMES) {
    for (const [id] of g.sounds) assert.ok(phonemeById[id], `${g.id} → ${id}`);
    assert.ok(g.words.length >= 3 && g.sentence && g.note, g.id);
  }
});

test("lessons link to real cards", () => {
  for (const l of LESSONS) for (const s of l.sections) for (const c of s.cards ?? []) assert.ok(phonemeById[c], `${l.id} → ${c}`);
});

test("homophone index is symmetric", () => {
  for (const group of HOMOPHONES) {
    const [a, b] = group.map(([w]) => w.toLowerCase().replace(/[’']/g, ""));
    assert.ok(homophonesOf(a).includes(b) && homophonesOf(b).includes(a), `${a}/${b}`);
  }
});

import { L1_FOCUS } from "../public/js/data/l1-focus.js";
import { lessonById } from "../public/js/data/lessons.js";

test("every first language has a valid start-here list", () => {
  for (const l of LANGUAGES) {
    const f = L1_FOCUS[l.id];
    assert.ok(f, `no L1 focus for ${l.id}`);
    assert.ok(f.why && f.sounds.length >= 4, l.id);
    for (const id of f.sounds) assert.ok(phonemeById[id], `${l.id} → unknown sound ${id}`);
    for (const id of f.lessons) assert.ok(lessonById[id], `${l.id} → unknown lesson ${id}`);
  }
});
