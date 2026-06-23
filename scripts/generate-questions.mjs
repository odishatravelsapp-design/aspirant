// Aspirant — automated question generator.
//
// Calls the Google Gemini FREE tier to generate fresh MCQs for every enabled
// exam, makes the model SELF-VERIFY each answer, then appends only the
// verified questions to the exam's JSON bank.
//
// Run locally:   GEMINI_API_KEY=xxxx node scripts/generate-questions.mjs
// In CI:         provided by GitHub Actions (see .github/workflows/generate-questions.yml)
//
// Zero paid services. Gemini free tier is enough for a daily top-up.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA = join(ROOT, 'public', 'data')

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const PER_TOPIC = Number(process.env.QUESTIONS_PER_TOPIC || 2)

if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey')
  process.exit(1)
}

// The key is passed via the X-goog-api-key header (works for both old and new key formats).
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

// Free tier allows ~5 requests/minute. Space requests out to stay safely under it.
const THROTTLE_MS = Number(process.env.THROTTLE_MS || 13000)
const MAX_RETRIES = 4

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Normalize a question for de-duplication.
const normQ = (s) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w ]/g, '').trim()

// Global throttle: ensures at least THROTTLE_MS between any two API calls.
let lastRequest = 0
async function throttle() {
  const since = Date.now() - lastRequest
  if (lastRequest && since < THROTTLE_MS) await sleep(THROTTLE_MS - since)
  lastRequest = Date.now()
}

// Human-readable names for the language codes we may translate into.
const LANG_NAMES = { or: 'Odia (ଓଡ଼ିଆ)', hi: 'Hindi', bn: 'Bengali', te: 'Telugu', ta: 'Tamil' }

// Ask Gemini for questions AND a verification field. We keep only questions the
// model itself confirms are correct — a cheap quality guard against hallucination.
// `extraLangs` are non-English language codes this exam is conducted in; the model
// is asked to translate ONLY for those (banking exams get none, so stay English).
function buildPrompt(examName, section, count, extraLangs, avoid) {
  const avoidBlock =
    avoid && avoid.length
      ? `\n- Do NOT repeat or rephrase any of these already-asked questions:\n${avoid
          .map((q) => `  • ${q}`)
          .join('\n')}`
      : ''
  const translateBlock =
    extraLangs.length > 0
      ? `
- Also provide a "translations" object translating the question, options (same order and count), and explanation into: ${extraLangs
          .map((l) => LANG_NAMES[l] || l)
          .join(', ')}. Keep numbers, names and technical terms accurate.`
      : ''

  const shape =
    extraLangs.length > 0
      ? `,
    "translations": { ${extraLangs
      .map((l) => `"${l}": { "question": "…", "options": ["…","…","…","…"], "explanation": "…" }`)
      .join(', ')} }`
      : ''

  return `You are an expert question setter for the Indian competitive exam "${examName}".
Generate ${count} multiple-choice questions for the section "${section}".

Rules:
- Every question must be NEW and distinct from the others.
- Spread difficulty roughly evenly across all four levels: easy, medium, hard, expert (very difficult).
- Exactly 4 options each.
- For factual questions, only use well-established, verifiable facts.
- After writing each question, RE-SOLVE it yourself and set "verified" to true ONLY if you are fully confident the marked answer is correct.${avoidBlock}${translateBlock}

Return ONLY valid JSON (no markdown), an array of objects with this exact shape:
[
  {
    "topic": "short topic name",
    "difficulty": "easy | medium | hard | expert",
    "question": "the question text",
    "options": ["A", "B", "C", "D"],
    "answer": 0,
    "explanation": "why the answer is correct",
    "verified": true${shape}
  }
]`
}

// Parse the server-suggested retry delay (seconds) from a 429 body, fallback to 60s.
function retryDelayMs(body) {
  const m = /"retryDelay":\s*"(\d+)/.exec(body)
  return (m ? Number(m[1]) + 1 : 60) * 1000
}

async function callGemini(prompt) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await throttle()
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, responseMimeType: 'application/json' },
      }),
    })

    if (res.ok) {
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
      return JSON.parse(text)
    }

    const body = await res.text()
    // Retry transient errors: 429 (rate limit) and 500/503 (model overloaded).
    if ([429, 500, 503].includes(res.status) && attempt < MAX_RETRIES) {
      const wait = res.status === 429 ? retryDelayMs(body) : 15000
      console.log(`    transient ${res.status}, retrying in ${Math.round(wait / 1000)}s…`)
      await sleep(wait)
      continue
    }
    throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`)
  }
  throw new Error('Gemini: exhausted retries')
}

// Factual sections (facts can be wrong) vs rule-based (math/grammar, verifiable).
function isFactualSection(section) {
  return /awareness|knowledge|\bgk\b|banking|economy|current|polity|history|geograph/i.test(section)
}

// Keep only translations for the allowed languages that are well-formed.
function cleanTranslations(raw, optionCount, extraLangs) {
  if (!raw || typeof raw !== 'object') return undefined
  const out = {}
  for (const lang of extraLangs) {
    const tr = raw[lang]
    if (
      tr &&
      typeof tr.question === 'string' &&
      Array.isArray(tr.options) &&
      tr.options.length === optionCount
    ) {
      out[lang] = {
        question: tr.question.trim(),
        options: tr.options.map((o) => String(o)),
        explanation: String(tr.explanation || '').trim(),
      }
    }
  }
  return Object.keys(out).length ? out : undefined
}

// Validate shape and keep only self-verified, well-formed questions.
function sanitize(raw, examId, section, extraLangs) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (q) =>
        q &&
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.answer) &&
        q.answer >= 0 &&
        q.answer <= 3 &&
        q.verified === true,
    )
    .map((q, i) => {
      const out = {
        id: `${examId}-ai-${Date.now()}-${i}`,
        section,
        topic: String(q.topic || section),
        difficulty: ['easy', 'medium', 'hard', 'expert'].includes(q.difficulty) ? q.difficulty : 'medium',
        source: 'ai',
        question: q.question.trim(),
        options: q.options.map((o) => String(o)),
        answer: q.answer,
        explanation: String(q.explanation || '').trim(),
      }
      // Factual sections need a human glance before students see them; rule-based
      // sections (Quant/Reasoning/English) are verifiable, so auto-approve.
      if (isFactualSection(section)) out.status = 'pending'
      const translations = cleanTranslations(q.translations, q.options.length, extraLangs)
      // For exams conducted in extra languages (e.g. Odia), drop any question
      // that didn't come back fully translated — so those exams stay consistent.
      if (extraLangs.length > 0 && (!translations || extraLangs.some((l) => !translations[l]))) {
        return null
      }
      if (translations) out.translations = translations
      return out
    })
    .filter(Boolean)
}

async function main() {
  const config = JSON.parse(await readFile(join(DATA, 'config.json'), 'utf8'))
  const enabled = config.exams.filter((e) => e.enabled)
  const today = new Date().toISOString().slice(0, 10)

  for (const exam of enabled) {
    const bankPath = join(DATA, 'questions', `${exam.id}.json`)
    let bank
    try {
      bank = JSON.parse(await readFile(bankPath, 'utf8'))
    } catch {
      bank = { exam: exam.id, updated: today, questions: [] }
    }

    // Only translate into the non-English languages this exam is actually conducted in.
    const extraLangs = (exam.languages || ['en']).filter((l) => l !== 'en')
    // De-dup against everything already in the bank.
    const seen = new Set(bank.questions.map((q) => normQ(q.question)))

    let added = 0
    for (const section of exam.sections) {
      try {
        // Tell the model which recent questions in this section to avoid repeating.
        const avoid = bank.questions
          .filter((q) => q.section === section)
          .slice(-20)
          .map((q) => q.question.slice(0, 90))
        const raw = await callGemini(buildPrompt(exam.name, section, PER_TOPIC, extraLangs, avoid))
        const clean = sanitize(raw, exam.id, section, extraLangs).filter((q) => {
          const k = normQ(q.question)
          if (seen.has(k)) return false
          seen.add(k)
          return true
        })
        bank.questions.push(...clean)
        added += clean.length
        console.log(`  ${exam.id} / ${section}: +${clean.length}`)
      } catch (err) {
        console.error(`  ${exam.id} / ${section}: ${err.message}`)
      }
    }

    bank.updated = today
    await writeFile(bankPath, JSON.stringify(bank, null, 2) + '\n')
    console.log(`✅ ${exam.id}: +${added} questions (total ${bank.questions.length})`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
