// Offline support. The app shell and all practice content are cached, so cards,
// lessons, games and the device voice work without internet. Only the speech
// checker (and the server voice for words not heard before) need a connection.
//
// Strategy: network first for the app (so updates show up right away),
// falling back to the cache when offline; cache first for fonts and voice clips.

const VERSION = "v3";
const SHELL = `shell-${VERSION}`;
const RUNTIME = "runtime-v1";

const ASSETS = [
  "./", "index.html", "manifest.webmanifest", "icon.svg",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png",
  "css/app.css", "css/looks.css",
  "js/app.js", "js/api.js", "js/audio.js", "js/checkup.js", "js/decks.js", "js/score.js", "js/search.js",
  "js/store.js", "js/tts.js", "js/wav.js",
  "js/data/phonemes.js", "js/data/graphemes.js", "js/data/lessons.js",
  "js/data/homophones.js", "js/data/languages.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true })) ?? (await cache.match("index.html")) ?? Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return; // speech checks (POST) always go to the network
  const url = new URL(req.url);
  if (url.origin === location.origin && url.pathname.endsWith("/api/tts")) return e.respondWith(cacheFirst(req));
  if (url.origin === location.origin && url.pathname.includes("/api/")) return; // health etc.: live only
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return e.respondWith(cacheFirst(req));
  if (url.origin === location.origin) e.respondWith(networkFirst(req));
});
