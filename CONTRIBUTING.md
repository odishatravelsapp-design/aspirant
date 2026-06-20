# Contributing to Aspirant

Aspirant is a free, student-first exam-prep app. The best way to help is to
**contribute real questions** — especially past-year questions (PYQs) you
remember from actual exams. This is how the bank grows for everyone, at zero cost.

There are two ways to contribute: **submit questions** (no coding) or **improve the code**.

---

## 1. Submit questions (no coding needed)

👉 **Fill the contribution form:** _<add your Google Form link here>_

Please follow these guidelines so your question can go live:

- ✅ **Real exam-style questions** — PYQs you remember, or good practice questions.
- ✅ **One correct answer** out of four options, and ideally a short explanation.
- ✅ **Accurate facts.** If unsure, leave the explanation blank — a reviewer will check.
- ❌ **Do not paste bulk content copied from coaching apps/books** — that's copyrighted. Submit questions in your own words / from memory.
- 🌐 You may submit in **English or Odia**.

Every submission is reviewed (or auto-published, depending on settings) and credited if you add your name.

---

## 2. Set up the contribution pipeline (maintainer, one-time)

The form feeds a Google Sheet, which is published as CSV and imported daily by
[`scripts/import-contributions.mjs`](scripts/import-contributions.mjs).

### Step A — Create the Google Form
Create a form with these questions. **The titles in the left column become the
spreadsheet headers** the importer reads (friendly variants like "Correct answer"
or "Your name" are auto-mapped, so you can keep them human-friendly).

| Form question (title) | Type | Required | Notes / help text |
|---|---|---|---|
| **Exam** | Dropdown | ✅ | Options (the exam IDs): `ibps-clerk`, `sbi-clerk`, `ibps-po`, `osssc`, `ossc`, `odisha-ssb`, `pgt`, `odisha-police`, `opsc-oas`, `chse` |
| **Section** | Short answer | ✅ | e.g. `Quant`, `Reasoning`, `General Awareness`, `Teaching Aptitude`, `Odisha GK` |
| **Topic** | Short answer | — | e.g. `Percentage`, `Banking`, `Educational Psychology` |
| **Difficulty** | Multiple choice | — | `easy` · `medium` · `hard` |
| **Year** | Short answer | — | e.g. `2024` (4 digits) |
| **Question** | Paragraph | ✅ | The full question text |
| **Option A** | Short answer | ✅ | |
| **Option B** | Short answer | ✅ | |
| **Option C** | Short answer | ✅ | |
| **Option D** | Short answer | ✅ | |
| **Correct answer** | Multiple choice | ✅ | `A` · `B` · `C` · `D` |
| **Explanation** | Paragraph | — | Why the answer is correct |
| **Language** | Multiple choice | — | `en` · `or` (default `en`) |
| **Your name** | Short answer | — | For credit (stored as attribution) |

> Tip: in each question's **Description**, add the example/help from the Notes column so contributors get it right.

### Step B — Publish the responses Sheet as CSV
1. In the Form, open the **Responses** tab → the green Sheets icon → create the linked Sheet.
2. In that Sheet: **File → Share → Publish to web** → select the responses sheet → format **CSV** → **Publish** → copy the URL (looks like `https://docs.google.com/.../pub?output=csv`).

### Step C — Wire it into the repo
GitHub → repo **Settings → Secrets and variables → Actions → Variables tab → New repository variable**:
- Name: `CONTRIB_CSV_URL` · Value: the published CSV URL.

That's it. The [`import-contributions.yml`](.github/workflows/import-contributions.yml) job runs daily (09:30 IST), pulls new rows, de-duplicates, and adds them as `pending`.

### Step D — Moderation
- With `config.autoApprove: true` (default), contributions go live immediately — fast, but spam/errors can appear. Keep an eye on the form responses.
- For tighter control, set `config.autoApprove: false`; then review and publish with:
  ```bash
  node scripts/approve-questions.mjs        # publish all pending
  ```
  Delete a row's question before approving to reject it.

### Test the importer locally
```bash
node scripts/import-contributions.mjs ./data/contributions.example.csv
# or against the live sheet:
CONTRIB_CSV_URL="https://docs.google.com/.../pub?output=csv" node scripts/import-contributions.mjs
```

---

## 3. Contribute code

```bash
npm install
npm run dev          # local dev server
npm run build        # production build (tsc + vite)
npm run test:e2e     # Playwright tests (desktop + mobile)
```

- Keep the app **offline-first and dependency-light** (it must run on low-end phones).
- Add UI strings to [`src/i18n/translations.ts`](src/i18n/translations.ts) in **both** `en` and `or`.
- Run `npm run test:e2e` before opening a PR — the deploy is gated on it.

Thank you for helping students learn for free. ❤️
