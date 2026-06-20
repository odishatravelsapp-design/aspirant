// Aspirant — community PYQ importer (the $0 way to get REAL past-year questions).
//
// Students/volunteers submit remembered questions via a Google Form. The Form's
// responses Sheet is "Published to the web" as CSV (a stable, free URL). This job
// pulls that CSV, normalizes it, and appends as status:"pending" for approval.
//
// Run:
//   CONTRIB_CSV_URL="https://docs.google.com/.../pub?output=csv" node scripts/import-contributions.mjs
//   node scripts/import-contributions.mjs ./data/contributions.example.csv   # local file
//
// CSV columns (header row, case-insensitive):
//   exam, section, topic, difficulty, year, question,
//   optionA, optionB, optionC, optionD, answer, explanation, language, contributor
// `answer` may be A/B/C/D or 0-3.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, '..', 'public', 'data')
const SRC = process.argv[2] || process.env.CONTRIB_CSV_URL

if (!SRC) {
  console.error('Provide a CSV: set CONTRIB_CSV_URL or pass a local path.')
  process.exit(1)
}

// --- Minimal RFC-4180 CSV parser (handles quotes, commas and newlines in fields).
function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* ignore */ }
    else field += c
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

function toObjects(rows) {
  if (rows.length < 2) return []
  const headers = rows[0].map((h) => h.trim().toLowerCase())
  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim() !== ''))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])))
}

function answerIndex(raw) {
  const v = String(raw).trim().toUpperCase()
  if (['A', 'B', 'C', 'D'].includes(v)) return v.charCodeAt(0) - 65
  const n = Number(v)
  return Number.isInteger(n) && n >= 0 && n <= 3 ? n : -1
}

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w ]/g, '').trim()

function toQuestion(row, examId, i, stamp) {
  const options = [row.optiona, row.optionb, row.optionc, row.optiond].map((o) => (o ?? '').trim())
  const answer = answerIndex(row.answer)
  if (!row.question || options.some((o) => !o) || answer < 0) return null
  const q = {
    id: `${examId}-comm-${stamp}-${i}`,
    section: row.section || 'General',
    topic: row.topic || row.section || 'General',
    difficulty: ['easy', 'medium', 'hard'].includes(row.difficulty) ? row.difficulty : 'medium',
    source: 'community',
    status: 'pending', // community content always reviewed before going live
    question: row.question.trim(),
    options,
    answer,
    explanation: (row.explanation || '').trim(),
  }
  if (row.year && /^\d{4}$/.test(row.year)) q.year = Number(row.year)
  if (row.contributor) q.attribution = `Contributed by ${row.contributor}`
  return q
}

async function loadCsv(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src, { headers: { 'User-Agent': 'AspirantBot' } })
    if (!res.ok) throw new Error(`Fetch ${res.status}`)
    return res.text()
  }
  return readFile(src, 'utf8')
}

async function main() {
  const config = JSON.parse(await readFile(join(DATA, 'config.json'), 'utf8'))
  const knownExams = new Set(config.exams.map((e) => e.id))

  const rows = toObjects(parseCSV(await loadCsv(SRC)))
  console.log(`Parsed ${rows.length} contributed row(s).`)

  // Group rows by exam.
  const byExam = new Map()
  rows.forEach((r) => {
    const id = (r.exam || '').trim()
    if (!id) return
    if (!byExam.has(id)) byExam.set(id, [])
    byExam.get(id).push(r)
  })

  const stamp = Date.now()
  for (const [examId, examRows] of byExam) {
    if (!knownExams.has(examId)) {
      console.error(`  ⚠ unknown exam "${examId}" — add it to config.json first; skipping`)
      continue
    }
    const bankPath = join(DATA, 'questions', `${examId}.json`)
    let bank
    try {
      bank = JSON.parse(await readFile(bankPath, 'utf8'))
    } catch {
      bank = { exam: examId, updated: '', questions: [] }
    }
    const existing = new Set(bank.questions.map((q) => norm(q.question)))
    let added = 0
    examRows.forEach((r, i) => {
      const q = toQuestion(r, examId, `${stamp}-${i}`, stamp)
      if (!q) return
      if (existing.has(norm(q.question))) return
      bank.questions.push(q)
      existing.add(norm(q.question))
      added++
    })
    bank.updated = new Date().toISOString().slice(0, 10)
    await writeFile(bankPath, JSON.stringify(bank, null, 2) + '\n')
    console.log(`✅ ${examId}: +${added} community question(s) (pending approval)`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
