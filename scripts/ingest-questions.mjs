// Aspirant — external question ingestion.
//
// Pulls extra MCQs from FREE, openly-licensed question APIs and feeds them into
// the General Awareness / General Knowledge sections of each exam.
//
// Source: Open Trivia DB (https://opentdb.com) — content licensed CC BY-SA 4.0.
// We DELIBERATELY do not scrape copyrighted exam-prep sites (legal/ToS risk for a
// public app). To add another open source, write a fetcher that returns the same
// normalized shape and push into `incoming`.
//
// Run:  node scripts/ingest-questions.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, '..', 'public', 'data')

const PER_EXAM = Number(process.env.INGEST_PER_EXAM || 10)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Minimal HTML-entity decoder (Open Trivia DB returns entity-encoded text).
const ENTITIES = {
  '&quot;': '"', '&#039;': "'", '&amp;': '&', '&lt;': '<', '&gt;': '>',
  '&eacute;': 'é', '&aacute;': 'á', '&uuml;': 'ü', '&rsquo;': '’', '&ldquo;': '“', '&rdquo;': '”',
  '&hellip;': '…', '&shy;': '', '&ntilde;': 'ñ', '&deg;': '°', '&pi;': 'π',
}
const decode = (s) =>
  String(s).replace(/&#?\w+;/g, (m) => (m in ENTITIES ? ENTITIES[m] : m))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w ]/g, '').trim()

// Exam-relevant academic categories on Open Trivia DB (avoid pop-culture, which
// is irrelevant to Indian competitive-exam GA). Rotated per exam for variety.
const CATEGORIES = [
  { id: 22, topic: 'Geography' },
  { id: 23, topic: 'History' },
  { id: 24, topic: 'Politics' },
  { id: 17, topic: 'Science & Nature' },
  { id: 18, topic: 'Computers' },
  { id: 19, topic: 'Mathematics' },
]

// Fetch academic MCQs from Open Trivia DB and normalize to our schema.
async function fetchOpenTriviaDB(examId, section, amount, catIndex) {
  const cat = CATEGORIES[catIndex % CATEGORIES.length]
  const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple&category=${cat.id}`
  const res = await fetch(url, { headers: { 'User-Agent': 'AspirantBot' } })
  if (!res.ok) throw new Error(`OpenTDB ${res.status}`)
  const data = await res.json()
  if (data.response_code !== 0 || !Array.isArray(data.results)) return []
  const stamp = Date.now()
  return data.results.map((r, i) => {
    const correct = decode(r.correct_answer)
    const options = shuffle([correct, ...r.incorrect_answers.map(decode)])
    return {
      id: `${examId}-web-${stamp}-${i}`,
      section,
      topic: cat.topic,
      difficulty: ['easy', 'medium', 'hard', 'expert'].includes(r.difficulty) ? r.difficulty : 'medium',
      source: 'web',
      status: 'pending', // external factual content — review before it goes live
      attribution: 'Open Trivia DB (CC BY-SA 4.0)',
      question: decode(r.question),
      options,
      answer: options.indexOf(correct),
      explanation: `Correct answer: ${correct}.`,
    }
  })
}

// Pick the section that best represents general awareness/knowledge for an exam.
function gkSection(exam) {
  return exam.sections.find((s) => /awareness|knowledge|\bgk\b|current/i.test(s)) || null
}

async function main() {
  const config = JSON.parse(await readFile(join(DATA, 'config.json'), 'utf8'))
  const enabled = config.exams.filter((e) => e.enabled)
  const today = new Date().toISOString().slice(0, 10)
  // Day-of-year offsets the category so each exam rotates through topics over time.
  const dayOffset = Math.floor(Date.now() / 86400000)

  let examIndex = 0
  for (const exam of enabled) {
    // Open Trivia DB is English-only; never add it to exams conducted in other
    // languages (e.g. Odia state exams) — it would leave untranslated questions.
    if ((exam.languages || ['en']).some((l) => l !== 'en')) {
      console.log(`  ${exam.id}: multi-language exam, skipping English-only ingest`)
      continue
    }
    const section = gkSection(exam)
    if (!section) {
      console.log(`  ${exam.id}: no GA/GK section, skipping`)
      continue
    }
    const bankPath = join(DATA, 'questions', `${exam.id}.json`)
    let bank
    try {
      bank = JSON.parse(await readFile(bankPath, 'utf8'))
    } catch {
      bank = { exam: exam.id, updated: today, questions: [] }
    }

    const existing = new Set(bank.questions.map((q) => norm(q.question)))
    let added = 0
    try {
      const incoming = await fetchOpenTriviaDB(exam.id, section, PER_EXAM, dayOffset + examIndex)
      for (const q of incoming) {
        if (q.answer < 0 || existing.has(norm(q.question))) continue
        bank.questions.push(q)
        existing.add(norm(q.question))
        added++
      }
    } catch (err) {
      console.error(`  ${exam.id}: ${err.message}`)
    }

    bank.updated = today
    await writeFile(bankPath, JSON.stringify(bank, null, 2) + '\n')
    console.log(`✅ ${exam.id}: +${added} from Open Trivia DB (total ${bank.questions.length})`)

    examIndex++
    // Open Trivia DB asks for ~5s between requests.
    await sleep(5500)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
