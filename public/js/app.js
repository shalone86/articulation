// Articulation Workshop — single-page app (no build step).

import { PHONEMES, phonemeById, MANNERS } from "./data/phonemes.js";
import { LANGUAGES, languageName } from "./data/languages.js";
import { LESSONS, lessonById } from "./data/lessons.js";
import { HOMOPHONES, HETERONYMS } from "./data/homophones.js";
import { DECKS, deckById, cardById, ALL_CARDS, GRAPHEME_TYPES } from "./decks.js";
import { Recorder, micSupported } from "./audio.js";
import { scoreWord, scoreSentence, isSuccess, candidatesFor, refineWithScores, normalize } from "./score.js";
import { speak, playUrl, stop as stopAudio, browserVoices, prefetch } from "./tts.js";
import { health, transcribe } from "./api.js";
import { search, cardsForWord, patternsIn } from "./search.js";
import { CHECKUP_SENTENCES, analyzeCheckup } from "./checkup.js";
import * as store from "./store.js";

const $app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ipa = (s) => (store.settings().showIpa && s ? `<span class="ipa">/${esc(s)}/</span>` : "");
const say = (text, label = text, cls = "") =>
  `<button class="say ${cls}" data-say="${esc(text)}" title="Hear “${esc(text)}”"><span aria-hidden="true">🔊</span> ${esc(label)}</button>`;
const pairBtns = ([a, b]) => `<span class="pair">${say(a)}<span class="vs">vs</span>${say(b)}</span>`;
const stars = (n) => `<span class="stars" aria-label="${n} of 3 stars">${"★".repeat(n)}<span class="off">${"★".repeat(3 - n)}</span></span>`;
const CAT_NAMES = { plosive: "Plosive", fricative: "Fricative", affricate: "Affricate", nasal: "Nasal", liquid: "Liquid / glide", vowel: "Vowel", rvowel: "R-controlled vowel", spelling: "Spelling" };
/** Short label for small badges: "th (quiet)" → "th". */
const shortLabel = (c) => c.big.replace(/ \(.*\)$/, "").replace(/ \/.*$/, "");
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const recorder = new Recorder();

// ───────────────────────── looks (themes) ─────────────────────────
export const LOOKS = {
  playroom: {
    name: "Playroom", blurb: "Warm, bouncy and colorful — made for kids.",
    fonts: "family=Fredoka:wght@500;600;700&family=Nunito:wght@400;600;700;800",
  },
  studio: {
    name: "Studio", blurb: "Calm and editorial — focused practice for adults.",
    fonts: "family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600",
  },
  pop: {
    name: "Pop", blurb: "Bold outlines and sticker shapes in soft, chalky colors.",
    fonts: "family=Archivo+Black&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700",
  },
};

let lookOverride = null; // from ?look=… — previews a look without saving it

function applyLook() {
  const s = store.settings();
  const want = lookOverride ?? s.look;
  const look = LOOKS[want] ? want : "playroom";
  document.documentElement.dataset.look = look;
  document.body.classList.toggle("kid", !!s.kidMode);
  let link = document.getElementById("look-fonts");
  if (!link) {
    link = document.createElement("link");
    link.id = "look-fonts";
    link.rel = "stylesheet";
    document.head.append(link);
  }
  const href = `https://fonts.googleapis.com/css2?${LOOKS[look].fonts}&display=swap`;
  if (link.href !== href) link.href = href;
}

// ───────────────────────── router ─────────────────────────
const routes = [
  [/^$/, viewHome],
  [/^deck\/([\w-]+)$/, viewDeck],
  [/^card\/([\w-]+)\/([\w-]+)$/, viewCard],
  [/^c\/([\w-]+)$/, openCard],
  [/^word\/(.+)$/, (w) => viewWord(decodeURIComponent(w))],
  [/^search$/, viewSearch],
  [/^learn$/, viewLearn],
  [/^learn\/([\w-]+)$/, viewLesson],
  [/^pairs$/, viewPairs],
  [/^homophones$/, viewHomophones],
  [/^chart$/, viewChart],
  [/^progress$/, viewProgress],
  [/^settings$/, viewSettings],
  [/^install$/, viewInstall],
  [/^checkup$/, viewCheckup],
];

let query = new URLSearchParams();

function route() {
  recorder.cancel();
  stopAudio();
  const [path, qs = ""] = location.hash.replace(/^#\/?/, "").split("?");
  query = new URLSearchParams(qs);
  for (const [re, fn] of routes) {
    const m = path.match(re);
    if (!m) continue;
    try {
      fn(...m.slice(1));
    } catch (e) {
      console.error(e);
      render(`<div class="empty"><p>Something went wrong showing this page.</p><p class="muted small">${esc(e.message)}</p><a class="btn primary" href="#/">Go home</a></div>`);
    }
    const section = path.split("/")[0];
    document.querySelectorAll("[data-nav]").forEach((a) =>
      a.classList.toggle("active", a.dataset.nav.split(" ").includes(section || "home")));
    if (!path.startsWith("search")) window.scrollTo(0, 0);
    return;
  }
  location.hash = "#/";
}

function render(html) {
  $app.innerHTML = html;
}

// Global click handler for 🔊 buttons.
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-say]");
  if (!b) return;
  e.preventDefault();
  document.querySelectorAll(".playing").forEach((x) => x.classList.remove("playing"));
  b.classList.add("playing");
  try { await speak(b.dataset.say, { slow: b.dataset.slow === "1" }); }
  catch (err) { toast(`🔇 ${err.message}`); }
  finally { b.classList.remove("playing"); }
});

function toast(msg) {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role", "status");
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 4000);
}

function celebrate(anchor) {
  if (!anchor) return;
  anchor.classList.remove("win");
  void anchor.offsetWidth; // restart the glow animation
  anchor.classList.add("win");
  setTimeout(() => anchor.classList.remove("win"), 1200);
  if (reducedMotion()) return;
  const r = anchor.getBoundingClientRect();
  const layer = document.createElement("div");
  layer.className = "confetti";
  layer.style.left = `${r.left + r.width / 2}px`;
  layer.style.top = `${Math.max(r.top, 0) + Math.min(r.height, innerHeight) / 3}px`;
  for (let i = 0; i < 26; i++) {
    const s = document.createElement("i");
    const a = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
    const d = 70 + Math.random() * 90;
    s.style.setProperty("--x", `${Math.cos(a) * d}px`);
    s.style.setProperty("--y", `${Math.sin(a) * d - 40}px`);
    s.style.setProperty("--r", `${Math.random() * 540 - 270}deg`);
    s.style.setProperty("--c", `var(--cat-${pick(["plosive", "fricative", "affricate", "nasal", "liquid", "vowel", "rvowel"])})`);
    layer.append(s);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 1300);
}

// Header search box (desktop) and the search icon (mobile) both lead to #/search.
document.getElementById("top-search")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = e.target.q.value.trim();
  location.hash = `#/search${q ? `?q=${encodeURIComponent(q)}` : ""}`;
});

// ───────────────────────── home ─────────────────────────
function deckProgress(d) {
  const cards = d.cards();
  if (!cards.length) return 0;
  return cards.reduce((a, c) => a + store.stars(c.id), 0) / (cards.length * 3);
}

async function viewHome() {
  const lang = store.settings().language;
  const last = store.lastCard();
  const lastCard = last && cardById[last.card];
  const groups = [...new Set(DECKS.map((d) => d.group))];
  const ck = store.checkup();
  const isNew = !ck && !store.checkupSkipped() && !Object.keys(store.allCardProgress()).length;
  render(`
    ${isNew ? `<section class="welcome" data-cat="rvowel">
      <div class="welcome-art" aria-hidden="true">🎤📝</div>
      <div>
        <h1>Welcome! Let’s find your practice sounds.</h1>
        <p>Read ${CHECKUP_SENTENCES.length} short sentences out loud (about 2 minutes). I’ll listen and suggest which sounds to start with.</p>
        <div class="actions start">
          <a class="btn primary big-btn" href="#/checkup">▶ Start the checkup</a>
          <button class="btn" id="skip-checkup">Maybe later</button>
        </div>
      </div>
    </section>` : ""}
    <section class="hero">
      <div class="hero-text">
        <h1>${store.currentLearner() === "Me" ? "Hi!" : `Hi, ${esc(store.currentLearner())}!`} <span class="wave" aria-hidden="true">👋</span></h1>
        <p>Pick a card. <b>🎤 Try it</b>, then <b>👂 listen</b> to how it should sound.</p>
      </div>
      <form class="search-box" id="home-search" role="search">
        <span aria-hidden="true">🔎</span>
        <input name="q" type="search" placeholder="Find a word or sound — “thumb”, “igh”, “schwa”…" autocomplete="off" aria-label="Search words and sounds">
      </form>
      ${lastCard ? `<a class="continue" data-cat="${lastCard.cat}" href="#/card/${last.deck}/${lastCard.id}">
        <span class="mini-glyph">${esc(shortLabel(lastCard))}</span><span><small>Continue</small><b>${esc(deckById[last.deck]?.name ?? "")}</b></span><span aria-hidden="true">→</span></a>` : ""}
      ${ck ? planHtml(ck) : !isNew ? `<a class="checkup-link" href="#/checkup">🩺 Not sure where to start? Take the 2-minute sentence checkup →</a>` : ""}
      <div id="backend" class="backend muted small">Checking speech checker…</div>
    </section>
    <section class="tiles">
      <a class="tile" data-cat="plosive" href="#/deck/consonants"><span class="tile-icon">b</span><b>Consonants</b><small>24 sounds</small></a>
      <a class="tile" data-cat="vowel" href="#/deck/vowels"><span class="tile-icon">a</span><b>Vowels</b><small>16 sounds</small></a>
      <a class="tile" data-cat="spelling" href="#/deck/digraphs"><span class="tile-icon">sh</span><b>Spellings</b><small>digraphs & more</small></a>
      <a class="tile" data-cat="liquid" href="#/pairs"><span class="tile-icon">⇄</span><b>Minimal pairs</b><small>ship · sheep</small></a>
    </section>
    <section class="tiles small-tiles">
      <a class="tile" data-cat="nasal" href="#/learn"><span>📚</span><b>Learn</b></a>
      <a class="tile" data-cat="affricate" href="#/chart"><span>🗺️</span><b>Spelling chart</b></a>
      <a class="tile" data-cat="rvowel" href="#/homophones"><span>👯</span><b>Homophones</b></a>
      <a class="tile" data-cat="fricative" href="#/progress"><span>⭐</span><b>Progress</b></a>
    </section>
    ${lang ? "" : `<p class="callout">🌍 Learning English as a new language? <a href="#/settings">Choose your first language</a> for tips made for you and a personal focus deck.</p>`}
    ${groups.map((g) => `
      <h2>${esc(g)}</h2>
      <div class="deck-list">
        ${DECKS.filter((d) => d.group === g).map((d) => {
          const n = d.cards().length;
          const pct = Math.round(deckProgress(d) * 100);
          return `<a class="deck" data-cat="${d.cat}" href="#/deck/${d.id}">
            <span class="emoji" aria-hidden="true">${d.emoji}</span><b>${esc(d.name)}</b>
            <small>${n} card${n === 1 ? "" : "s"}${pct ? ` · ${pct}%` : ""}</small>
            <span class="bar" style="--p:${pct}%" aria-hidden="true"></span></a>`;
        }).join("")}
      </div>`).join("")}
  `);
  document.getElementById("skip-checkup")?.addEventListener("click", () => { store.skipCheckup(); viewHome(); });
  document.getElementById("home-search").addEventListener("submit", (e) => {
    e.preventDefault();
    location.hash = `#/search?q=${encodeURIComponent(e.target.q.value.trim())}`;
  });
  const h = await health();
  const el = document.getElementById("backend");
  if (!el) return;
  el.innerHTML = h.stt
    ? `<span class="dot ok"></span> Speech checker ready`
    : `<span class="dot"></span> Speech checker offline — you can still record and compare by ear.`;
}

// ───────────────────────── deck ─────────────────────────
function viewDeck(id) {
  const deck = deckById[id];
  if (!deck) return (location.hash = "#/");
  const cards = deck.cards();
  const resumeCard = cards.find((c) => c.id === store.resume(id) && c !== cards[0]);
  const started = cards.filter((c) => store.cardStatus(c.id) !== "new").length;
  const mastered = cards.filter((c) => store.cardStatus(c.id) === "mastered").length;
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › ${esc(deck.name)}</nav>
    <div class="deck-head" data-cat="${deck.cat}">
      <h1><span aria-hidden="true">${deck.emoji}</span> ${esc(deck.name)}</h1>
      ${deck.describe ? `<p class="muted">${esc(deck.describe())}</p>` : ""}
      ${cards.length ? `<div class="deck-progress" aria-hidden="true"><div style="width:${Math.round((mastered / cards.length) * 100)}%"></div></div>
        <p class="muted small">${started} of ${cards.length} tried · ${mastered} mastered ★★★</p>
        <div class="actions start">
          ${resumeCard ? `<a class="btn primary" href="#/card/${id}/${resumeCard.id}">▶ Continue: ${esc(resumeCard.big)} (card ${cards.indexOf(resumeCard) + 1})</a>` : ""}
          <a class="btn ${resumeCard ? "" : "primary"}" href="#/card/${id}/${cards[0].id}">${resumeCard ? "↺ From the start" : "▶ Start practicing"}</a>
        </div>` : ""}
    </div>
    <div class="card-grid">
      ${cards.map((c) => {
        const st = store.cardStatus(c.id);
        const p = store.cardProgress(c.id);
        const badge = { new: "", tried: "○ tried", learning: `◐ ${p.wins}/${p.tries}`, mastered: "✓ mastered" }[st];
        return `
        <a class="mini-card ${st}" data-cat="${c.cat}" href="#/card/${id}/${c.id}" title="${st === "new" ? "Not tried yet" : `${p.wins} of ${p.tries} tries matched`}">
          ${c.emoji ? `<span class="emoji" aria-hidden="true">${c.emoji}</span>` : ""}
          <b>${esc(c.big)}</b>
          ${c.ipa ? ipa(c.ipa) : ""}
          <small>${esc(c.words[0])}</small>
          ${stars(store.stars(c.id))}
          <span class="badge">${badge || "&nbsp;"}</span>
        </a>`;
      }).join("") || `<p class="muted">Nothing here yet.</p>`}
    </div>`);
}

function openCard(cardId) {
  const deck = DECKS.find((d) => d.cards().some((c) => c.id === cardId));
  if (!deck) return (location.hash = "#/");
  const q = query.toString();
  location.replace(`#/card/${deck.id}/${cardId}${q ? `?${q}` : ""}`);
}

// ───────────────────────── flip card ─────────────────────────
let cs; // card view state
let slide = ""; // "left" | "right": direction of the next card animation (buttons and arrow keys)

function viewCard(deckId, ref) {
  const deck = deckById[deckId];
  if (!deck) return (location.hash = "#/");
  const cards = deck.cards();
  // Card ids are stable; old links used positions, which shift in dynamic decks.
  let index = /^\d+$/.test(ref) ? +ref : cards.findIndex((c) => c.id === ref);
  const card = cards[index] ?? cardById[ref];
  if (!card) return (location.hash = `#/deck/${deckId}`);
  if (index < 0) index = 0; // e.g. a card that just left the "needs practice" deck
  store.setLastCard(deck.id, card.id);
  store.setResume(deck.id, card.id);
  const n = cards.length;
  const prev = n > 1 ? cards[(index - 1 + n) % n] : null;
  const next = n > 1 ? cards[(cards[index] === card ? index + 1 : index) % n] : null;
  showCard(card, {
    crumbs: `<a href="#/">Home</a> › <a href="#/deck/${deck.id}">${esc(deck.name)}</a>`,
    count: cards[index] === card ? `${index + 1} / ${n}` : "",
    prev: prev && `#/card/${deck.id}/${prev.id}`,
    next: next && `#/card/${deck.id}/${next.id}`,
  });
}

/** A practice card for any word (from search). */
function viewWord(word) {
  word = word.trim();
  const homes = cardsForWord(word);
  const w = normalize(word);
  const pairs = homes.flatMap((c) => c.pairs).filter((p) => p.some((x) => normalize(x) === w));
  const patterns = patternsIn(word);
  showCard({
    id: `w-${w}`, kind: "word", cat: homes[0]?.cat ?? "spelling", big: word, words: [word], pairs, homes, patterns,
  }, { crumbs: `<a href="#/">Home</a> › <a href="#/search?q=${encodeURIComponent(word)}">Search</a>` });
}

function showCard(card, { crumbs, count = "", prev, next }) {
  const w = query.get("w");
  const words = w && !card.words.some((x) => normalize(x) === normalize(w)) ? [w, ...card.words] : card.words;
  card = { ...card, words };
  const start = words.find((x) => normalize(x) === normalize(w ?? "")) ?? words[0];
  cs = { card, target: start, isSentence: false, flipped: false, take: null, result: null, busy: false, tab: "how", prev, next };
  render(`
    <nav class="crumbs">${crumbs}</nav>
    <div class="card-wrap" data-cat="${card.cat}">
      <div class="card-toolbar">
        <div class="seg side-switch" role="tablist" aria-label="Card side">
          <button role="tab" aria-selected="true" data-side="front">🎤 Try it</button>
          <button role="tab" aria-selected="false" data-side="back">👂 Listen</button>
        </div>
        <span class="count muted small">${count}</span>
      </div>
      <div class="flip-scene ${slide ? `enter-${slide}` : ""}" id="scene"><div class="flip" id="flip">
        <div class="face front" id="front"></div>
        <div class="face back" id="back" aria-hidden="true"></div>
      </div></div>
    </div>
    <p class="muted center keys small">Keys: <kbd>space</kbd> record · <kbd>F</kbd> flip · <kbd>←</kbd> <kbd>→</kbd> cards</p>
    <div class="bottom-bar" data-cat="${card.cat}">
      ${prev ? `<a class="btn bar-nav" data-go="prev" href="${prev}" aria-label="Previous card">◀</a>` : ""}
      <button class="btn bar-nav bar-act" id="bar-act"></button>
      <button class="btn flip-btn" id="flip-btn" data-flip></button>
      ${next ? `<a class="btn bar-nav" data-go="next" href="${next}" aria-label="Next card">▶</a>` : ""}
    </div>
  `);
  slide = "";
  renderFront();
  renderBack();
  // Warm the voice for this card once the learner stops on it (not while paging quickly).
  const mine = cs;
  setTimeout(() => cs === mine && prefetch([mine.target, card.sentence].filter(Boolean)), 600);
}

function go(dir) {
  const href = dir === "prev" ? cs?.prev : cs?.next;
  if (!href) return;
  slide = dir === "prev" ? "left" : "right";
  location.hash = href;
}

/** The flip button lives in a bar pinned to the bottom of the screen, so it never scrolls away. */
function updateFlipBtn() {
  const b = document.getElementById("flip-btn");
  if (!b) return;
  b.textContent = "↻ Flip";
  b.setAttribute("aria-label", cs.flipped ? "Flip back to try it" : "Flip to listen");
  b.classList.toggle("nudge", !cs.flipped && !!cs.take);
  // Same job as the big button on the visible side: record on the front, listen on the back.
  const a = document.getElementById("bar-act");
  const rec = recorder.state === "recording";
  a.textContent = cs.flipped ? "👂" : rec ? "⏹" : cs.busy ? "⏳" : "🔴";
  a.setAttribute("aria-label", cs.flipped ? "Listen" : rec ? "Stop recording" : "Record");
  a.classList.toggle("recording", !cs.flipped && rec);
}

function targetPicker() {
  const c = cs.card;
  if (c.words.length < 2 && !c.sentence) return "";
  return `<div class="targets" role="group" aria-label="Choose what to practice">
    ${c.words.map((w) => {
      const st = store.wordStatus(c.id, w);
      return `<button class="chip ${st} ${!cs.isSentence && w === cs.target ? "on" : ""}" data-target="${esc(w)}" title="${st === "won" ? "You’ve said this one right" : st === "tried" ? "Tried, not matched yet" : "Not tried yet"}">${esc(w)}${st === "won" ? ` <span class="mk">✓</span>` : st === "tried" ? ` <span class="mk">○</span>` : ""}</button>`;
    }).join("")}
    ${c.sentence ? `<button class="chip sentence ${cs.isSentence ? "on" : ""}" data-target="__sentence">💬 sentence</button>` : ""}
  </div>`;
}

function catLabel(c) {
  const p = c.p;
  if (p) return [CAT_NAMES[c.cat], p.voicing].filter(Boolean).join(" · ");
  if (c.g) return GRAPHEME_TYPES[c.g.type].name.replace(/s( \(|$)/, "$1").replace(/ \(.*\)$/, "");
  return "Any word";
}

function renderFront() {
  const c = cs.card;
  const target = cs.isSentence ? c.sentence : cs.target;
  document.getElementById("front").innerHTML = `
    <header class="face-head"><span class="cat-pill">${esc(catLabel(c))}</span>${c.kind === "word" ? "" : stars(store.stars(c.id))}</header>
    <div class="glyph">${c.emoji ? `<span class="emoji" aria-hidden="true">${c.emoji}</span>` : ""}<b>${esc(c.big)}</b>${ipa(c.ipa)}</div>
    <p class="say-this"><span>Say</span> <strong class="${cs.isSentence ? "sentence-text" : "word-text"}">${esc(target)}</strong></p>
    <div class="rec-row">
      <button class="rec" id="rec" aria-label="Record">${recorder.state === "recording" ? "⏹" : "🎤"}</button>
    </div>
    <div class="status" id="status">${micSupported() ? "Tap the microphone and say it." : "This browser can’t record audio. You can still listen on the other side."}</div>
    <div id="result" aria-live="polite">${resultHtml()}</div>
    ${targetPicker()}
    ${c.kind === "word" ? "" : historyHtml()}
  `;
  updateFlipBtn();
}

function ago(t) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/** What this learner has already done on this card, from saved progress. */
function historyHtml() {
  const p = store.cardProgress(cs.card.id);
  if (!p.tries) return `<p class="history">🆕 New card: you haven’t tried it yet.</p>`;
  const good = p.last === "correct" || p.last === "homophone";
  return `<p class="history">${good ? "✅" : "🔁"} Last try ${ago(p.at)} · ${p.wins} of ${p.tries} matched</p>`;
}

function resultHtml() {
  if (!cs.take) return "";
  const mine = `<button class="btn" data-play-mine>▶ My try</button><button class="btn" data-compare>🔁 Mine vs. model</button>`;
  const r = cs.result;
  if (!r) return `<div class="actions">${mine}</div>`;
  if (r.error) return `<div class="feedback warn"><p>${esc(r.error)}</p><p class="muted small">Listen to your try and compare it with the model by ear.</p></div><div class="actions">${mine}</div>`;
  if (r.sentence) {
    const pct = Math.round(r.sentence.score * 100);
    return `<div class="feedback ${pct >= 90 ? "good" : "warn"}">
      <p><b>${pct >= 90 ? "🎉 Great reading!" : pct >= 60 ? "👍 Nice — a few words to work on." : "💪 Keep going!"}</b> ${pct}% of words matched.</p>
      <p class="sentence-check">${r.sentence.words.map((w) =>
        w.status === "ok" ? `<span class="ok">${esc(w.word)}</span>`
        : w.status === "missed" ? `<span class="missed" title="not heard">${esc(w.word)}</span>`
        : `<span class="changed" title="heard “${esc(w.heard)}”">${esc(w.word)} <small>(${esc(w.heard)})</small></span>`).join(" ")}</p>
      <p class="muted small">I heard: “${esc(r.text)}”</p>
    </div><div class="actions">${mine}</div>`;
  }
  const s = r.score;
  const heard = `“${esc(s.word ?? s.heard)}”`;
  let body;
  switch (s.result) {
    case "correct": body = `<p><b>✅ ${pick(["Great job!", "Yes!", "Nailed it!", "Perfect!", "You got it!"])}</b> ${
      s.checked ? `That sounded like “${esc(cs.target)}”${cs.card.pairs.length ? ", not one of its look-alikes" : ""}.` : `I heard ${heard}.`}</p>`; break;
    case "homophone": body = `<p><b>✅ Yes!</b> I wrote ${heard}, which sounds exactly like “${esc(cs.target)}” — they’re <a href="#/homophones">homophones</a>.</p>`; break;
    case "nothing": body = `<p><b>🙉 I didn’t catch that.</b> Try again a little louder, closer to the microphone.</p>`; break;
    case "swap": {
      body = `<p><b>🤔 Close!</b> That sounded like ${heard} instead of “${esc(cs.target)}”.</p>
        <p class="pair-line">${pairBtns([cs.target, s.word])}</p>
        ${s.diagnosis && !s.diagnosis.kind.startsWith("changed") ? `<p>${esc(s.diagnosis.message)}</p>` : ""}
        ${cs.card.p ? `<p class="tip">💡 ${esc(cs.card.p.how)}</p>` : ""}`;
      break;
    }
    default:
      body = `<p><b>🤔 I heard ${heard}.</b></p>
        ${s.diagnosis ? `<p>${esc(s.diagnosis.message)}</p>` : ""}
        <p class="muted small">Speech checkers make mistakes too — listen to your try and the model, then try again.</p>`;
  }
  return `<div class="feedback ${isSuccess(s) ? "good" : "warn"}">${body}</div><div class="actions">${mine}</div>`;
}

/** Tabs for the back of the card: [id, label, html]. */
function backTabs(c) {
  const lang = store.settings().language;
  const tabs = [];
  if (c.kind === "sound") {
    const p = c.p;
    const myNote = lang && p.esl?.[lang];
    const otherNotes = Object.entries(p.esl ?? {}).filter(([l]) => l !== lang);
    tabs.push(["how", "How", `
      ${myNote ? `<div class="callout"><h3>🌍 For ${esc(languageName(lang))} speakers</h3><p>${esc(myNote)}</p></div>` : ""}
      <p>${esc(p.how)}</p><p class="tip">💡 ${esc(p.tip)}</p>
      <p class="tags">${p.manner ? `<a class="tag" href="#/learn/${MANNERS[p.manner].lesson}">${esc(p.manner)}</a>` : ""}
        ${p.voicing ? `<a class="tag" href="#/learn/voicing">${esc(p.voicing)}</a>` : ""}
        ${p.place ? `<span class="tag">${esc(p.place)}</span>` : ""}
        ${p.partner ? `<a class="tag" href="#/c/s-${p.partner}">partner: ${esc(phonemeById[p.partner].label)}</a>` : ""}</p>`]);
    tabs.push(["spell", "Spellings", `<div class="spellings">${p.spellings.map(([g, w]) =>
      `<button class="spelling" data-say="${esc(w.replace(/ \(.*\)$/, ""))}"><b>${esc(g)}</b><small>${esc(w)}</small></button>`).join("")}</div>`]);
    tabs.push(["words", "Words", p.positions
      ? Object.entries(p.positions).filter(([, ws]) => ws.length)
          .map(([pos, ws]) => `<div class="pos"><small>${pos}</small>${ws.map((w) => say(w)).join("")}</div>`).join("")
      : `<div class="pos">${p.words.map((w) => say(w)).join("")}</div>`]);
    if (p.pairs?.length) tabs.push(["pairs", "Pairs", `<p class="muted small">Don’t mix these up — tap both and listen for the difference.</p><div class="pairs">${p.pairs.map(pairBtns).join("")}</div>`]);
    if (p.kids || otherNotes.length) tabs.push(["tips", "Tips", `
      ${p.kids ? `<h3>🧒 For kids & parents</h3><p>${esc(p.kids)}</p>` : ""}
      ${otherNotes.length ? `<h3>🌍 First-language tips</h3><dl class="notes">${otherNotes.map(([l, n]) =>
        `<dt>${esc(languageName(l))}</dt><dd>${esc(n)}</dd>`).join("")}</dl>` : ""}`]);
  } else if (c.kind === "spelling") {
    const g = c.g;
    tabs.push(["how", "Sounds", `<div class="sound-list">${g.sounds.length ? g.sounds.map(([id, w]) => {
      const p = phonemeById[id];
      return `<div class="sound-row">${say(w)} <a href="#/c/s-${id}">${esc(p.label)} ${ipa(p.ipa)}</a></div>`;
    }).join("") : `<p>Nothing — it’s silent!</p>`}</div>
      <p class="tip">💡 ${esc(g.note)}</p><p class="muted small">${esc(GRAPHEME_TYPES[g.type].blurb)}</p>`]);
    tabs.push(["words", "Words", `<div class="pos">${g.words.map((w) => say(w)).join("")}</div>`]);
  } else {
    tabs.push(["how", "About", `
      ${c.homes.length ? `<h3>Practice it on these cards</h3><div class="card-links">${c.homes.map(miniCard).join("")}</div>` : ""}
      ${c.patterns.length ? `<h3>Spelling patterns in “${esc(c.big)}”</h3><div class="card-links">${c.patterns.map((g) => miniCard(cardById[g.id])).join("")}</div>
        <p class="muted small">Guessed from the letters — English spelling has exceptions!</p>` : ""}
      ${!c.homes.length && !c.patterns.length ? `<p class="muted">This word isn’t on any card yet, but you can still listen and practice it.</p>` : ""}`]);
    if (c.pairs.length) tabs.push(["pairs", "Pairs", `<div class="pairs">${c.pairs.map(pairBtns).join("")}</div>`]);
  }
  return tabs;
}

function miniCard(c) {
  return c ? `<a class="mini-card" data-cat="${c.cat}" href="#/c/${c.id}"><b>${esc(c.big)}</b>${ipa(c.ipa)}<small>${esc(c.words[0])}</small></a>` : "";
}

function renderBack() {
  const c = cs.card;
  const tabs = backTabs(c);
  if (!tabs.some(([id]) => id === cs.tab)) cs.tab = tabs[0][0];
  const target = cs.isSentence ? c.words[0] : cs.target;
  document.getElementById("back").innerHTML = `
    <header class="face-head"><span class="cat-pill">${esc(catLabel(c))}</span><span class="big-label">${esc(c.big)} ${ipa(c.ipa)}</span></header>
    <div class="listen">
      <button class="btn primary big-say" data-say="${esc(target)}">🔊 ${esc(target)}</button>
      <button class="btn" data-say="${esc(target)}" data-slow="1">🐢 Slowly</button>
      ${c.sentence ? `<button class="btn" data-say="${esc(c.sentence)}">💬 Sentence</button>` : ""}
    </div>
    ${c.sentence ? `<p class="sentence-text center">“${esc(c.sentence)}”</p>` : ""}
    <div class="tabs" role="tablist">${tabs.map(([id, label]) =>
      `<button role="tab" aria-selected="${id === cs.tab}" data-tab="${id}">${esc(label)}</button>`).join("")}</div>
    ${tabs.map(([id, , html]) => `<section class="tab-panel" role="tabpanel" data-panel="${id}" ${id === cs.tab ? "" : "hidden"}>${html}</section>`).join("")}`;
}

function flip(to = !cs.flipped) {
  cs.flipped = to;
  document.getElementById("flip").classList.toggle("flipped", to);
  document.getElementById("front").setAttribute("aria-hidden", String(to));
  document.getElementById("back").setAttribute("aria-hidden", String(!to));
  document.querySelectorAll("[data-side]").forEach((b) =>
    b.setAttribute("aria-selected", String((b.dataset.side === "back") === to)));
  updateFlipBtn();
  const scene = document.getElementById("scene");
  if (scene.getBoundingClientRect().top < 0) scene.scrollIntoView({ behavior: "smooth" });
}

async function toggleRecord() {
  if (!cs || cs.busy || !micSupported()) return;
  const btn = document.getElementById("rec");
  const status = document.getElementById("status");
  if (!btn) return;
  if (recorder.state === "recording") return finishRecording();
  if (recorder.state !== "idle") return;
  if (cs.flipped) flip(false);
  stopAudio();
  try {
    await recorder.start({
      maxMs: cs.isSentence ? 15000 : 5000,
      onLevel: (l) => btn.style.setProperty("--level", l.toFixed(2)),
      onAutoStop: () => finishRecording(),
    });
    btn.classList.add("recording");
    btn.textContent = "⏹";
    updateFlipBtn();
    status.textContent = "Listening… (it stops by itself when you finish)";
  } catch (e) {
    status.textContent = e.message;
  }
}

async function finishRecording() {
  if (recorder.state !== "recording") return;
  const mine = cs;
  const myCard = cs.card;
  const target = cs.isSentence ? cs.card.sentence : cs.target;
  mine.busy = true;
  document.getElementById("status").textContent = "Checking…";
  const btn = document.getElementById("rec");
  btn.classList.remove("recording");
  btn.textContent = "⏳";
  updateFlipBtn();
  try {
    const take = await recorder.stop();
    if (cs !== mine) return;
    cs.take = take;
    cs.result = null;
    if (!take.speech) {
      cs.result = { score: { result: "nothing", heard: "" } };
    } else if (!(await health()).stt) {
      cs.result = { error: "The speech checker isn’t connected right now." };
    } else {
      const { text, scores } = await transcribe(take.wav, cs.isSentence ? [] : candidatesFor(target, myCard.pairs));
      if (cs !== mine) return;
      if (cs.isSentence) {
        const sentence = scoreSentence(target, text);
        cs.result = { text, sentence };
        store.recordAttempt(myCard.id, "(sentence)", sentence.score >= 0.9, sentence.score >= 0.9 ? "correct" : "close");
      } else {
        const score = refineWithScores(scoreWord(target, text, { pairs: myCard.pairs }), target, scores, myCard.pairs);
        cs.result = { text, score };
        if (score.result !== "nothing") store.recordAttempt(myCard.id, target, isSuccess(score), score.result);
      }
    }
  } catch (e) {
    if (cs === mine) cs.result = { error: e.message };
  } finally {
    mine.busy = false;
  }
  if (cs !== mine) return;
  renderFront();
  document.getElementById("status").textContent = "Tap the microphone to try again.";
  const won = (cs.result?.score && isSuccess(cs.result.score)) || cs.result?.sentence?.score >= 0.9;
  if (won) celebrate(document.getElementById("front"));
}

$app.addEventListener("click", async (e) => {
  if (!cs || !document.getElementById("flip")) return;
  const t = e.target.closest("button, a[data-go]");
  if (!t) return;
  if (t.dataset.go) { e.preventDefault(); return go(t.dataset.go); }
  if (t.id === "rec") return toggleRecord();
  if (t.id === "bar-act") return cs.flipped ? speak(cs.isSentence ? cs.card.sentence : cs.target).catch((err) => toast(`🔇 ${err.message}`)) : toggleRecord();
  if (t.hasAttribute("data-flip")) return flip();
  if (t.dataset.side) return flip(t.dataset.side === "back");
  if (t.dataset.tab) {
    cs.tab = t.dataset.tab;
    document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b === t)));
    document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== cs.tab));
    return;
  }
  if (t.dataset.target) {
    cs.isSentence = t.dataset.target === "__sentence";
    if (!cs.isSentence) cs.target = t.dataset.target;
    cs.take = cs.result = null;
    renderFront();
    renderBack();
    prefetch([cs.isSentence ? cs.card.sentence : cs.target]);
    return;
  }
  if (t.hasAttribute("data-play-mine") && cs.take) return playUrl(cs.take.url).catch((err) => toast(`🔇 ${err.message}`));
  if (t.hasAttribute("data-compare") && cs.take) {
    try {
      await playUrl(cs.take.url);
      await new Promise((r) => setTimeout(r, 400));
      await speak(cs.isSentence ? cs.card.sentence : cs.target);
    } catch (err) { toast(`🔇 ${err.message}`); }
  }
});

document.addEventListener("keydown", (e) => {
  if (!document.getElementById("flip") || e.target.closest("input, select, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.code === "Space") { e.preventDefault(); toggleRecord(); }
  else if (e.key === "f" || e.key === "F") flip();
  else if (e.key === "ArrowRight") go("next");
  else if (e.key === "ArrowLeft") go("prev");
});

// ───────────────────────── search ─────────────────────────
function viewSearch() {
  const q = query.get("q") ?? "";
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Search</nav>
    <h1>🔎 Search</h1>
    <form class="search-box big" id="search-form" role="search">
      <span aria-hidden="true">🔎</span>
      <input id="q" name="q" type="search" value="${esc(q)}" placeholder="A word (“thumb”), a spelling (“igh”), a sound (“schwa”, “θ”)…" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search">
    </form>
    <div id="results" aria-live="polite"></div>`);
  const input = document.getElementById("q");
  let timer;
  const run = () => {
    const v = input.value;
    history.replaceState(null, "", `#/search${v.trim() ? `?q=${encodeURIComponent(v.trim())}` : ""}`);
    document.getElementById("results").innerHTML = searchResults(v);
  };
  input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 120); });
  document.getElementById("search-form").addEventListener("submit", (e) => { e.preventDefault(); run(); input.blur(); });
  run();
  if (!q) input.focus();
}

function searchResults(q) {
  const term = q.trim();
  if (!term) {
    return `<div class="empty"><p>Try: ${["thumb", "night", "sh", "igh", "schwa", "voiced", "homophone"].map((s) =>
      `<a class="chip" href="#/search?q=${encodeURIComponent(s)}">${s}</a>`).join(" ")}</p></div>`;
  }
  const r = search(term);
  const oneWord = /^[a-z'’-]+$/i.test(term);
  const parts = [];
  if (r.words.length) {
    parts.push(`<h2>Words</h2><div class="word-results">${r.words.map(({ word, cards }) => `
      <div class="word-row">${say(word)}
        <span class="on-cards">${cards.map((c) => `<a class="chip" data-cat="${c.cat}" href="#/c/${c.id}?w=${encodeURIComponent(word)}">${esc(c.big)}${c.ipa && store.settings().showIpa ? ` <span class="ipa">/${esc(c.ipa)}/</span>` : ""}</a>`).join("")}</span>
      </div>`).join("")}</div>`);
  }
  if (oneWord && normalize(term) && !r.words.some((x) => normalize(x.word) === normalize(term))) {
    parts.push(`<a class="practice-any" href="#/word/${encodeURIComponent(term)}">🎤 Practice “${esc(term)}” on its own card →</a>`);
  } else if (oneWord && r.words.length) {
    parts.push(`<p><a href="#/word/${encodeURIComponent(term)}">Or practice “${esc(term)}” on its own →</a></p>`);
  }
  if (r.cards.length) parts.push(`<h2>Sounds & spellings</h2><div class="card-grid">${r.cards.map(miniCard).join("")}</div>`);
  if (r.lessons.length) {
    const hi = (s) => esc(s).replace(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => `<mark>${m}</mark>`);
    parts.push(`<h2>Lessons</h2><div class="lesson-list">${r.lessons.map(({ l, snippet }) =>
      `<a class="lesson" href="#/learn/${l.id}"><span class="emoji" aria-hidden="true">${l.emoji}</span><div><b>${esc(l.title)}</b><p>…${hi(snippet)}…</p></div></a>`).join("")}</div>`);
  }
  if (r.homophones.length) {
    parts.push(`<h2>Homophones</h2><div class="homophone-list">${r.homophones.map((g) =>
      `<div class="hgroup">${say(g[0][0], "hear")}${g.map(([w, m]) => `<span><b>${esc(w)}</b> <small>${esc(m)}</small></span>`).join("")}</div>`).join("")}</div>`);
  }
  return parts.join("") || `<div class="empty"><p>Nothing found for “${esc(term)}”.</p></div>`;
}

// ───────────────────────── learn ─────────────────────────
function viewLearn() {
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Learn</nav>
    <h1>📚 Learn how sounds work</h1>
    <div class="lesson-list">
      ${LESSONS.map((l) => `<a class="lesson" href="#/learn/${l.id}"><span class="emoji" aria-hidden="true">${l.emoji}</span><div><b>${esc(l.title)}</b><p>${esc(l.summary)}</p></div></a>`).join("")}
    </div>`);
}

function viewLesson(id) {
  const l = lessonById[id];
  if (!l) return (location.hash = "#/learn");
  const i = LESSONS.indexOf(l);
  const next = LESSONS[i + 1];
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › <a href="#/learn">Learn</a> › ${esc(l.title)}</nav>
    <article class="lesson-body">
      <h1><span aria-hidden="true">${l.emoji}</span> ${esc(l.title)}</h1>
      <p class="lead">${esc(l.summary)}</p>
      ${l.sections.map((s) => `
        <section>
          <h2>${esc(s.h)}</h2>
          ${s.html ?? ""}
          ${s.words ? `<div class="pos">${s.words.map((w) => say(w)).join("")}</div>` : ""}
          ${s.pairs ? `<div class="pairs">${s.pairs.map(pairBtns).join("")}</div>` : ""}
          ${s.cards ? `<div class="card-links">${s.cards.map((c) => miniCard(cardById[`s-${c}`] ?? cardById[c])).join("")}</div>` : ""}
        </section>`).join("")}
      ${next ? `<a class="btn primary" href="#/learn/${next.id}">Next: ${esc(next.title)} →</a>` : ""}
    </article>`);
}

// ───────────────────────── minimal pairs game ─────────────────────────
const ALL_PAIRS = (() => {
  const seen = new Set();
  const out = [];
  for (const p of PHONEMES) {
    for (const [a, b] of p.pairs ?? []) {
      const key = [a, b].map((w) => w.toLowerCase()).sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ a, b, sound: p.id });
    }
  }
  return out;
})();

let ps; // pairs game state

function viewPairs() {
  const lang = store.settings().language;
  ps = ps ?? { mode: "listen", filter: lang ? "focus" : "all" };
  const opts = [
    ["all", "All sounds"],
    ...(lang ? [["focus", `My focus (${languageName(lang)})`]] : []),
    ...PHONEMES.filter((p) => p.pairs?.length).map((p) => [p.id, `${p.label}  /${p.ipa}/`]),
  ];
  const st = store.pairStats();
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Minimal pairs</nav>
    <h1>⇄ Minimal pairs</h1>
    <div class="controls">
      <div class="seg" role="group">
        <button class="${ps.mode === "listen" ? "on" : ""}" data-mode="listen">👂 Listen</button>
        <button class="${ps.mode === "say" ? "on" : ""}" data-mode="say">🎤 Say</button>
      </div>
      <select id="pair-filter" aria-label="Sound">${opts.map(([v, n]) => `<option value="${v}" ${v === ps.filter ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
      <span class="muted small" id="pair-score">Score: ${st.wins} / ${st.tries}</span>
    </div>
    <div class="game" id="game"></div>
    <div class="bottom-bar"><button class="btn flip-btn" id="next-pair">Skip →</button></div>`);
  document.getElementById("next-pair").onclick = nextPair;
  document.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = () => { ps.mode = b.dataset.mode; viewPairs(); }));
  document.getElementById("pair-filter").onchange = (e) => { ps.filter = e.target.value; nextPair(); };
  nextPair();
}

function pairPool() {
  const lang = store.settings().language;
  if (ps.filter === "all") return ALL_PAIRS;
  if (ps.filter === "focus") return ALL_PAIRS.filter((p) => phonemeById[p.sound].esl?.[lang]);
  return ALL_PAIRS.filter((p) => p.sound === ps.filter);
}

/** After an answer: refresh the score and turn Skip into Next (it sits in the bottom bar, always reachable). */
function pairAnswered() {
  const st = store.pairStats();
  const el = document.getElementById("pair-score");
  if (el) el.textContent = `Score: ${st.wins} / ${st.tries}`;
  const b = document.getElementById("next-pair");
  if (!b) return;
  b.textContent = "Next →";
  b.classList.add("nudge");
}

function nextPair() {
  const nb = document.getElementById("next-pair");
  if (nb) { nb.textContent = "Skip →"; nb.classList.remove("nudge"); }
  const pool = pairPool();
  const game = document.getElementById("game");
  if (!pool.length) return (game.innerHTML = `<p class="muted">No pairs for this choice.</p>`);
  const pair = pick(pool);
  const target = Math.random() < 0.5 ? pair.a : pair.b;
  const other = target === pair.a ? pair.b : pair.a;
  const p = phonemeById[pair.sound];
  ps.round = { pair, target, other, answered: false };
  prefetch([pair.a, pair.b]);
  if (ps.mode === "listen") {
    game.innerHTML = `
      <p class="prompt">Which word do you hear?</p>
      <button class="btn primary big-btn" data-say="${esc(target)}">🔊 Play</button>
      <button class="btn" data-say="${esc(target)}" data-slow="1">🐢 Slow</button>
      <div class="choices">${shuffle([pair.a, pair.b]).map((w) => `<button class="choice" data-choice="${esc(w)}">${esc(w)}</button>`).join("")}</div>
      <div id="pair-fb" aria-live="polite"></div>`;
    game.querySelectorAll("[data-choice]").forEach((b) => (b.onclick = () => {
      if (ps.round.answered) return;
      ps.round.answered = true;
      const ok = b.dataset.choice === target;
      store.recordPair(ok);
      b.classList.add(ok ? "right" : "wrong");
      if (ok) celebrate(b);
      if (!ok) game.querySelector(`[data-choice="${CSS.escape(target)}"]`)?.classList.add("right");
      document.getElementById("pair-fb").innerHTML = `
        <div class="feedback ${ok ? "good" : "warn"}">
          <p><b>${ok ? "✅ Right!" : `❌ It was “${esc(target)}”.`}</b> Listen to both: ${pairBtns([pair.a, pair.b])}</p>
          <p class="muted small">Sound: <a href="#/c/s-${p.id}">${esc(p.label)} ${ipa(p.ipa)}</a></p>
        </div>`;
      pairAnswered();
    }));
  } else {
    game.innerHTML = `
      <p class="prompt">Say this word:</p>
      <p class="word-text huge">${esc(target)}</p>
      <p class="muted">(not “${esc(other)}”) ${pairBtns([target, other])}</p>
      <button class="rec" id="pair-rec" aria-label="Record">🎤</button>
      <div id="pair-fb" aria-live="polite"></div>`;
    const btn = document.getElementById("pair-rec");
    const finish = async () => {
      if (recorder.state !== "recording") return;
      btn.classList.remove("recording");
      btn.textContent = "⏳";
      const fb = document.getElementById("pair-fb");
      try {
        const take = await recorder.stop();
        let html;
        let ok = false;
        if (!take.speech) html = `<div class="feedback warn"><p>🙉 I didn’t hear anything. Try again.</p></div>`;
        else if (!(await health()).stt) html = `<div class="feedback warn"><p>The speech checker is offline.</p></div><button class="btn" id="mine">▶ My try</button>`;
        else {
          const pairs = [[pair.a, pair.b]];
          const { text, scores } = await transcribe(take.wav, candidatesFor(target, pairs));
          const s = refineWithScores(scoreWord(target, text, { pairs }), target, scores, pairs);
          ok = isSuccess(s);
          if (s.result !== "nothing") store.recordPair(ok);
          html = `<div class="feedback ${ok ? "good" : "warn"}"><p><b>${
            ok ? `✅ That sounded like “${esc(target)}”.` : s.result === "swap" ? `🤔 That sounded like “${esc(other)}”.` : s.result === "nothing" ? "🙉 I didn’t catch that." : `🤔 I heard “${esc(s.word ?? s.heard)}”.`
          }</b></p>${!ok ? `<p class="tip">💡 ${esc(p.how)}</p>` : ""}</div>
          <button class="btn" id="mine">▶ My try</button>`;
        }
        if (!fb.isConnected) return;
        fb.innerHTML = html;
        pairAnswered();
        document.getElementById("mine")?.addEventListener("click", () => playUrl(take.url).catch((e) => toast(`🔇 ${e.message}`)));
        if (ok) celebrate(document.getElementById("game"));
      } catch (e) {
        if (!fb.isConnected) return;
        fb.innerHTML = `<div class="feedback warn"><p>${esc(e.message)}</p></div>`;
        pairAnswered();
      }
      btn.textContent = "🎤";
    };
    btn.onclick = async () => {
      if (recorder.state === "recording") return finish();
      if (recorder.state !== "idle") return;
      stopAudio();
      try {
        await recorder.start({ maxMs: 5000, onLevel: (l) => btn.style.setProperty("--level", l.toFixed(2)), onAutoStop: finish });
        btn.classList.add("recording");
        btn.textContent = "⏹";
      } catch (e) {
        document.getElementById("pair-fb").innerHTML = `<div class="feedback warn"><p>${esc(e.message)}</p></div>`;
      }
    };
  }
}

// ───────────────────────── homophones ─────────────────────────
function viewHomophones() {
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Homophones</nav>
    <h1>👯 Homophones</h1>
    <p>Homophones <b>sound the same</b> but are different words. You can only tell them apart by spelling and meaning. <a href="#/learn/homophones">Learn more</a>.</p>
    <div class="game" id="hquiz"></div>
    <h2>All homophones</h2>
    <div class="homophone-list">
      ${HOMOPHONES.map((g) => `<div class="hgroup">${say(g[0][0], "hear")}${g.map(([w, m]) => `<span><b>${esc(w)}</b> <small>${esc(m)}</small></span>`).join("")}</div>`).join("")}
    </div>
    <h2>Heteronyms: same spelling, different sound</h2>
    <div class="homophone-list">
      ${HETERONYMS.map((h) => `<div class="hgroup"><b class="het">${esc(h.word)}</b>
        <span>${say(h.a[1], "hear")} <small>${esc(h.a[0])} — “${esc(h.a[1])}”</small></span>
        <span>${say(h.b[1], "hear")} <small>${esc(h.b[0])} — “${esc(h.b[1])}”</small></span></div>`).join("")}
    </div>`);
  homophoneQuiz();
}

function homophoneQuiz() {
  const group = pick(HOMOPHONES);
  const [word, meaning] = pick(group);
  const el = document.getElementById("hquiz");
  el.innerHTML = `
    <p class="prompt">Which spelling means <b>“${esc(meaning)}”</b>? ${say(word, "hear it")}</p>
    <div class="choices">${shuffle(group).map(([w]) => `<button class="choice" data-h="${esc(w)}">${esc(w)}</button>`).join("")}</div>
    <div id="h-fb"></div>`;
  el.querySelectorAll("[data-h]").forEach((b) => (b.onclick = () => {
    const ok = b.dataset.h === word;
    b.classList.add(ok ? "right" : "wrong");
    if (ok) celebrate(b);
    else el.querySelector(`[data-h="${CSS.escape(word)}"]`)?.classList.add("right");
    document.getElementById("h-fb").innerHTML = `<p>${ok ? "✅ Yes!" : `❌ It’s “${esc(word)}”.`}</p><button class="btn primary" id="h-next">Next →</button>`;
    const next = document.getElementById("h-next");
    next.onclick = homophoneQuiz;
    next.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }));
}

// ───────────────────────── spelling chart ─────────────────────────
function viewChart() {
  const row = (p) => `<tr data-cat="${cardById[`s-${p.id}`].cat}">
    <td><a href="#/c/s-${p.id}"><b>${esc(p.label)}</b> ${ipa(p.ipa)}</a></td>
    <td>${say(p.key)}</td>
    <td class="spellings">${p.spellings.map(([g, w]) => `<button class="spelling" data-say="${esc(w.replace(/ \(.*\)$/, ""))}"><b>${esc(g)}</b><small>${esc(w)}</small></button>`).join("")}</td>
  </tr>`;
  const table = (title, list) => `<h2>${title}</h2><div class="table-wrap"><table class="chart"><thead><tr><th>Sound</th><th>Key word</th><th>Spellings (tap to hear)</th></tr></thead>
    <tbody>${list.map(row).join("")}</tbody></table></div>`;
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Spelling chart</nav>
    <h1>🗺️ Spelling chart</h1>
    <p class="muted">Every common way to spell each English sound. English has about 44 sounds and over 250 spellings!</p>
    ${table("Short vowels", PHONEMES.filter((p) => p.group === "vowel" && /short|schwa/.test(p.id)))}
    ${table("Long vowels & diphthongs", PHONEMES.filter((p) => (p.group === "vowel" && !/short|schwa/.test(p.id)) || p.group === "diphthong"))}
    ${table("R-controlled vowels", PHONEMES.filter((p) => p.group === "r-vowel"))}
    ${table("Consonants", PHONEMES.filter((p) => p.group === "consonant"))}`);
}

// ───────────────────────── progress ─────────────────────────
function viewProgress() {
  const prog = store.allCardProgress();
  const tried = ALL_CARDS.filter((c) => prog[c.id]);
  const total = tried.reduce((a, c) => a + prog[c.id].tries, 0);
  const wins = tried.reduce((a, c) => a + prog[c.id].wins, 0);
  const pairs = store.pairStats();
  const rows = tried
    .sort((a, b) => (prog[b.id].at ?? 0) - (prog[a.id].at ?? 0))
    .map((c) => {
      const p = prog[c.id];
      const words = Object.entries(p.words).map(([w, [t, k]]) => `<span class="${k ? "ok" : "missed"}">${esc(w)} ${k}/${t}</span>`).join(" ");
      return `<tr data-cat="${c.cat}"><td><a href="#/c/${c.id}"><b>${esc(c.big)}</b> ${ipa(c.ipa)}</a></td><td>${stars(store.stars(c.id))}</td><td>${p.wins}/${p.tries}</td><td class="small">${words}</td></tr>`;
    }).join("");
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Progress</nav>
    <h1>⭐ ${store.currentLearner() === "Me" ? "Your progress" : `${esc(store.currentLearner())}’s progress`}</h1>
    <div class="stats">
      <div data-cat="plosive"><b>${tried.length}</b><small>cards practiced</small></div>
      <div data-cat="vowel"><b>${total ? Math.round((wins / total) * 100) : 0}%</b><small>tries matched</small></div>
      <div data-cat="fricative"><b>${ALL_CARDS.filter((c) => store.stars(c.id) === 3).length}</b><small>3-star cards</small></div>
      <div data-cat="liquid"><b>${pairs.tries ? Math.round((pairs.wins / pairs.tries) * 100) : 0}%</b><small>minimal pairs (${pairs.tries})</small></div>
    </div>
    ${rows ? `<div class="table-wrap"><table class="chart"><thead><tr><th>Card</th><th>Stars</th><th>Matched</th><th>Words</th></tr></thead><tbody>${rows}</tbody></table></div>`
      : `<div class="empty"><p>No practice yet.</p><a class="btn primary" href="#/deck/consonants">Start with the consonants</a></div>`}
    <p class="muted small">Stars: ★ = 1 word said right, ★★ = 3 words, ★★★ = 5 words. Progress is saved on this device.</p>`);
}

// ───────────────────────── settings ─────────────────────────
async function viewSettings() {
  const s = store.settings();
  const voices = browserVoices();
  const h = await health();
  const serverVoices = h.voices?.length ? h.voices
    : ["asteria", "luna", "stella", "athena", "hera", "orion", "arcas", "perseus", "angus", "orpheus", "helios", "zeus"];
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Settings</nav>
    <h1>⚙️ Settings</h1>
    <form class="settings" onsubmit="return false">
      <fieldset><legend>Look</legend>
        <div class="look-picker" role="radiogroup">
          ${Object.entries(LOOKS).map(([id, l]) => `
            <label class="look-option" data-preview="${id}">
              <input type="radio" name="look" value="${id}" ${s.look === id ? "checked" : ""}>
              <span class="look-swatch" aria-hidden="true"><i></i><i></i><i></i><b>Aa</b></span>
              <span><b>${esc(l.name)}</b><small>${esc(l.blurb)}</small></span>
            </label>`).join("")}
        </div>
      </fieldset>
      <fieldset><legend>Learner</legend>
        <label>Who’s practicing?
          <select id="learner">${store.learners().map((l) => `<option ${l === store.currentLearner() ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>
        </label>
        <div class="row"><input id="new-learner" placeholder="Add a learner’s name"><button class="btn" id="add-learner">Add</button>
        <button class="btn danger" id="del-learner">Remove current</button></div>
        <label>First language (for ESL tips)
          <select id="language"><option value="">English / not set</option>${LANGUAGES.map((l) => `<option value="${l.id}" ${l.id === s.language ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select>
        </label>
        <label class="check"><input type="checkbox" id="showIpa" ${s.showIpa ? "checked" : ""}> Show IPA symbols (like /θ/)</label>
        <label class="check"><input type="checkbox" id="kidMode" ${s.kidMode ? "checked" : ""}> Kid mode (bigger buttons)</label>
      </fieldset>
      <fieldset><legend>Voice</legend>
        <label>Voice source
          <select id="ttsSource">
            <option value="auto" ${s.ttsSource === "auto" ? "selected" : ""}>Automatic (server voice if available)</option>
            <option value="server" ${s.ttsSource === "server" ? "selected" : ""}>Server voice</option>
            <option value="browser" ${s.ttsSource === "browser" ? "selected" : ""}>This device’s built-in voice (works offline)</option>
          </select></label>
        <label>Server voice
          <select id="serverVoice">${serverVoices
            .map((v) => `<option ${v === s.serverVoice ? "selected" : ""}>${v}</option>`).join("")}</select></label>
        <label>Device voice
          <select id="voice"><option value="">Automatic</option>${voices.map((v) => `<option ${v.name === s.voice ? "selected" : ""} value="${esc(v.name)}">${esc(v.name)} (${esc(v.lang)})</option>`).join("")}</select></label>
        <label>Speed <input type="range" id="rate" min="0.5" max="1.2" step="0.05" value="${s.rate}"> <output id="rate-out">${s.rate}</output></label>
        <button class="btn" data-say="The quick brown fox jumps over the lazy dog.">🔊 Test voice</button>
      </fieldset>
      <fieldset><legend>Speech checker</legend>
        <p id="health" class="muted">Checking…</p>
        <label>Passcode (only if your server requires one)
          <input id="passcode" type="password" autocomplete="off" value="${esc(s.passcode)}"></label>
      </fieldset>
      <fieldset><legend>Backup</legend>
        <div class="row"><button class="btn" id="export">⬇ Download progress</button>
        <label class="btn">⬆ Restore <input type="file" id="import" accept="application/json" hidden></label></div>
      </fieldset>
    </form>`);
  const on = (id, ev, fn) => document.getElementById(id).addEventListener(ev, fn);
  document.querySelectorAll('input[name="look"]').forEach((r) => r.addEventListener("change", () => { lookOverride = null; store.setSetting("look", r.value); applyLook(); }));
  on("learner", "change", (e) => { store.setLearner(e.target.value); viewSettings(); });
  on("add-learner", "click", () => { store.setLearner(document.getElementById("new-learner").value); viewSettings(); });
  on("del-learner", "click", () => {
    if (confirm(`Remove ${store.currentLearner()} and their progress?`)) { store.removeLearner(store.currentLearner()); viewSettings(); }
  });
  for (const id of ["language", "ttsSource", "serverVoice", "voice"]) on(id, "change", (e) => store.setSetting(id, e.target.value));
  for (const id of ["showIpa", "kidMode"]) on(id, "change", (e) => { store.setSetting(id, e.target.checked); applyLook(); });
  on("rate", "input", (e) => { store.setSetting("rate", +e.target.value); document.getElementById("rate-out").textContent = e.target.value; });
  on("passcode", "change", async (e) => { store.setSetting("passcode", e.target.value.trim()); await showHealth(true); });
  on("export", "click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([store.exportData()], { type: "application/json" }));
    a.download = "articulation-progress.json";
    a.click();
  });
  on("import", "change", async (e) => {
    try { store.importData(await e.target.files[0].text()); toast("Progress restored."); viewSettings(); }
    catch (err) { toast(err.message); }
  });
  if ("speechSynthesis" in window && !voices.length) speechSynthesis.onvoiceschanged = () => location.hash === "#/settings" && viewSettings();
  showHealth();
}

async function showHealth(force) {
  const h = await health(force);
  const el = document.getElementById("health");
  if (el) el.innerHTML = h.stt
    ? `✅ Connected: <b>${esc(h.backend)}</b> · ${esc(h.model)}${h.tts ? " · server voice on" : ""}`
    : `⚠️ Not connected. ${esc(h.error ?? "")}`;
}

// ───────────────────────── sentence checkup ─────────────────────────
/** "Your practice plan" box: the checkup's suggested sounds and word-pattern lessons. */
function planHtml(ck) {
  const cards = ck.suggested.map((id) => cardById[`s-${id}`]).filter(Boolean);
  return `<div class="plan">
    <div class="plan-head"><b>🩺 Your practice plan</b><a class="small" href="#/checkup">Retake checkup</a></div>
    ${cards.length ? `<div class="plan-cards">${cards.map((c) =>
      `<a class="chip" data-cat="${c.cat}" href="#/card/checkup/${c.id}">${esc(c.big)}${c.ipa && store.settings().showIpa ? ` <span class="ipa">/${esc(c.ipa)}/</span>` : ""}</a>`).join("")}
      ${ck.patterns.slice(0, 2).map((p) => `<a class="chip" href="#/learn/${p.lesson}">📘 ${esc(p.name)}</a>`).join("")}</div>`
    : `<p class="small muted">Your checkup came through clearly — try the <a href="#/pairs">minimal pairs game</a> or the vowels.</p>`}
  </div>`;
}

let ck; // checkup state: { step: "intro" | number | "results", takes: [], take?, result? }

function viewCheckup() {
  ck = { step: "intro", takes: [] };
  renderCheckup();
}

async function renderCheckup() {
  const n = CHECKUP_SENTENCES.length;
  if (ck.step === "intro") {
    const h = await health();
    const lang = store.settings().language;
    render(`
      <nav class="crumbs"><a href="#/">Home</a> › Checkup</nav>
      <div class="checkup">
        <h1>🩺 Find your practice sounds</h1>
        <p>You’ll read ${n} short sentences out loud. Each one hides a few tricky sounds. Afterwards you’ll see which sounds to practice first.</p>
        <ul class="checkup-tips">
          <li>Read at your <b>normal speed</b>, like talking to a friend.</li>
          <li>Find a quiet spot. Hold the phone about a hand’s width from your mouth.</li>
          <li>Young readers: a grown-up can read each sentence first, or tap <b>🔊 Hear it</b>.</li>
        </ul>
        <label class="lang-pick">First language <span class="muted small">(optional — adds tips made for you)</span>
          <select id="ck-lang"><option value="">English / not set</option>${LANGUAGES.map((l) => `<option value="${l.id}" ${l.id === lang ? "selected" : ""}>${esc(l.name)}</option>`).join("")}</select>
        </label>
        ${h.stt ? "" : `<p class="feedback warn">The speech checker isn’t reachable right now, so the checkup can’t listen. Check your connection and try again.</p>`}
        <div class="actions start">
          <button class="btn primary big-btn" id="ck-start" ${h.stt && micSupported() ? "" : "disabled"}>▶ Start</button>
          <a class="btn" href="#/">Not now</a>
        </div>
        <p class="muted small">This is a quick screen to pick practice sounds, not a diagnosis. The speech checker fills in from context, so it can miss small mistakes.</p>
      </div>`);
    document.getElementById("ck-lang").onchange = (e) => store.setSetting("language", e.target.value);
    document.getElementById("ck-start").onclick = () => { ck.step = 0; renderCheckup(); };
    return;
  }
  if (ck.step === "results") return renderCheckupResults();

  const i = ck.step;
  const s = CHECKUP_SENTENCES[i];
  const t = ck.take;
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Checkup</nav>
    <div class="checkup">
      <div class="ck-progress" aria-label="Sentence ${i + 1} of ${n}">${CHECKUP_SENTENCES.map((_, k) =>
        `<span class="${k < i ? "done" : k === i ? "now" : ""}"></span>`).join("")}</div>
      <p class="muted small">Sentence ${i + 1} of ${n} · ${esc(s.focus)}</p>
      <p class="ck-sentence">${t?.aligned ? t.aligned.map((w) =>
        `<span class="${w.status}" ${w.heard ? `title="heard “${esc(w.heard)}”"` : ""}>${esc(w.word)}</span>`).join(" ") : esc(s.text)}</p>
      ${t?.aligned ? `<p class="muted small">I heard: “${esc(t.text)}”</p>` : ""}
      <button class="rec" id="ck-rec" aria-label="Record">${t ? "↻" : "🎤"}</button>
      <p class="status" id="ck-status">${t ? "Happy with it? Go on — or tap to read it again." : "Tap the microphone and read the sentence."}</p>
      <div class="actions">
        <button class="btn" data-say="${esc(s.text)}">🔊 Hear it</button>
        ${t ? `<button class="btn" id="ck-mine">▶ My reading</button>` : ""}
      </div>
    </div>
    <div class="bottom-bar">
      <button class="btn bar-nav" id="ck-skip">${t ? "" : "Skip"}</button>
      <button class="btn flip-btn ${t ? "nudge" : ""}" id="ck-next" ${t ? "" : "disabled"}>${i + 1 < n ? "Next sentence →" : "See my results →"}</button>
    </div>`);
  const skip = document.getElementById("ck-skip");
  if (t) skip.remove();
  else skip.onclick = () => advanceCheckup();
  document.getElementById("ck-next").onclick = () => advanceCheckup();
  document.getElementById("ck-mine")?.addEventListener("click", () => playUrl(t.url).catch((e) => toast(`🔇 ${e.message}`)));
  const btn = document.getElementById("ck-rec");
  const status = document.getElementById("ck-status");
  const finish = async () => {
    if (recorder.state !== "recording") return;
    btn.classList.remove("recording");
    btn.textContent = "⏳";
    status.textContent = "Listening back…";
    const step = ck.step;
    try {
      const take = await recorder.stop();
      if (ck.step !== step) return;
      if (!take.speech) { status.textContent = "🙉 I didn’t hear anything. Tap and try again, a little louder."; btn.textContent = "🎤"; return; }
      const { text, words } = await transcribe(take.wav);
      if (ck.step !== step) return;
      ck.take = { index: i, text, words, url: take.url, aligned: scoreSentence(s.text, text).words };
    } catch (e) {
      status.textContent = e.message;
      btn.textContent = "🎤";
      return;
    }
    renderCheckup();
  };
  btn.onclick = async () => {
    if (recorder.state === "recording") return finish();
    if (recorder.state !== "idle") return;
    stopAudio();
    try {
      await recorder.start({ maxMs: 14000, silenceMs: 1800, onLevel: (l) => btn.style.setProperty("--level", l.toFixed(2)), onAutoStop: finish });
      btn.classList.add("recording");
      btn.textContent = "⏹";
      status.textContent = "Listening… read the whole sentence. It stops when you finish.";
    } catch (e) {
      status.textContent = e.message;
    }
  };
}

function advanceCheckup() {
  recorder.cancel();
  if (ck.take) ck.takes.push(ck.take);
  ck.take = null;
  ck.step = ck.step + 1 < CHECKUP_SENTENCES.length ? ck.step + 1 : "results";
  renderCheckup();
}

function renderCheckupResults() {
  if (!ck.takes.length) {
    render(`<div class="checkup empty"><p>No sentences were recorded, so there’s nothing to suggest yet.</p>
      <a class="btn primary" href="#/checkup">Try again</a> <a class="btn" href="#/">Home</a></div>`);
    return;
  }
  const r = (ck.result ??= analyzeCheckup(ck.takes));
  store.setCheckup(r);
  const suggested = r.suggested.map((id) => cardById[`s-${id}`]).filter(Boolean);
  const reason = (id) => r.sounds.find((x) => x.id === id).examples.slice(0, 3).map((e) =>
    e.status === "changed" ? `“${esc(e.word)}” sounded like “${esc(e.heard)}”` : e.status === "missed" ? `“${esc(e.word)}” didn’t come through` : `“${esc(e.word)}” was unclear`).join(" · ");
  const pct = r.total ? Math.round((r.clear / r.total) * 100) : 0;
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Checkup</nav>
    <div class="checkup">
      <h1>${suggested.length ? "🎯 Here’s where to start" : "🎉 That came through clearly!"}</h1>
      <p><b>${r.clear} of ${r.total}</b> key words came through clearly (${pct}%).</p>
      ${ck.takes.length < 5 ? `<p class="callout small">You read ${ck.takes.length} of ${CHECKUP_SENTENCES.length} sentences, so this is based on just a few words. <a href="#/checkup">Read them all</a> for a better picture.</p>` : ""}
      ${suggested.length ? `<h2>Practice these sounds first</h2>
        <div class="ck-results">${suggested.map((c) => `
          <a class="ck-result" data-cat="${c.cat}" href="#/card/checkup/${c.id}">
            <span class="mini-glyph">${esc(shortLabel(c))}</span>
            <span><b>${esc(c.p.label)} ${ipa(c.ipa)}</b><small>${reason(c.p.id)}</small></span>
            <span aria-hidden="true">→</span>
          </a>`).join("")}</div>`
      : `<p>None of the test words stood out. Try the <a href="#/pairs">minimal pairs game</a> to train your ear, or practice the <a href="#/deck/vowels">vowels</a>.</p>`}
      ${r.patterns.length ? `<h2>Habits to know about</h2><div class="ck-results">${r.patterns.map((p) => `
        <a class="ck-result" href="#/learn/${p.lesson}"><span class="mini-glyph">📘</span>
          <span><b>${esc(p.name)}</b><small>${p.examples.slice(0, 3).map(esc).join(" · ")}</small></span><span aria-hidden="true">→</span></a>`).join("")}</div>` : ""}
      <div class="actions start">
        ${suggested.length ? `<a class="btn primary big-btn" href="#/card/checkup/${suggested[0].id}">▶ Start practicing</a>` : ""}
        <a class="btn" href="#/">Home</a>
      </div>
      <p class="muted small">Saved as “From my checkup” under <i>For you</i> on the home screen. Retake it any time to see how you’ve improved.</p>
    </div>`);
}

// ───────────────────────── install (download) the app ─────────────────────────
// Chrome, Edge and Samsung Internet offer a one-tap install through beforeinstallprompt;
// iPhone/iPad and Firefox need the browser menu, so the install page explains how.
let installPrompt = null;
const isInstalled = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

function updateInstallLink() {
  document.querySelectorAll(".install-link").forEach((a) => (a.hidden = isInstalled()));
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); // show our own button instead of the browser's mini-bar
  installPrompt = e;
  updateInstallLink();
  if (location.hash.startsWith("#/install")) viewInstall();
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  toast("✅ Installed! Open Articulation from your home screen.");
  updateInstallLink();
  if (location.hash.startsWith("#/install")) viewInstall();
});

function viewInstall() {
  const steps = isInstalled() ? `<p class="callout">✅ You’re using the installed app.</p>`
    : installPrompt ? `<button class="btn primary big-btn" id="install-now">⬇ Download app</button>
        <p class="muted small">Free and under 1 MB. It adds Articulation to your home screen and works offline.</p>`
    : isIos() ? `<div class="install-steps"><h2>On iPhone or iPad (Safari)</h2><ol>
        <li>Tap the <b>Share</b> button <span aria-hidden="true">(□↑)</span> at the bottom of Safari.</li>
        <li>Scroll down and tap <b>Add to Home Screen</b>, then <b>Add</b>.</li>
        <li>Open <b>Articulation</b> from your home screen.</li></ol>
        <p class="muted small">In Chrome on iPhone, use the Share button in the address bar, then Add to Home Screen.</p></div>`
    : `<div class="install-steps"><h2>On Android (Chrome)</h2><ol>
        <li>Tap the <b>⋮</b> menu at the top right.</li>
        <li>Tap <b>Install app</b> (or <b>Add to Home screen</b>).</li></ol></div>
       <div class="install-steps"><h2>On a computer (Chrome or Edge)</h2><ol>
        <li>Click the install icon <span aria-hidden="true">(⊕ or 🖥↓)</span> at the right end of the address bar,</li>
        <li>or open the browser menu and choose <b>Install Articulation</b>.</li></ol>
        <p class="muted small">Firefox and Safari on a Mac can’t install web apps yet — use Chrome or Edge, or just bookmark this page.</p></div>`;
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Download app</nav>
    <div class="install">
      <div class="install-hero"><img src="icons/icon-192.png" alt=""><div><h1>Get the app</h1>
        <p class="muted">Practice from your home screen — full screen, quick to open, and the cards, lessons and games work without internet.</p></div></div>
      ${steps}
      <p class="muted small">The speech checker still needs a connection. Your progress stays on this device.</p>
    </div>`);
  document.getElementById("install-now")?.addEventListener("click", async () => {
    const p = installPrompt;
    if (!p) return;
    installPrompt = null;
    p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome !== "accepted") { installPrompt = null; toast("No problem — you can install it any time from this page."); }
    viewInstall();
  });
}

// ?look=studio in the page URL tries a look without changing the saved setting (handy for previews).
const urlLook = new URLSearchParams(location.search).get("look");
if (urlLook && LOOKS[urlLook]) lookOverride = urlLook;
applyLook();
updateInstallLink();
window.addEventListener("hashchange", route);
route();
health(); // warm up: the first tap on 🔊 shouldn't wait for this

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch((e) => console.warn("Offline support unavailable", e));
}
