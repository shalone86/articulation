// Articulation Workshop — single-page app (no build step).

import { PHONEMES, phonemeById, MANNERS } from "./data/phonemes.js";
import { LANGUAGES, languageName } from "./data/languages.js";
import { LESSONS, lessonById } from "./data/lessons.js";
import { HOMOPHONES, HETERONYMS } from "./data/homophones.js";
import { DECKS, deckById, cardById, ALL_CARDS, GRAPHEME_TYPES } from "./decks.js";
import { Recorder, micSupported } from "./audio.js";
import { scoreWord, scoreSentence, isSuccess, candidatesFor, refineWithScores } from "./score.js";
import { speak, playUrl, stop as stopAudio, browserVoices } from "./tts.js";
import { health, transcribe } from "./api.js";
import * as store from "./store.js";

const $app = document.getElementById("app");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(([, x]) => x);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ipa = (s) => (store.settings().showIpa && s ? `<span class="ipa">/${esc(s)}/</span>` : "");
const say = (text, label = text, cls = "") =>
  `<button class="say ${cls}" data-say="${esc(text)}" title="Hear “${esc(text)}”">🔊 ${esc(label)}</button>`;
const pairBtns = ([a, b]) => `<span class="pair">${say(a)}<span class="vs">vs</span>${say(b)}</span>`;
const stars = (n) => `<span class="stars" aria-label="${n} of 3 stars">${"★".repeat(n)}${"☆".repeat(3 - n)}</span>`;

const recorder = new Recorder();

// ───────────────────────── router ─────────────────────────
const routes = [
  [/^$/, viewHome],
  [/^deck\/([\w-]+)$/, viewDeck],
  [/^card\/([\w-]+)\/(\d+)$/, viewCard],
  [/^c\/([\w-]+)$/, (id) => openCard(id)],
  [/^learn$/, viewLearn],
  [/^learn\/([\w-]+)$/, viewLesson],
  [/^pairs$/, viewPairs],
  [/^homophones$/, viewHomophones],
  [/^chart$/, viewChart],
  [/^progress$/, viewProgress],
  [/^settings$/, viewSettings],
];

function route() {
  recorder.cancel();
  stopAudio();
  const path = location.hash.replace(/^#\/?/, "");
  for (const [re, fn] of routes) {
    const m = path.match(re);
    if (m) {
      fn(...m.slice(1));
      document.querySelectorAll(".nav a").forEach((a) =>
        a.classList.toggle("active", path.startsWith(a.getAttribute("href").slice(2) || "\u0000")));
      window.scrollTo(0, 0);
      return;
    }
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
  b.classList.add("playing");
  try { await speak(b.dataset.say, { slow: b.dataset.slow === "1" }); }
  catch (err) { toast(err.message); }
  finally { b.classList.remove("playing"); }
});

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  document.body.append(t);
  setTimeout(() => t.remove(), 4000);
}

// ───────────────────────── home ─────────────────────────
async function viewHome() {
  const lang = store.settings().language;
  const groups = [...new Set(DECKS.map((d) => d.group))];
  render(`
    <section class="hero">
      <h1>Hi, ${esc(store.currentLearner())}! 👋</h1>
      <p>Pick a deck. On each card, <b>🎤 record your try</b>, then <b>flip it 👂 to hear it said</b> the right way.</p>
      <div id="backend" class="backend muted">Checking speech checker…</div>
    </section>
    <section class="tiles">
      <a class="tile big" href="#/deck/consonants"><span>🅱️</span>Consonants</a>
      <a class="tile big" href="#/deck/vowels"><span>🅰️</span>Vowels</a>
      <a class="tile big" href="#/deck/digraphs"><span>🔠</span>Digraphs</a>
      <a class="tile big" href="#/pairs"><span>👂</span>Minimal pairs</a>
      <a class="tile" href="#/learn"><span>📚</span>Learn how sounds work</a>
      <a class="tile" href="#/chart"><span>🗺️</span>Spelling chart</a>
      <a class="tile" href="#/homophones"><span>👯</span>Homophones</a>
      <a class="tile" href="#/progress"><span>⭐</span>My progress</a>
    </section>
    ${lang ? "" : `<p class="callout">🌍 Learning English as a new language? <a href="#/settings">Choose your first language</a> to see tips made for you and a personal focus deck.</p>`}
    ${groups.map((g) => `
      <h2>${esc(g)}</h2>
      <div class="deck-list">
        ${DECKS.filter((d) => d.group === g).map((d) => {
          const n = d.cards().length;
          return `<a class="deck" href="#/deck/${d.id}"><span class="emoji">${d.emoji}</span><b>${esc(d.name)}</b><small>${n} card${n === 1 ? "" : "s"}</small></a>`;
        }).join("")}
      </div>`).join("")}
  `);
  const h = await health();
  const el = document.getElementById("backend");
  if (!el) return;
  el.innerHTML = h.stt
    ? `✅ Speech checker ready <small>(${esc(h.backend)} · ${esc(h.model)})</small>`
    : `⚠️ Speech checker offline — you can still record and compare by ear. <small>${esc(h.error ?? "")}</small>`;
}

// ───────────────────────── deck ─────────────────────────
function viewDeck(id) {
  const deck = deckById[id];
  if (!deck) return (location.hash = "#/");
  const cards = deck.cards();
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › ${esc(deck.name)}</nav>
    <h1>${deck.emoji} ${esc(deck.name)}</h1>
    ${deck.describe ? `<p class="muted">${esc(deck.describe())}</p>` : ""}
    ${cards.length ? `<a class="btn primary" href="#/card/${id}/0">▶ Start practicing</a>` : ""}
    <div class="card-grid">
      ${cards.map((c, i) => `
        <a class="mini-card" href="#/card/${id}/${i}">
          <span class="emoji">${c.emoji ?? ""}</span>
          <b>${esc(c.big)}</b>
          ${c.ipa ? ipa(c.ipa) : ""}
          <small>${esc(c.words[0])}</small>
          ${stars(store.stars(c.id))}
        </a>`).join("") || `<p class="muted">Nothing here yet.</p>`}
    </div>`);
}

function openCard(cardId) {
  const deck = DECKS.find((d) => d.cards().some((c) => c.id === cardId));
  if (!deck) return (location.hash = "#/");
  const i = deck.cards().findIndex((c) => c.id === cardId);
  location.replace(`#/card/${deck.id}/${i}`);
}

// ───────────────────────── flip card ─────────────────────────
let cs; // card view state

function viewCard(deckId, index) {
  const deck = deckById[deckId];
  const cards = deck?.cards() ?? [];
  index = +index;
  if (!cards[index]) return (location.hash = `#/deck/${deckId}`);
  const card = cards[index];
  cs = { deck, cards, index, card, target: card.words[0], isSentence: false, flipped: false, take: null, result: null, busy: false };
  const prev = (index - 1 + cards.length) % cards.length;
  const next = (index + 1) % cards.length;
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › <a href="#/deck/${deck.id}">${esc(deck.name)}</a> › ${index + 1} / ${cards.length}</nav>
    <div class="card-nav">
      <a class="btn" href="#/card/${deck.id}/${prev}" aria-label="Previous card">◀</a>
      <div class="flip-scene"><div class="flip" id="flip">
        <div class="face front" id="front"></div>
        <div class="face back" id="back"></div>
      </div></div>
      <a class="btn" href="#/card/${deck.id}/${next}" aria-label="Next card">▶</a>
    </div>
    <p class="muted center keys">Keys: <kbd>space</kbd> record · <kbd>F</kbd> flip · <kbd>←</kbd> <kbd>→</kbd> cards</p>
  `);
  renderFront();
  renderBack();
}

function targetPicker() {
  const c = cs.card;
  return `<div class="targets" role="group" aria-label="Choose what to practice">
    ${c.words.map((w) => `<button class="chip ${!cs.isSentence && w === cs.target ? "on" : ""}" data-target="${esc(w)}">${esc(w)}</button>`).join("")}
    ${c.sentence ? `<button class="chip sentence ${cs.isSentence ? "on" : ""}" data-target="__sentence">💬 sentence</button>` : ""}
  </div>`;
}

function renderFront() {
  const c = cs.card;
  const p = c.p;
  const target = cs.isSentence ? c.sentence : cs.target;
  const tags = p
    ? [p.manner, p.voicing, p.group === "consonant" ? null : p.group]
        .filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join("")
    : `<span class="tag">${esc(c.g.type.replace("-", " "))}</span>`;
  document.getElementById("front").innerHTML = `
    <header class="face-head"><span>🎤 Your turn</span>${stars(store.stars(c.id))}</header>
    <div class="glyph">${c.emoji ? `<span class="emoji">${c.emoji}</span>` : ""}<b>${esc(c.big)}</b>${ipa(c.ipa)}</div>
    <div class="tags">${tags}</div>
    <p class="say-this">Say: <strong class="${cs.isSentence ? "sentence-text" : "word-text"}">${esc(target)}</strong></p>
    ${targetPicker()}
    <div class="rec-row">
      <button class="rec" id="rec" aria-label="Record">${recorder.state === "recording" ? "⏹" : "🎤"}</button>
    </div>
    <div class="status" id="status">${micSupported() ? "Tap the microphone and say it." : "This browser can’t record audio. You can still flip the card to listen."}</div>
    <div id="result" aria-live="polite">${resultHtml()}</div>
    <button class="btn flip-btn" data-flip>Flip to listen 👂</button>
  `;
}

function resultHtml() {
  if (!cs.take) return "";
  const mine = `<button class="btn" data-play-mine>▶ My try</button><button class="btn" data-compare>🔁 Mine vs. model</button>`;
  const r = cs.result;
  if (!r) return `<div class="actions">${mine}</div>`;
  if (r.error) return `<div class="feedback warn"><p>${esc(r.error)}</p><p class="muted">Listen to your try and compare it with the model by ear.</p></div><div class="actions">${mine}</div>`;
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

function renderBack() {
  const c = cs.card;
  const lang = store.settings().language;
  const back = document.getElementById("back");
  let detail;
  if (c.kind === "sound") {
    const p = c.p;
    const myNote = lang && p.esl?.[lang];
    const otherNotes = Object.entries(p.esl ?? {}).filter(([l]) => l !== lang);
    const positions = p.positions
      ? Object.entries(p.positions).filter(([, ws]) => ws.length)
          .map(([pos, ws]) => `<div class="pos"><small>${pos}</small>${ws.map((w) => say(w)).join("")}</div>`).join("")
      : `<div class="pos">${p.words.map((w) => say(w)).join("")}</div>`;
    detail = `
      <section><h3>How to make it</h3><p>${esc(p.how)}</p><p class="tip">💡 ${esc(p.tip)}</p>
        <p class="tags">${p.manner ? `<a class="tag" href="#/learn/${MANNERS[p.manner].lesson}">${esc(p.manner)}</a>` : ""}
        ${p.voicing ? `<a class="tag" href="#/learn/voicing">${esc(p.voicing)}</a>` : ""}
        ${p.place ? `<span class="tag">${esc(p.place)}</span>` : ""}
        ${p.partner ? `<a class="tag" href="#/c/s-${p.partner}">partner: ${esc(phonemeById[p.partner].label)}</a>` : ""}</p>
      </section>
      ${myNote ? `<section class="callout"><h3>🌍 For ${esc(languageName(lang))} speakers</h3><p>${esc(myNote)}</p></section>` : ""}
      <section><h3>Ways to spell it</h3><div class="spellings">${p.spellings.map(([g, w]) =>
        `<button class="spelling" data-say="${esc(w.replace(/ \(.*\)$/, ""))}"><b>${esc(g)}</b><small>${esc(w)}</small></button>`).join("")}</div></section>
      <section><h3>More words</h3>${positions}</section>
      ${p.pairs?.length ? `<section><h3>Don’t mix it up (minimal pairs)</h3><div class="pairs">${p.pairs.map(pairBtns).join("")}</div></section>` : ""}
      ${p.kids ? `<details><summary>🧒 For kids & parents</summary><p>${esc(p.kids)}</p></details>` : ""}
      ${otherNotes.length ? `<details><summary>🌍 Tips for other first languages</summary><dl class="notes">${otherNotes.map(([l, n]) =>
        `<dt>${esc(languageName(l))}</dt><dd>${esc(n)}</dd>`).join("")}</dl></details>` : ""}`;
  } else {
    const g = c.g;
    detail = `
      <section><h3>What it says</h3><div class="sound-list">${g.sounds.length ? g.sounds.map(([id, w]) => {
        const p = phonemeById[id];
        return `<div class="sound-row">${say(w)} <a href="#/c/s-${id}">${esc(p.label)} ${ipa(p.ipa)}</a></div>`;
      }).join("") : `<p>Nothing — it’s silent!</p>`}</div></section>
      <section><p class="tip">💡 ${esc(g.note)}</p><p class="muted small">${esc(GRAPHEME_TYPES[g.type].blurb)}</p></section>
      <section><h3>Words</h3><div class="pos">${g.words.map((w) => say(w)).join("")}</div></section>`;
  }
  back.innerHTML = `
    <header class="face-head"><span>👂 Listen</span><span class="big-label">${esc(c.big)} ${ipa(c.ipa)}</span></header>
    <div class="listen">
      <button class="btn primary" data-say="${esc(cs.target)}">🔊 ${esc(cs.target)}</button>
      <button class="btn" data-say="${esc(cs.target)}" data-slow="1">🐢 Slowly</button>
      ${c.sentence ? `<button class="btn" data-say="${esc(c.sentence)}">💬 In a sentence</button>` : ""}
    </div>
    ${c.sentence ? `<p class="sentence-text center">“${esc(c.sentence)}”</p>` : ""}
    ${detail}
    <button class="btn flip-btn" data-flip>Flip to try 🎤</button>`;
}

function flip(to = !cs.flipped) {
  cs.flipped = to;
  document.getElementById("flip").classList.toggle("flipped", to);
  if (to) document.getElementById("back").scrollTop = 0;
}

async function toggleRecord() {
  if (cs.busy || !micSupported()) return;
  const btn = document.getElementById("rec");
  const status = document.getElementById("status");
  if (recorder.state === "recording") return finishRecording();
  if (recorder.state !== "idle") return;
  stopAudio();
  try {
    await recorder.start({
      maxMs: cs.isSentence ? 15000 : 5000,
      onLevel: (l) => btn.style.setProperty("--level", l.toFixed(2)),
      onAutoStop: () => finishRecording(),
    });
    btn.classList.add("recording");
    btn.textContent = "⏹";
    status.textContent = "Listening… (it stops by itself when you finish)";
  } catch (e) {
    status.textContent = e.message;
  }
}

async function finishRecording() {
  if (recorder.state !== "recording") return;
  const myCard = cs.card;
  const target = cs.isSentence ? cs.card.sentence : cs.target;
  cs.busy = true;
  const status = document.getElementById("status");
  status.textContent = "Checking…";
  const btn = document.getElementById("rec");
  btn.classList.remove("recording");
  btn.textContent = "⏳";
  try {
    const take = await recorder.stop();
    if (cs.card !== myCard) return;
    cs.take = take;
    cs.result = null;
    if (!take.speech) {
      cs.result = { score: { result: "nothing", heard: "" } };
    } else if (!(await health()).stt) {
      cs.result = { error: "The speech checker isn’t connected right now." };
    } else {
      const { text, scores } = await transcribe(take.wav, cs.isSentence ? [] : candidatesFor(target, myCard.pairs));
      if (cs.card !== myCard) return;
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
    cs.result = { error: e.message };
  } finally {
    cs.busy = false;
  }
  if (cs.card === myCard) {
    renderFront();
    document.getElementById("status").textContent = "Tap the microphone to try again.";
  }
}

$app.addEventListener("click", async (e) => {
  if (!cs || !document.getElementById("flip")) return;
  const t = e.target.closest("button");
  if (!t) return;
  if (t.id === "rec") return toggleRecord();
  if (t.hasAttribute("data-flip")) return flip();
  if (t.dataset.target) {
    cs.isSentence = t.dataset.target === "__sentence";
    if (!cs.isSentence) cs.target = t.dataset.target;
    cs.take = cs.result = null;
    renderFront();
    renderBack();
    return;
  }
  if (t.hasAttribute("data-play-mine") && cs.take) return playUrl(cs.take.url);
  if (t.hasAttribute("data-compare") && cs.take) {
    await playUrl(cs.take.url);
    await new Promise((r) => setTimeout(r, 400));
    return speak(cs.isSentence ? cs.card.sentence : cs.target);
  }
});

document.addEventListener("keydown", (e) => {
  if (!document.getElementById("flip") || e.target.closest("input, select, textarea")) return;
  if (e.code === "Space") { e.preventDefault(); toggleRecord(); }
  else if (e.key === "f" || e.key === "F") flip();
  else if (e.key === "ArrowRight") document.querySelector('.card-nav a:last-child')?.click();
  else if (e.key === "ArrowLeft") document.querySelector('.card-nav a:first-child')?.click();
});

// ───────────────────────── learn ─────────────────────────
function viewLearn() {
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Learn</nav>
    <h1>📚 Learn how sounds work</h1>
    <div class="lesson-list">
      ${LESSONS.map((l) => `<a class="lesson" href="#/learn/${l.id}"><span class="emoji">${l.emoji}</span><div><b>${esc(l.title)}</b><p>${esc(l.summary)}</p></div></a>`).join("")}
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
      <h1>${l.emoji} ${esc(l.title)}</h1>
      <p class="lead">${esc(l.summary)}</p>
      ${l.sections.map((s) => `
        <section>
          <h2>${esc(s.h)}</h2>
          ${s.html ?? ""}
          ${s.words ? `<div class="pos">${s.words.map((w) => say(w)).join("")}</div>` : ""}
          ${s.pairs ? `<div class="pairs">${s.pairs.map(pairBtns).join("")}</div>` : ""}
          ${s.cards ? `<div class="card-links">${s.cards.map((c) => {
            const card = cardById[`s-${c}`] ?? cardById[c];
            return card ? `<a class="mini-card" href="#/c/${card.id}"><b>${esc(card.big)}</b>${ipa(card.ipa)}<small>${esc(card.words[0])}</small></a>` : "";
          }).join("")}</div>` : ""}
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
    <h1>👂 Minimal pairs</h1>
    <p class="muted">Two words, one sound different. <b>Listen</b> mode trains your ear; <b>Say</b> mode checks whether the speech checker hears the word you meant.</p>
    <div class="controls">
      <div class="seg" role="group">
        <button class="${ps.mode === "listen" ? "on" : ""}" data-mode="listen">👂 Listen</button>
        <button class="${ps.mode === "say" ? "on" : ""}" data-mode="say">🎤 Say</button>
      </div>
      <select id="pair-filter" aria-label="Sound">${opts.map(([v, n]) => `<option value="${v}" ${v === ps.filter ? "selected" : ""}>${esc(n)}</option>`).join("")}</select>
      <span class="muted small">Score: ${st.wins} / ${st.tries}</span>
    </div>
    <div class="game" id="game"></div>`);
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

function nextPair() {
  const pool = pairPool();
  const game = document.getElementById("game");
  if (!pool.length) return (game.innerHTML = `<p class="muted">No pairs for this choice.</p>`);
  const pair = pick(pool);
  const target = Math.random() < 0.5 ? pair.a : pair.b;
  const other = target === pair.a ? pair.b : pair.a;
  const p = phonemeById[pair.sound];
  ps.round = { pair, target, other, answered: false };
  if (ps.mode === "listen") {
    game.innerHTML = `
      <p class="prompt">Which word do you hear?</p>
      <button class="btn primary big-btn" data-say="${esc(target)}">🔊 Play</button>
      <button class="btn" data-say="${esc(target)}" data-slow="1">🐢 Slow</button>
      <div class="choices">${shuffle([pair.a, pair.b]).map((w) => `<button class="choice" data-choice="${esc(w)}">${esc(w)}</button>`).join("")}</div>
      <div id="pair-fb" aria-live="polite"></div>`;
    setTimeout(() => speak(target).catch(() => {}), 250);
    game.querySelectorAll("[data-choice]").forEach((b) => (b.onclick = () => {
      if (ps.round.answered) return;
      ps.round.answered = true;
      const ok = b.dataset.choice === target;
      store.recordPair(ok);
      b.classList.add(ok ? "right" : "wrong");
      if (!ok) game.querySelector(`[data-choice="${CSS.escape(target)}"]`)?.classList.add("right");
      document.getElementById("pair-fb").innerHTML = `
        <div class="feedback ${ok ? "good" : "warn"}">
          <p><b>${ok ? "✅ Right!" : `❌ It was “${esc(target)}”.`}</b> Listen to both: ${pairBtns([pair.a, pair.b])}</p>
          <p class="muted small">Sound: <a href="#/c/s-${p.id}">${esc(p.label)} ${ipa(p.ipa)}</a></p>
        </div>
        <button class="btn primary" id="next-pair">Next →</button>`;
      document.getElementById("next-pair").onclick = nextPair;
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
        if (!take.speech) html = `<div class="feedback warn"><p>🙉 I didn’t hear anything. Try again.</p></div>`;
        else if (!(await health()).stt) html = `<div class="feedback warn"><p>The speech checker is offline.</p></div><button class="btn" id="mine">▶ My try</button>`;
        else {
          const pairs = [[pair.a, pair.b]];
          const { text, scores } = await transcribe(take.wav, candidatesFor(target, pairs));
          const s = refineWithScores(scoreWord(target, text, { pairs }), target, scores, pairs);
          const ok = isSuccess(s);
          if (s.result !== "nothing") store.recordPair(ok);
          html = `<div class="feedback ${ok ? "good" : "warn"}"><p><b>${
            ok ? `✅ That sounded like “${esc(target)}”.` : s.result === "swap" ? `🤔 That sounded like “${esc(other)}”.` : s.result === "nothing" ? "🙉 I didn’t catch that." : `🤔 I heard “${esc(s.word ?? s.heard)}”.`
          }</b></p>${!ok ? `<p class="tip">💡 ${esc(p.how)}</p>` : ""}</div>
          <button class="btn" id="mine">▶ My try</button>`;
        }
        fb.innerHTML = html + `<button class="btn primary" id="next-pair">Next →</button>`;
        document.getElementById("mine")?.addEventListener("click", () => playUrl(take.url));
        document.getElementById("next-pair").onclick = nextPair;
      } catch (e) {
        fb.innerHTML = `<div class="feedback warn"><p>${esc(e.message)}</p></div><button class="btn primary" id="next-pair">Next →</button>`;
        document.getElementById("next-pair").onclick = nextPair;
      }
      btn.textContent = "🎤";
    };
    btn.onclick = async () => {
      if (recorder.state === "recording") return finish();
      if (recorder.state !== "idle") return;
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
      ${HOMOPHONES.map((g) => `<div class="hgroup">${say(g[0][0], "🔊")}${g.map(([w, m]) => `<span><b>${esc(w)}</b> <small>${esc(m)}</small></span>`).join("")}</div>`).join("")}
    </div>
    <h2>Heteronyms: same spelling, different sound</h2>
    <div class="homophone-list">
      ${HETERONYMS.map((h) => `<div class="hgroup"><b class="het">${esc(h.word)}</b>
        <span>${say(h.a[1], "🔊")} <small>${esc(h.a[0])} — “${esc(h.a[1])}”</small></span>
        <span>${say(h.b[1], "🔊")} <small>${esc(h.b[0])} — “${esc(h.b[1])}”</small></span></div>`).join("")}
    </div>`);
  homophoneQuiz();
}

function homophoneQuiz() {
  const group = pick(HOMOPHONES);
  const [word, meaning] = pick(group);
  const el = document.getElementById("hquiz");
  el.innerHTML = `
    <p class="prompt">Quiz: which spelling means <b>“${esc(meaning)}”</b>? ${say(word, "hear it")}</p>
    <div class="choices">${shuffle(group).map(([w]) => `<button class="choice" data-h="${esc(w)}">${esc(w)}</button>`).join("")}</div>
    <div id="h-fb"></div>`;
  el.querySelectorAll("[data-h]").forEach((b) => (b.onclick = () => {
    const ok = b.dataset.h === word;
    b.classList.add(ok ? "right" : "wrong");
    document.getElementById("h-fb").innerHTML = `<p>${ok ? "✅ Yes!" : `❌ It’s “${esc(word)}”.`}</p><button class="btn primary" id="h-next">Next →</button>`;
    document.getElementById("h-next").onclick = homophoneQuiz;
  }));
}

// ───────────────────────── spelling chart ─────────────────────────
function viewChart() {
  const row = (p) => `<tr>
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
      return `<tr><td><a href="#/c/${c.id}"><b>${esc(c.big)}</b> ${ipa(c.ipa)}</a></td><td>${stars(store.stars(c.id))}</td><td>${p.wins}/${p.tries}</td><td class="small">${words}</td></tr>`;
    }).join("");
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Progress</nav>
    <h1>⭐ ${esc(store.currentLearner())}’s progress</h1>
    <div class="stats">
      <div><b>${tried.length}</b><small>cards practiced</small></div>
      <div><b>${total ? Math.round((wins / total) * 100) : 0}%</b><small>tries matched</small></div>
      <div><b>${ALL_CARDS.filter((c) => store.stars(c.id) === 3).length}</b><small>3-star cards</small></div>
      <div><b>${pairs.tries ? Math.round((pairs.wins / pairs.tries) * 100) : 0}%</b><small>minimal pairs (${pairs.tries})</small></div>
    </div>
    ${rows ? `<div class="table-wrap"><table class="chart"><thead><tr><th>Card</th><th>Stars</th><th>Matched</th><th>Words</th></tr></thead><tbody>${rows}</tbody></table></div>`
      : `<p class="muted">No practice yet. <a href="#/deck/consonants">Start with the consonants!</a></p>`}
    <p class="muted small">Stars: ★ = 1 word said right, ★★ = 3 words, ★★★ = 5 words. Progress is saved in this browser only.</p>`);
}

// ───────────────────────── settings ─────────────────────────
async function viewSettings() {
  const s = store.settings();
  const voices = browserVoices();
  render(`
    <nav class="crumbs"><a href="#/">Home</a> › Settings</nav>
    <h1>⚙️ Settings</h1>
    <form class="settings" onsubmit="return false">
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
        <label class="check"><input type="checkbox" id="kidMode" ${s.kidMode ? "checked" : ""}> Kid mode (bigger buttons, simpler screens)</label>
      </fieldset>
      <fieldset><legend>Voice</legend>
        <label>Voice source
          <select id="ttsSource">
            <option value="auto" ${s.ttsSource === "auto" ? "selected" : ""}>Automatic (server voice if available)</option>
            <option value="server" ${s.ttsSource === "server" ? "selected" : ""}>Server voice (Deepgram Aura)</option>
            <option value="browser" ${s.ttsSource === "browser" ? "selected" : ""}>This device’s built-in voice</option>
          </select></label>
        <label>Server voice
          <select id="serverVoice">${["asteria", "luna", "stella", "athena", "hera", "orion", "arcas", "perseus", "angus", "orpheus", "helios", "zeus"]
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
  on("learner", "change", (e) => { store.setLearner(e.target.value); viewSettings(); });
  on("add-learner", "click", () => { store.setLearner(document.getElementById("new-learner").value); viewSettings(); });
  on("del-learner", "click", () => {
    if (confirm(`Remove ${store.currentLearner()} and their progress?`)) { store.removeLearner(store.currentLearner()); viewSettings(); }
  });
  for (const id of ["language", "ttsSource", "serverVoice", "voice"]) on(id, "change", (e) => store.setSetting(id, e.target.value));
  for (const id of ["showIpa", "kidMode"]) on(id, "change", (e) => { store.setSetting(id, e.target.checked); applyMode(); });
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

function applyMode() {
  document.body.classList.toggle("kid", !!store.settings().kidMode);
}

applyMode();
window.addEventListener("hashchange", route);
route();
