# Workshop: how to build and host the articulation app

This is the design workshop behind the app: the options I considered, what I measured, and the setup I picked.

## The requirements, restated

1. **Every sound and spelling as a flip card:** phonemes, graphemes, digraphs, trigraphs, and all the ways to spell each vowel.
2. **Front = record your try. Back = hear it said properly** (TTS is fine), plus a sentence for context.
3. **Explanations:** plosives, fricatives, voicing, homophones, and the specific ESL patterns (voicing final consonants, dropping /h/, …).
4. **Whisper checks whether the word was said right.**
5. **Hosting:** Cloudflare, Vercel, or your own server. 1–2 users.

## The hard part: can Whisper judge pronunciation?

Not out of the box. Whisper is built to be *robust to accents*. It's trained to figure out what you *meant*, which is the opposite of what a pronunciation checker needs. On a single short word with no context, it also guesses wildly. Two lessons came out of testing:

### Lesson 1: open transcription of one word is unreliable

I ran Whisper on **real human recordings** of single words (Google Speech Commands: many speakers, phone and laptop mics):

| Model | Method | Correct words accepted |
|---|---|---|
| base.en (CPU, ~1 s) | open transcription | 69/80 (86%) |
| large-v3-turbo (what Cloudflare runs) | open transcription | 72/80 (90%) |
| base.en | **forced choice** (target vs. look-alikes) | **79/80 (99%)** |

The open-transcription misses were things like "oh", "yeah", "I", "puff", or a long hallucinated sentence. If a kid says a word correctly and the app says "wrong" one time in ten, that's discouraging.

### Lesson 2: ask a narrower question

We always know the target word *and* its likely mistakes, because every card carries minimal pairs (think/sink, dog/dock, very/berry). So instead of asking Whisper "what was said?", the self-hosted backend asks "is this audio more likely *think* or *sink*?" It does this by scoring each candidate's log-probability against the audio with Whisper's decoder (`ctranslate2` `align`). It also scores whatever open transcription heard, so a completely different word can't sneak through.

The decision rule (in `public/js/score.js` → `refineWithScores`):

- Open transcription wrote the target or a homophone → ✅ (same as before).
- A known look-alike beats the target by more than 1.0 → "That sounded like *sink*", along with the tip for that sound.
- The target is within 1.5 of the best rival → ✅.
- Otherwise → report what was heard, with a diagnosis.

I tuned it on real recordings with base.en, testing correct words, wrong words, and a true minimal pair:

- Correct words: 37/40 accepted (open transcription alone: 36/40).
- Wrong words: **0/40** accepted.
- Real "no" recordings checked against target "go": **0/10** accepted.

On top of that, `score.js` recognizes common ESL patterns in what was heard and explains them in plain words:

| Pattern | Example | Typical first languages |
|---|---|---|
| final devoicing | dog → dock, leave → leaf | German, Russian, Polish, Turkish |
| dropped final consonant | cat → ca | Mandarin, Vietnamese, Thai, Spanish |
| added final vowel | big → bigu | Japanese, Korean, Italian, Portuguese |
| added initial vowel | school → eschool | Spanish, Portuguese, Arabic, Farsi |
| dropped or added /h/ | hat → at, eat → heat | French, Italian, Portuguese |
| -ng → -nk click | sing → sink | Polish, Russian, Spanish, Arabic |

### Lesson 3: turn off the browser's "voice call" audio processing

With the browser defaults (noise suppression and echo cancellation on), the recording of "thumb" came back from Whisper as "from". WebRTC noise suppression treats the hiss of /s/, /f/, and /θ/ as noise, and those are exactly the sounds we're checking. The recorder turns those features off, then trims silence, normalizes the volume, and sends a 16 kHz mono WAV.

### Honest limits

- Whisper still normalizes accents. A mild /θ/ → /s/ may come back as "think". Treat a ✅ as "a listener would understand you", not "native-like". That's why every card has **▶ My try** and **🔁 Mine vs. model**, so learners also train their own ear.
- Isolated sounds ("sss") can't be checked. Cards practice real words and sentences.
- TTS can't say a bare phoneme (it reads "t" as "tee"), so the back of each card plays words and sentences, with mouth instructions for the sound itself.

## Hosting options

| | **A. Cloudflare Workers + Workers AI** | **B. Self-hosted (Docker)** | **C. Hybrid** | Vercel / Netlify |
|---|---|---|---|---|
| Speech check | whisper-large-v3-turbo, open transcription | faster-whisper + **forced-choice scoring** | B's checker | needs an external API (OpenAI, Replicate…) |
| Voice | Deepgram Aura (edge-cached) | Piper (local) or browser | Aura | browser |
| Cost for 1–2 users | free tier | your electricity | free | free + API fees |
| Upkeep | none | a box, Docker, TLS | both | low |
| Privacy | audio goes to Cloudflare | **audio never leaves your server** | audio passes through Cloudflare to your server | audio goes to a third party |
| Works when the server is off | ✅ | ❌ | site yes, checker no | ✅ |

Vercel was ruled out because serverless functions can't run Whisper themselves (size and time limits), so you'd pay for a separate transcription API. Cloudflare is the only "serverless" option here that runs Whisper itself.

## My pick

**Self-hosted Docker (option B), reached over HTTPS through a free Cloudflare Tunnel.**

- **Best checking:** forced-choice scoring only works where we control the model.
- **Privacy:** these are recordings of children's and learners' voices, and they never leave your machine.
- **Cost:** for 1–2 users, a CPU-only box is enough (`small.en` takes a couple of seconds per check on a modest CPU; `base.en` about one).
- **HTTPS for the microphone, no open ports:** `cloudflared tunnel --url http://localhost:8000` gives you that.

**Option A is the zero-maintenance fallback.** The same code base deploys to Workers with `npx wrangler deploy`, so if the home server is a hassle you lose a little checking accuracy but no features. Option C combines them: Cloudflare hosts the site and voice, and your server does the checking.

### Recipe for my pick

```bash
git clone … && cd articulation
docker compose up -d                       # builds, downloads the Whisper model on first start
# optional consistent voice: set PIPER_VOICE in docker-compose.yml, then:
docker compose up -d --build

# HTTPS without opening ports (quick test URL):
cloudflared tunnel --url http://localhost:8000
# or a named tunnel on your own domain: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
```

Set `APP_PASSCODE` in `docker-compose.yml` if the URL will be public, and enter it in the app's Settings.

## Ideas for later

- Phoneme-level scoring (wav2vec2 phoneme recognizers, Goodness of Pronunciation) for "your /θ/ was 70% /s/" feedback.
- Recorded human audio for the model words (better than any TTS for kids).
- Syncing progress across devices (Cloudflare D1, or a JSON file on the server).
- A teacher/SLP view that assigns decks.
