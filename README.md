# 🎯 Aspirant — Free, Offline Exam Prep

A zero-cost, offline-first PWA giving students **past-year questions, mock tests, and instant analysis** for banking (IBPS/SBI) and Odisha state exams. Built to run on low-end phones with poor connectivity.

- ✅ **100% free** — static hosting on GitHub Pages, AI on Gemini's free tier
- 📴 **Works offline** — questions cached on-device, results saved locally
- 🚩 **Feature-flagged exams** — toggle any exam on/off in one config file
- 🤖 **Automated** — daily GitHub Actions generate & self-verify questions and current affairs
- 📊 **Instant analysis** — score, topic-wise accuracy, weak-area detection
- 📰 **Daily current affairs** — real headlines summarised + auto-quiz, every day
- 🌐 **Multi-language** — English + Odia now; structured for all Indian languages
- 📒 **Mistakes notebook** — wrong answers auto-resurface on a spaced-repetition schedule
- ⏱️ **Realistic mocks** — sectional timer + negative marking (banking-style)
- 🔥 **Daily streak + weak-topic drills** — retention and targeted practice
- ☁️ **Optional Google login + cloud sync** — off by default, app stays fully offline
- 📲 **Install prompt** — add-to-home-screen onboarding for true offline use
- 🚩 **Report a question** — students flag bad questions (quality guard for AI content)
- 📈 **PYQ pattern analysis** — most-repeated/high-weightage topics + AI-predicted likely questions
- 📝 **Full exam-pattern mock** — question palette, mark-for-review, jump, whole-test timer
- 💡 **Question of the Day** — one shared daily question to build a habit
- 🌙 **Dark mode + text size** — sunlight readability and accessibility
- ✅ **Human-approval gate** — AI/web factual questions stay hidden until reviewed
- 📲 **Share score** — native share / WhatsApp for free word-of-mouth
- 🧪 **Tested** — Playwright e2e suite (desktop + mobile) runs in CI on every push

## Tech stack (all $0)

| Layer | Choice |
|---|---|
| App | Vite + React + TypeScript (~64 KB gzip) |
| Offline | `vite-plugin-pwa` (service worker + precache) |
| Storage | `localStorage` (test history & analysis) |
| Hosting | GitHub Pages |
| Automation | GitHub Actions (cron) |
| AI questions | Google Gemini free tier |

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # preview the production build
```

## How content works

Questions live in `public/data/`:

```
public/data/
  config.json                # exam registry + feature flags
  questions/
    ibps-clerk.json          # one bank per exam
    osssc.json
```

### Add or toggle an exam
Edit `public/data/config.json`. Set `"enabled": true` to show an exam, `false` to hide it. Add a matching `questions/<id>.json` file. **No code changes needed.**

### Question schema
```json
{
  "id": "ibpsc-q-0001",
  "section": "Quant",
  "topic": "Simplification",
  "difficulty": "easy",
  "year": 2023,
  "source": "pyq",        // "pyq" (curated) or "ai" (generated)
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "answer": 1,            // index of the correct option
  "explanation": "..."
}
```

> **Quality note:** Curated **past-year questions** (`source: "pyq"`) are the gold standard — collect these by hand. AI questions (`source: "ai"`) are a daily top-up and are self-verified, but should be spot-checked. Lead with PYQs.

## Automated AI generation

`scripts/generate-questions.mjs` calls Gemini (`gemini-flash-latest`), asks it to **re-solve and verify** each question, and keeps only verified ones.

```bash
# Get a free key: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_key node scripts/generate-questions.mjs
```

**Free-tier limits (handled automatically):** the free tier allows ~5 requests/minute. The script **throttles** to one call every ~13s and **auto-retries** on a `429` using the server's suggested delay, so it never crashes. Tunable via `THROTTLE_MS` and `QUESTIONS_PER_TOPIC` env vars. With 2 exams × 4 sections that's 8 calls/day — comfortably within free limits.

The daily GitHub Action (`.github/workflows/generate-questions.yml`) runs this at 06:00 IST, commits new questions, which auto-triggers a redeploy.

## Daily current affairs

`scripts/generate-current-affairs.mjs` pulls **real headlines** from free public RSS feeds (Google News India, banking, Odisha), then asks Gemini to summarise the most exam-relevant ones into points **and** build a short quiz. Grounding on real headlines keeps facts accurate — the model summarises, it doesn't invent the news.

```bash
GEMINI_API_KEY=your_key node scripts/generate-current-affairs.mjs
```

Output goes to `public/data/current-affairs.json`. The daily Action (`.github/workflows/current-affairs.yml`) runs at 06:30 IST. Edit the `FEEDS` array in the script to change sources.

## Languages (i18n)

UI strings live in `src/i18n/translations.ts` with one block per language (`en`, `or`). **To add any Indian language later:** add its code to `LANGUAGES` and a matching translation block — no other code changes. The chosen language is saved on-device. Odia strings should be reviewed by a native speaker before launch.

### Per-exam content languages (important)
The **UI** is always multilingual, but **question content** is only shown/translated in the languages an exam is actually conducted in. Each exam in `config.json` declares `"languages"`:

- Banking (IBPS/SBI) → `["en"]` — questions stay English even when the UI is Odia (these exams are not held in Odia).
- Odisha state (OSSSC etc.) → `["en", "or"]` — questions are bilingual.

A question carries optional `translations: { or: { question, options, explanation } }`; the app falls back to English when a translation is absent. The AI generators only translate into an exam's declared non-English languages.

## Where questions come from (and the IBPS/SBI reality)

Aspirant grows its bank from **four legal, $0 streams** — see [`scripts/sources/README.md`](scripts/sources/README.md). The most important for *real* past-year questions is **community contribution**, because IBPS/SBI don't publish PYQs and the "memory-based" versions on coaching sites are copyrighted (we don't scrape them).

### Community PYQ import (the moat)
Students/volunteers submit remembered questions via a **Google Form**; its responses Sheet is **Published to web → CSV** (a free, stable URL). A daily job imports them as `pending` for approval.

```bash
# Local test:
node scripts/import-contributions.mjs ./data/contributions.example.csv
# Production (set repo Variable CONTRIB_CSV_URL to the published-CSV link):
CONTRIB_CSV_URL="https://docs.google.com/.../pub?output=csv" node scripts/import-contributions.mjs
```
CSV columns: `exam, section, topic, difficulty, year, question, optionA-D, answer (A-D or 0-3), explanation, language, contributor`. Runs via [`import-contributions.yml`](.github/workflows/import-contributions.yml). This works for **any exam** — PGT, Odisha SSB, Odisha Police, OSSC, IBPS, SBI — because the content is contributor-supplied, not scraped.

### Official sources (SSC / PSCs / PSUs / Coal India)
Bodies that publish papers openly can be ingested with an **adapter** — copy [`scripts/sources/template.mjs`](scripts/sources/template.mjs), point it at the official URL, tune the parser. Output is `pending` until approved.

## Ingesting questions from external sources

`scripts/ingest-questions.mjs` pulls extra MCQs from **Open Trivia DB** (free, CC-BY-SA, no key) into each exam's General Awareness section, from **academic categories** (Geography, History, Politics, Science, Computers, Maths) — rotated daily, de-duplicated, with attribution stored on each question. Runs via [`ingest-questions.yml`](.github/workflows/ingest-questions.yml).

> **Honest caveat:** open question APIs are global/Western-leaning and **not India-exam-specific**. They're a supplement, not a replacement. For exam-relevant GA, the **AI generator** (India-specific, self-verified) is the primary source. We deliberately do **not** scrape copyrighted exam-prep sites (legal/ToS risk). To add a better open source, write a fetcher returning the same normalized shape.

## Report a question

Each reviewed question has a **Report** button. It always logs locally; if you set `report.whatsapp` or `report.email` in `config.json`, it also opens that channel pre-filled with the question id — so you get quality feedback as AI/ingested content grows.

## Trends & predicted questions

The **Trends & Predicted** screen (per exam) analyses the question bank's `year` + `topic` fields to show:
- **Topic weightage** — which topics are asked most often (High/Medium/Low chance), with the years they appeared.
- **Frequently repeated** — topics that recurred across papers.
- **Practice predicted questions** — a session biased toward the highest-weightage topics (computed in [`src/lib/insights.ts`](src/lib/insights.ts), fully offline).

A weekly job, [`generate-predicted.yml`](.github/workflows/generate-predicted.yml), reads each exam's **real past-paper topic frequencies** and asks Gemini to write fresh *likely-to-appear* questions for the top topics — tagged `source: "predicted"`, `status: "pending"` (approval required). These are pattern-based guidance, clearly **not a guarantee**.

> This gets sharper as real PYQs accumulate — the more past papers in the bank, the more reliable the weightage and predictions.

## Human approval of AI/web questions

To protect credibility, **factual** AI/ingested questions (General Awareness, current affairs, etc.) are written with `"status": "pending"` and are **hidden from students** until approved. Rule-based content (Quant/Reasoning/English) auto-approves.

```bash
# After eyeballing newly generated content (e.g. via git diff):
node scripts/approve-questions.mjs            # approve all pending
node scripts/approve-questions.mjs ibps-clerk # approve one bank
```
To reject a question, delete it before approving.

## Testing (CI)

```bash
npm run test:e2e      # Playwright, desktop + mobile (Pixel 5)
```

[`ci.yml`](.github/workflows/ci.yml) runs the suite on every push/PR. Once hosting is set, add `needs: [e2e]` to the deploy job so a red test blocks deploy.

## Deploy to GitHub Pages (free)

1. Push this repo to GitHub.
2. **Settings → Pages → Source: GitHub Actions.**
3. (For AI) **Settings → Secrets and variables → Actions** → add secret `GEMINI_API_KEY`.
4. Push to `main` — `deploy.yml` builds and publishes automatically.

The app will be live at `https://<username>.github.io/<repo>/`.

## Optional cloud sync (Google login)

**Off by default — the app is fully usable offline and anonymously.** Cloud sync only backs up test attempts across devices for users who choose to sign in.

To enable it:
1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor** → run [`supabase/schema.sql`](supabase/schema.sql) (creates the `attempts` table + Row-Level-Security so each user sees only their own data).
3. **Authentication → Providers → Google** → enable, and add your site URL to the redirect allow-list. (Create a free Google OAuth client at [console.cloud.google.com](https://console.cloud.google.com).)
4. Copy `.env.example` → `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (Supabase → Settings → API).
5. Rebuild. A **Sign in** button appears; on login, local attempts upload and merge across devices.

The Supabase client is **lazy-loaded in a separate chunk** and **excluded from the offline precache**, so the default build stays ~69 KB and rural users never download it.

> **Why no FastAPI?** Supabase already provides Postgres, Google Auth, auto REST APIs, and RLS on a free tier, called directly from the browser — so no separate server is needed. Add FastAPI only later if you need heavy custom server logic.

## Project structure

```
src/
  types.ts                 # shared data shapes
  lib/data.ts              # config + question + current-affairs loading
  lib/storage.ts           # attempts, topic analysis, mistakes notebook, streak
  lib/localize.ts          # resolve question/CA text per language (English fallback)
  lib/supabase.ts          # lazy, env-gated Supabase client (optional)
  lib/sync.ts              # two-way attempt sync with Supabase
  hooks/useOnline.ts       # connectivity indicator
  hooks/useAuth.ts         # optional Google auth (no-op when cloud disabled)
  i18n/
    translations.ts        # en + or strings (add languages here)
    LanguageContext.tsx    # provider + useT() hook
  components/
    Home.tsx               # streak, revise-mistakes, current affairs, exam grid
    ExamDetail.tsx         # mode/section, weak-topic drill, revise, weak preview
    Quiz.tsx               # quiz engine: timer, negative marking, mock/practice
    Results.tsx            # score, net (negative) score, analysis, answer review
    History.tsx            # cross-test analysis dashboard
    CurrentAffairs.tsx     # daily digest + quiz launcher
    AccountButton.tsx      # sign-in / account chip (only when cloud enabled)
  App.tsx                  # screen router + language switcher + quiz orchestration
supabase/schema.sql        # DB table + Row-Level-Security for cloud sync
```

## Roadmap ideas
- Odia (ଓଡ଼ିଆ) language toggle (data structure is ready)
- Daily current-affairs feed (RSS → AI summary)
- More exams: SBI Clerk, IBPS PO, OPSC OAS (flip the flag + add data)
- Optional Supabase free tier for cross-device sync

---
Made with ❤️ for students. Free forever.
