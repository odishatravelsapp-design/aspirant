# Question sources

Aspirant grows its question bank from **four legal, $0 streams** — never by
scraping copyrighted coaching content.

| Stream | Script | What it's good for | Legal status |
|---|---|---|---|
| **Community PYQs** | [`import-contributions.mjs`](../import-contributions.mjs) | Real past-year questions from students/volunteers (any exam: PGT, SSB, Odisha, IBPS, SBI…) | ✅ Contributor-submitted |
| **AI generation** | [`generate-questions.mjs`](../generate-questions.mjs) | Practice volume for Quant/Reasoning/English | ✅ Generated |
| **Predicted** | [`generate-predicted.mjs`](../generate-predicted.mjs) | Likely questions from PYQ topic patterns | ✅ Generated |
| **Open APIs** | [`ingest-questions.mjs`](../ingest-questions.mjs) | General-knowledge top-up (Open Trivia DB, CC BY-SA) | ✅ Open license |
| **Official PDFs/sites** | adapters here (see `template.mjs`) | Real papers from bodies that publish openly (SSC, some PSCs, PSUs, Coal India) | ✅ Only openly-published content |

## ⚖️ The honest part about IBPS / SBI / "all PYQs"

There is **no legal, automated way to download every past paper** for these exams:

- **IBPS & SBI do not release PYQs.** What circulates is "memory-based" reconstructions on coaching sites — **copyrighted**. We do **not** scrape them. Get these via the **community importer** (students remember and submit them — fully legal).
- **SSC, some State PSCs, PSUs, Coal India** sometimes publish **official PDF papers/answer keys**. Those are legal to ingest — write an adapter (copy `template.mjs`).
- PDF formats differ per source, so each adapter needs a little tuning; for PDFs, add `pdf-parse` to extract text, then feed it to `parseAnswerKeyText`.

## Adding an official-source adapter

1. Copy `template.mjs` → `scripts/sources/<source>.mjs`.
2. Point `url` at the **officially published** paper/answer-key (HTML or text; for PDF, extract text first).
3. Tune the regexes in `parseAnswerKeyText` to the source's layout.
4. Output is `status: "pending"` → review with `approve-questions.mjs` before it goes live.

## Normalized question shape

```json
{
  "id": "exam-...","section": "...","topic": "...","difficulty": "easy|medium|hard",
  "source": "pyq|community|ai|web|predicted","status": "pending",
  "question": "...","options": ["A","B","C","D"],"answer": 0,"explanation": "...",
  "year": 2024,"attribution": "..."
}
```
