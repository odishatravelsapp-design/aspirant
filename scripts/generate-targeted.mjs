// Aspirant — targeted daily question sets.
//
// 1) ~15 EDUCATION questions/day (pedagogy, psychology, teaching) likely in the
//    Odisha SSB (Lecturer) and PGT exams — written to both teaching banks.
// 2) ~10 IBPS-style GENERAL-AWARENESS/GK questions/day for the banking banks.
//
// Each question is self-verified by the model. Run:
//   GEMINI_API_KEY=xxxx node scripts/generate-targeted.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, '..', 'public', 'data')

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const EDU_COUNT = Number(process.env.EDU_COUNT || 15)
const GK_COUNT = Number(process.env.GK_COUNT || 10)
const THROTTLE_MS = Number(process.env.THROTTLE_MS || 13000)

if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w ]/g, '').trim()

// Exam-relevant topic pools. The model spreads questions across these.
const EDU_TOPICS = [
  'Educational Psychology', 'Child Development & Pedagogy', 'Learning Theories',
  'Teaching Methods & Strategies', 'Assessment & Evaluation', 'Educational Philosophy & Thinkers',
  'Inclusive Education', 'ICT in Education', 'Curriculum & Instruction', 'Guidance & Counselling',
]
const GK_TOPICS = [
  'Banking Awareness', 'Indian Economy', 'Static GK', 'Indian Polity',
  'Indian History', 'Geography', 'General Science', 'Government Schemes',
]

const EDU_EXAMS = (process.env.EDU_EXAMS || 'odisha-ssb,pgt,tgt').split(',')
const GK_EXAMS = (process.env.GK_EXAMS || 'ibps-clerk,sbi-clerk,ibps-po').split(',')

let lastRequest = 0
async function throttle() {
  const since = Date.now() - lastRequest
  if (lastRequest && since < THROTTLE_MS) await sleep(THROTTLE_MS - since)
  lastRequest = Date.now()
}

function buildPrompt(examName, count, topics, kind) {
  return `You are a senior question setter for the Indian exam "${examName}".
Generate ${count} multiple-choice ${kind} questions that are LIKELY to appear, spread across these topics:
${topics.map((t) => `- ${t}`).join('\n')}

Rules: mix difficulties — include easy, medium, hard, and at least one "expert" (very difficult) question; exactly 4 options; only well-established, verifiable facts; RE-SOLVE each and set "verified" true only if fully confident.

Return ONLY valid JSON (no markdown): an array of
{ "topic": "one of the topics above", "difficulty": "easy|medium|hard|expert", "question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "...", "verified": true }`
}

async function callGemini(prompt) {
  for (let attempt = 0; attempt < 5; attempt++) {
    await throttle()
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, responseMimeType: 'application/json' },
        }),
      },
    )
    if (res.ok) {
      const data = await res.json()
      return JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]')
    }
    const body = await res.text()
    if (res.status === 429 && attempt < 4) {
      const m = /"retryDelay":\s*"(\d+)/.exec(body)
      console.log(`    rate-limited, waiting…`)
      await sleep(((m ? Number(m[1]) : 60) + 1) * 1000)
      continue
    }
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 160)}`)
  }
  throw new Error('exhausted retries')
}

function sanitize(raw, examId, section, tag) {
  if (!Array.isArray(raw)) return []
  const stamp = Date.now()
  return raw
    .filter(
      (q) =>
        q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4 &&
        Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3 && q.verified === true,
    )
    .map((q, i) => ({
      id: `${examId}-${tag}-${stamp}-${i}`,
      section,
      topic: String(q.topic || section),
      difficulty: ['easy', 'medium', 'hard', 'expert'].includes(q.difficulty) ? q.difficulty : 'medium',
      source: 'ai',
      status: 'pending', // factual — shown instantly only when config.autoApprove is true
      question: q.question.trim(),
      options: q.options.map((o) => String(o)),
      answer: q.answer,
      explanation: String(q.explanation || '').trim(),
    }))
}

async function appendTo(examId, makeQuestions) {
  const bankPath = join(DATA, 'questions', `${examId}.json`)
  let bank
  try {
    bank = JSON.parse(await readFile(bankPath, 'utf8'))
  } catch {
    bank = { exam: examId, updated: '', questions: [] }
  }
  const existing = new Set(bank.questions.map((q) => norm(q.question)))
  let added = 0
  for (const q of makeQuestions(examId)) {
    if (existing.has(norm(q.question))) continue
    bank.questions.push(q)
    existing.add(norm(q.question))
    added++
  }
  bank.updated = new Date().toISOString().slice(0, 10)
  await writeFile(bankPath, JSON.stringify(bank, null, 2) + '\n')
  console.log(`✅ ${examId}: +${added}`)
}

async function main() {
  // 1) Education questions → both teaching banks (shared syllabus).
  try {
    const eduRaw = await callGemini(buildPrompt('Odisha SSB / PGT (teaching)', EDU_COUNT, EDU_TOPICS, 'education'))
    for (const exam of EDU_EXAMS) {
      await appendTo(exam, (id) => sanitize(eduRaw, id, 'Teaching Aptitude', 'edu'))
    }
  } catch (err) {
    console.error(`education: ${err.message}`)
  }

  // 2) IBPS-style GK → banking banks.
  try {
    const gkRaw = await callGemini(buildPrompt('IBPS (banking)', GK_COUNT, GK_TOPICS, 'general awareness'))
    for (const exam of GK_EXAMS) {
      await appendTo(exam, (id) => sanitize(gkRaw, id, 'General Awareness', 'gk'))
    }
  } catch (err) {
    console.error(`gk: ${err.message}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
