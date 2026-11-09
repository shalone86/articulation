import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index.js";

const fakeKV = () => { const m = new Map(); return { get: async (k, t) => (m.has(k) ? (t === "json" ? JSON.parse(m.get(k)) : m.get(k)) : null), put: async (k, v) => { m.set(k, v); } }; };
const ctx = { pending: [], waitUntil(p) { this.pending.push(p); } };
const speak = (env, code) => worker.fetch(new Request("https://a/api/transcribe", {
  method: "POST", headers: { "content-type": "audio/wav", "cf-connecting-ip": "1.1.1.1", ...(code ? { "x-angelio-code": code } : {}) }, body: new Uint8Array(100),
}), env, ctx).then(async (r) => { await Promise.all(ctx.pending.splice(0)); return { status: r.status, body: await r.json() }; });
const AI = { run: async () => ({ text: "pig", segments: [] }) };

test("speech checks stay open while REQUIRE_CODE is off (as today)", async () => {
  const env = { AI, CODES: fakeKV() };
  for (let i = 0; i < 5; i++) assert.equal((await speak(env)).status, 200);
});

test("with codes on: free tries, then the family code", async () => {
  const env = { AI, CODES: fakeKV(), REQUIRE_CODE: "true", FREE_PER_DAY: "2" };
  await env.CODES.put("code:K7QM-4XPA-2NWD", JSON.stringify({ name: "Smith family", limit: 1 }));
  assert.equal((await speak(env)).status, 200);
  assert.equal((await speak(env)).status, 200);
  const blocked = await speak(env);
  assert.equal(blocked.status, 402); assert.equal(blocked.body.reason, "need-code");
  assert.equal((await speak(env, "K7QM-4XPA-2NWD")).body.text, "pig");
  assert.equal((await speak(env, "K7QM-4XPA-2NWD")).body.reason, "limit");
  const st = await worker.fetch(new Request("https://a/api/code?c=k7qm4xpa2nwd"), env, ctx).then((r) => r.json());
  assert.deepEqual(st, { valid: true, name: "Smith family", limit: 1, left: 0 });
});
