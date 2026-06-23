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

// Large topic pools — we rotate through a fresh slice each day (see rotate())
// so the model keeps exploring new ground instead of repeating "top" topics.
const EDU_TOPICS = [
  'Educational Psychology', 'Child Development & Pedagogy', "Piaget's Cognitive Development",
  "Vygotsky's Sociocultural Theory", "Kohlberg's Moral Development", 'Behaviourism (Pavlov, Skinner)',
  'Cognitivism & Information Processing', 'Constructivism', 'Theories of Motivation',
  'Theories of Intelligence (Gardner, Spearman)', 'Personality & its Assessment',
  'Teaching Methods & Strategies', 'Lesson Planning & Microteaching', 'Assessment & Evaluation',
  "Bloom's Taxonomy", 'Formative vs Summative Assessment', 'Educational Philosophers (Tagore, Gandhi)',
  'Western Educators (Dewey, Froebel, Montessori)', 'Inclusive & Special Education',
  'Learning Disabilities', 'ICT in Education', 'Educational Technology', 'Curriculum Development',
  'Guidance & Counselling', 'Classroom Management', 'Action Research', 'NEP 2020',
  'Right to Education (RTE) Act', 'National Curriculum Framework (NCF)',
  'Educational Measurement & Statistics', 'Language Acquisition', 'Memory & Forgetting',
]
const GK_TOPICS = [
  'Banking Awareness', 'RBI & Monetary Policy', 'Types of Bank Accounts', 'Negotiable Instruments',
  'Banking History', 'Financial Institutions (NABARD, SIDBI, EXIM)', 'Money Market & Capital Market',
  'Insurance & Pension Schemes', 'Government Welfare Schemes', 'Indian Economy & Planning',
  'Union Budget & Taxation (GST)', 'Indian Constitution & Articles', 'Fundamental Rights & Duties',
  'Parliament & Judiciary', 'Constitutional Amendments', 'Ancient Indian History',
  'Medieval Indian History', 'Modern India & Freedom Struggle', 'Indian Geography',
  'World Geography', 'Physical Geography', 'Physics (basics)', 'Chemistry (basics)',
  'Biology & Human Body', 'Environment & Ecology', 'Space & Defence (ISRO, DRDO)',
  'Sports & Tournaments', 'Awards & Honours', 'Books & Authors', 'Important Days & Themes',
  'National & International Organizations', 'Capitals & Currencies', 'Census 2011',
  'Indian Art & Culture', 'Committees & Reports', 'Static GK (Dams, Parks, Stadiums)',
]

// Pick a rotating slice of `n` topics for the given day so coverage cycles over time.
function rotate(pool, n, dayIdx) {
  const start = (dayIdx * n) % pool.length
  const out = []
  for (let i = 0; i < n; i++) out.push(pool[(start + i) % pool.length])
  return out
}

const EDU_EXAMS = (process.env.EDU_EXAMS || 'odisha-ssb,pgt,tgt').split(',')
const GK_EXAMS = (process.env.GK_EXAMS || 'ibps-clerk,sbi-clerk,ibps-po').split(',')

let lastRequest = 0
async function throttle() {
  const since = Date.now() - lastRequest
  if (lastRequest && since < THROTTLE_MS) await sleep(THROTTLE_MS - since)
  lastRequest = Date.now()
}

function buildPrompt(examName, count, topics, kind, avoid) {
  const avoidBlock =
    avoid && avoid.length
      ? `\n\nDo NOT repeat or merely rephrase any of these already-asked questions:\n${avoid
          .map((q) => `- ${q}`)
          .join('\n')}`
      : ''
  return `You are a senior question setter for the Indian exam "${examName}".
Generate ${count} FRESH and DISTINCT multiple-choice ${kind} questions that are LIKELY to appear, spread across these topics:
${topics.map((t) => `- ${t}`).join('\n')}

Rules: every question must be NEW and clearly different from the others; spread difficulty roughly evenly across all four levels — easy, medium, hard, and expert (very difficult); exactly 4 options; only well-established, verifiable facts; RE-SOLVE each and set "verified" true only if fully confident.${avoidBlock}

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
          generationConfig: { temperature: 0.95, responseMimeType: 'application/json' },
        }),
      },
    )
    if (res.ok) {
      const data = await res.json()
      return JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]')
    }
    const body = await res.text()
    // Retry transient errors: 429 (rate limit), 500/503 (model overloaded).
    if ([429, 500, 503].includes(res.status) && attempt < 4) {
      const m = /"retryDelay":\s*"(\d+)/.exec(body)
      const wait = res.status === 429 ? (m ? Number(m[1]) : 60) + 1 : 15
      console.log(`    transient ${res.status}, retrying in ${wait}s…`)
      await sleep(wait * 1000)
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

// Recent question stems from a bank, to tell the model what to avoid repeating.
async function recentStems(examId, limit = 30) {
  try {
    const bank = JSON.parse(await readFile(join(DATA, 'questions', `${examId}.json`), 'utf8'))
    return bank.questions.slice(-limit).map((q) => q.question.slice(0, 90))
  } catch {
    return []
  }
}

async function main() {
  const dayIdx = Math.floor(Date.now() / 86400000)
  // Rotate a fresh slice of topics each day so coverage keeps moving.
  const eduTopics = rotate(EDU_TOPICS, 8, dayIdx)
  const gkTopics = rotate(GK_TOPICS, 8, dayIdx + 3)
  console.log('Today edu topics:', eduTopics.join(', '))
  console.log('Today GK topics:', gkTopics.join(', '))

  // 1) Education questions → all teaching banks (shared syllabus).
  try {
    const avoid = await recentStems(EDU_EXAMS[0])
    const eduRaw = await callGemini(
      buildPrompt('Odisha SSB / PGT / TGT (teaching)', EDU_COUNT, eduTopics, 'education', avoid),
    )
    for (const exam of EDU_EXAMS) {
      await appendTo(exam, (id) => sanitize(eduRaw, id, 'Teaching Aptitude', 'edu'))
    }
  } catch (err) {
    console.error(`education: ${err.message}`)
  }

  // 2) IBPS-style GK → banking banks.
  try {
    const avoid = await recentStems(GK_EXAMS[0])
    const gkRaw = await callGemini(
      buildPrompt('IBPS (banking)', GK_COUNT, gkTopics, 'general awareness', avoid),
    )
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
