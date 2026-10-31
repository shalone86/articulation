import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";

const pub = new URL("../public/", import.meta.url);

test("service worker precaches files that exist, including every JS module", () => {
  const sw = readFileSync(new URL("sw.js", pub), "utf8");
  const assets = JSON.parse(sw.match(/const ASSETS = (\[[\s\S]*?\]);/)[1].replace(/,\s*\]/, "]"));
  for (const a of assets) if (a !== "./") assert.ok(existsSync(new URL(a, pub)), `missing ${a}`);
  const js = [
    ...readdirSync(new URL("js/", pub)).filter((f) => f.endsWith(".js")).map((f) => `js/${f}`),
    ...readdirSync(new URL("js/data/", pub)).map((f) => `js/data/${f}`),
  ];
  for (const f of js) assert.ok(assets.includes(f), `sw.js doesn't precache ${f}`);
});

test("manifest icons exist", () => {
  const m = JSON.parse(readFileSync(new URL("manifest.webmanifest", pub), "utf8"));
  for (const i of m.icons) assert.ok(existsSync(new URL(i.src, pub)), i.src);
  assert.ok(m.icons.some((i) => i.purpose === "maskable" && i.sizes === "512x512"));
});
