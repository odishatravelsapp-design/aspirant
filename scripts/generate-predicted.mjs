// Aspirant — predicted ("most expected") question generator.
//
// Reads each exam's PAST-YEAR questions, computes which topics recur most, then
// asks Gemini to write fresh likely-to-appear questions for those high-weightage
// topics, in the style of the real papers. Output is tagged source:"predicted"
// and status:"pending" (human approval) — clearly NOT a guarantee.
//
// Run:  GEMINI_API_KEY=xxxx node scripts/generate-predicted.mjs

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, '..', 'public', 'data')

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const TOP_TOPICS = Number(process.env.PREDICT_TOP_TOPICS || 5)
const PER_TOPIC = Number(process.env.PREDICT_PER_TOPIC || 2)
const THROTTLE_MS = Number(process.env.THROTTLE_MS || 13000)

if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey')
  process.exit(1)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Rank topics by how often they appear in PAST-YEAR questions.
function topTopics(questions, n) {
  const counts = new Map()
  for (const q of questions) {
    if (q.source && q.source !== 'pyq') continue // base predictions on real papers
    counts.set(q.topic, (counts.get(q.topic) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([topic, count]) => ({ topic, count }))
}

function buildPrompt(examName, topics) {
  const list = topics.map((t) => `- ${t.topic} (appeared ${t.count}×)`).join('\n')
  return `You are a senior question setter for the Indian competitive exam "${examName}".
These topics appear most often in its past papers:
${list}

For EACH topic, write ${PER_TOPIC} fresh questions that are LIKELY to appear in the next exam, matching the real paper's style. Vary difficulty and include some "expert" (very difficult) questions. Re-solve each and set "verified" true only if fully confident.

Return ONLY valid JSON (no markdown): an array of
{ "topic": "...", "difficulty": "easy|medium|hard|expert", "question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "...", "verified": true }`
}

async function callGemini(prompt) {
  for (let attempt = 0; attempt < 5; attempt++) {
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
      await sleep(((m ? Number(m[1]) : 60) + 1) * 1000)
      continue
    }
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 160)}`)
  }
  throw new Error('exhausted retries')
}

function sanitize(raw, examId) {
  if (!Array.isArray(raw)) return []
  const stamp = Date.now()
  return raw
    .filter(
      (q) =>
        q && typeof q.question === 'string' && Array.isArray(q.options) && q.options.length === 4 &&
        Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3 && q.verified === true,
    )
    .map((q, i) => ({
      id: `${examId}-pred-${stamp}-${i}`,
      section: 'Predicted',
      topic: String(q.topic || 'Predicted'),
      difficulty: ['easy', 'medium', 'hard', 'expert'].includes(q.difficulty) ? q.difficulty : 'medium',
      source: 'predicted',
      status: 'pending',
      question: q.question.trim(),
      options: q.options.map((o) => String(o)),
      answer: q.answer,
      explanation: String(q.explanation || '').trim(),
    }))
}

async function main() {
  const config = JSON.parse(await readFile(join(DATA, 'config.json'), 'utf8'))
  const today = new Date().toISOString().slice(0, 10)

  let first = true
  for (const exam of config.exams.filter((e) => e.enabled)) {
    const bankPath = join(DATA, 'questions', `${exam.id}.json`)
    let bank
    try {
      bank = JSON.parse(await readFile(bankPath, 'utf8'))
    } catch {
      continue
    }
    const topics = topTopics(bank.questions, TOP_TOPICS)
    if (topics.length === 0) {
      console.log(`  ${exam.id}: no PYQ topics yet, skipping`)
      continue
    }
    if (!first) await sleep(THROTTLE_MS)
    first = false
    try {
      const clean = sanitize(await callGemini(buildPrompt(exam.name, topics)), exam.id)
      bank.questions.push(...clean)
      bank.updated = today
      await writeFile(bankPath, JSON.stringify(bank, null, 2) + '\n')
      console.log(`✅ ${exam.id}: +${clean.length} predicted (pending approval)`)
    } catch (err) {
      console.error(`  ${exam.id}: ${err.message}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
