// Aspirant — official-source adapter TEMPLATE.
//
// Use this to add a LEGAL source that publishes past papers / answer keys openly
// (e.g. SSC, some State PSCs, Coal India and other PSUs that post official PDFs).
// Copy this file to scripts/sources/<source>.mjs and fill in fetch + parse.
//
// ⚖️  Legal note: only ingest content the source publishes openly for reuse.
//    Do NOT scrape "memory-based" PYQs from coaching sites (IBPS/SBI/etc.) — that
//    content is copyrighted. For those exams, use the community importer instead
//    (scripts/import-contributions.mjs).
//
// Each adapter returns questions in the normalized shape below; a parent script
// can then dedupe + append + mark status:"pending" for approval.

// Best-effort parser for the very common official answer-key text format:
//   1. What is ...?  (a) X  (b) Y  (c) Z  (d) W   Ans: (b)
// Real papers vary — tune the regexes per source, or use `pdf-parse` for PDFs.
export function parseAnswerKeyText(text, { examId, section = 'General', topic = 'General' }) {
  const out = []
  // Split into per-question blocks starting with "<n>." or "Q<n>".
  const blocks = text.split(/\n(?=\s*(?:Q\.?\s*)?\d{1,3}[.)]\s)/i)
  let idx = 0
  for (const block of blocks) {
    const qm = /^\s*(?:Q\.?\s*)?\d{1,3}[.)]\s*([\s\S]*?)\s*\(a\)/i.exec(block)
    const opts = [...block.matchAll(/\(([a-d])\)\s*([^\n(]+?)(?=\s*\([a-d]\)|\s*Ans|\n|$)/gi)]
    const ans = /Ans(?:wer)?\s*[:.\-]?\s*\(?([a-d])\)?/i.exec(block)
    if (!qm || opts.length < 4 || !ans) continue
    const options = opts.slice(0, 4).map((m) => m[2].trim())
    const answer = ans[1].toLowerCase().charCodeAt(0) - 97
    if (answer < 0 || answer > 3 || options.some((o) => !o)) continue
    out.push({
      id: `${examId}-pyq-${idx++}`,
      section,
      topic,
      difficulty: 'medium',
      source: 'pyq',
      status: 'pending',
      question: qm[1].replace(/\s+/g, ' ').trim(),
      options,
      answer,
      explanation: '',
    })
  }
  return out
}

// Example adapter shape. Replace URL + metadata for your real source.
export async function fetchQuestions({ examId, section, topic, url }) {
  const res = await fetch(url, { headers: { 'User-Agent': 'AspirantBot' } })
  if (!res.ok) throw new Error(`Fetch ${res.status}`)
  const text = await res.text() // for PDFs: extract text first (see README)
  const questions = parseAnswerKeyText(text, { examId, section, topic })
  return questions.map((q) => ({ ...q, attribution: `Official source: ${new URL(url).hostname}` }))
}
