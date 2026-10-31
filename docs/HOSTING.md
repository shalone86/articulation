# Hosting without your own server

Goal: the app keeps working when the home internet (or the home server) is down, for $0.

## Live setup (October 2026)

**Cloudflare Worker only:** https://articulation.ariyandhamma.workers.dev — the site, the server voice (Workers AI Aura) and the speech check (Workers AI Whisper). No `STT_ORIGIN` is set.

The Hugging Face Space below is **no longer free**: since 2026, Hugging Face requires a PRO subscription (~$9/month) to host Docker or Gradio Spaces on the free CPU (`deploy.sh` stops with HTTP 402). Only static Spaces stay free, and those can't run `server/`. If you subscribe later, follow step 1 below and add `STT_ORIGIN` to `wrangler.jsonc` — the Worker then uses the Space and falls back to Workers AI by itself.

To update: `git pull`, then `npx wrangler deploy`.

## Original plan: Cloudflare Workers + a Hugging Face Space

```
 phone / browser ──► Cloudflare Worker (free)  ── site, voice (Aura), Android verification
                          │
                          ├─► Hugging Face Space (free) ── speech check with forced-choice scoring
                          │        (asleep after 48 h unused → Worker falls back automatically)
                          └─► Workers AI Whisper ── fallback speech check
```

| Piece | Free? | What it does |
|---|---|---|
| **Cloudflare Workers** | Free plan; Workers AI has a free daily allowance that 1–2 learners won't come near | Serves the app worldwide over HTTPS, the server voice (cached), and a speech check that always answers |
| **Hugging Face Space** (CPU basic: 2 vCPU, 16 GB RAM) | Needs HF PRO for Docker Spaces | Runs `server/` — faster-whisper `small.en` + the Kokoro voice — for the better forced-choice scoring. It's also a full working copy of the app on its own URL. |

Nothing runs at your house. If the Space is asleep or broken, checks quietly fall back to Workers AI (open transcription, ~90% vs ~95% on the benchmark in WORKSHOP.md); the next check after it wakes uses the Space again.

### 1. Hugging Face Space (≈10 minutes)

1. Make an account at huggingface.co and a **write** token: Settings → Access Tokens.
2. From the repository:
   ```bash
   HF_TOKEN=hf_xxx ./deploy/huggingface/deploy.sh <your-hf-username>
   ```
   That creates the Space `articulation` and pushes the app. The first build takes ~10 minutes (it bakes the Whisper model and voice into the image so waking up is quick).
3. Open `https://<your-hf-username>-articulation.hf.space` — the full app should load and the home screen should say "Speech checker ready".

Optional: make it private with `HF_PRIVATE=true` on the first deploy, then give the Worker a **read** token (step 2 below, `STT_TOKEN`). Free Spaces sleep after 48 hours without visits; the first visit afterwards wakes it (about a minute).

### 2. Cloudflare Worker (≈5 minutes)

```bash
npm install
npx wrangler login
```

In `wrangler.jsonc` add:

```jsonc
"vars": { "STT_ORIGIN": "https://<your-hf-username>-articulation.hf.space" }
```

then

```bash
npx wrangler deploy                       # → https://articulation.<you>.workers.dev
npx wrangler secret put STT_TOKEN         # only if the Space is private
npx wrangler secret put APP_PASSCODE      # optional: keep strangers off your quota
```

Custom domain: Cloudflare dashboard → Workers → articulation → Settings → Domains & Routes → add e.g. `articulation.shalonely.com`. (Your existing serve.shalonely.com can keep pointing at the home server.)

### Updating

`git pull`, then `npx wrangler deploy` and `./deploy/huggingface/deploy.sh <user>` again.

## Other options considered

| Option | Cost | Why not the default |
|---|---|---|
| Only Cloudflare Workers | Free | Works fine alone (that's the fallback); just without forced-choice scoring. Perfectly good if you want one thing to manage. |
| Only the Hugging Face Space | HF PRO | Simplest of all, but sleeps after 48 h idle and there's no edge cache or fallback. |
| Oracle Cloud "Always Free" ARM VM (4 cores, 24 GB) | Free | Always-on and powerful, but signup needs a card, idle VMs can be reclaimed, and you're back to running a server. |
| Google Cloud Run / Fly.io | Low, not zero | Cold starts load the Whisper model each time; billing to watch. |
| Vercel / Netlify | Free for the site | Can't run Whisper; you'd pay a transcription API. |

## Offline

The app now installs as a PWA and works offline: all cards, lessons, games and the device voice. Recording and playback work too; only the speech check and new server-voice words need a connection.
