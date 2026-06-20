// Aspirant — daily current-affairs generator.
//
// Pulls REAL headlines from free public RSS feeds, then asks Gemini to turn them
// into exam-focused summary points + a short quiz. Grounding on real headlines
// keeps the facts accurate (the model summarises, it does not invent the news).
//
// Run:  GEMINI_API_KEY=xxxx node scripts/generate-current-affairs.mjs
// Output: public/data/current-affairs.json

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'data', 'current-affairs.json')

const API_KEY = process.env.GEMINI_API_KEY
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest'
const ITEM_COUNT = Number(process.env.CA_ITEMS || 8)
const QUIZ_COUNT = Number(process.env.CA_QUIZ || 5)

if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey')
  process.exit(1)
}

// Free RSS sources. Add/remove as you like — failures are skipped gracefully.
const FEEDS = [
  'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
  'https://news.google.com/rss/search?q=banking+OR+RBI+OR+economy+when:1d&hl=en-IN&gl=IN&ceid=IN:en',
  'https://news.google.com/rss/search?q=Odisha+when:1d&hl=en-IN&gl=IN&ceid=IN:en',
]

const stripTags = (s) => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
const unCdata = (s) => s.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1').trim()

// Minimal RSS parse: pull <title>/<description> from each <item>.
function parseFeed(xml) {
  const items = []
  const blocks = xml.match(/<item[\s\S]*?<\/item>/g) || []
  for (const b of blocks) {
    const title = /<title>([\s\S]*?)<\/title>/.exec(b)?.[1] ?? ''
    const desc = /<description>([\s\S]*?)<\/description>/.exec(b)?.[1] ?? ''
    const clean = stripTags(unCdata(title))
    if (clean) items.push({ title: clean, desc: stripTags(unCdata(desc)).slice(0, 200) })
  }
  return items
}

async function fetchHeadlines() {
  const all = []
  for (const url of FEEDS) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 AspirantBot' } })
      if (!res.ok) continue
      all.push(...parseFeed(await res.text()).slice(0, 12))
    } catch (e) {
      console.error(`feed failed: ${url} (${e.message})`)
    }
  }
  // De-duplicate by title.
  const seen = new Set()
  return all.filter((h) => (seen.has(h.title) ? false : seen.add(h.title)))
}

function buildPrompt(headlines) {
  const list = headlines.map((h, i) => `${i + 1}. ${h.title}${h.desc ? ` — ${h.desc}` : ''}`).join('\n')
  return `You are a current-affairs editor for Indian competitive exam aspirants (banking & state exams).
Below are today's real news headlines. Select the ${ITEM_COUNT} most exam-relevant ones and write concise, factual summary points. Then create ${QUIZ_COUNT} multiple-choice questions based ONLY on these headlines.

Headlines:
${list}

Also translate each item's title and summary into Odia (ଓଡ଼ିଆ), and translate the quiz question, options (same order/count) and explanation into Odia. Keep names, numbers and technical terms accurate.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "items": [
    { "category": "National | International | Banking | Economy | Sports | Awards | Science | Odisha", "title": "short headline", "summary": "1-2 line exam-focused summary", "source": "news", "translations": { "or": { "title": "…", "summary": "…" } } }
  ],
  "quiz": [
    { "topic": "category", "difficulty": "easy | medium | hard", "question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "...", "translations": { "or": { "question": "…", "options": ["…","…","…","…"], "explanation": "…" } } }
  ]
}
Only include facts supported by the headlines. Do not invent specifics you are unsure about.`
}

async function callGemini(prompt) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return JSON.parse(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}')
}

// Keep an Odia item translation only if both fields are present.
function itemTr(raw) {
  const tr = raw?.or
  if (tr && typeof tr.title === 'string' && typeof tr.summary === 'string') {
    return { or: { title: tr.title.trim(), summary: tr.summary.trim() } }
  }
  return undefined
}

// Keep an Odia question translation only if options match in count.
function quizTr(raw, optionCount) {
  const tr = raw?.or
  if (tr && typeof tr.question === 'string' && Array.isArray(tr.options) && tr.options.length === optionCount) {
    return {
      or: {
        question: tr.question.trim(),
        options: tr.options.map((o) => String(o)),
        explanation: String(tr.explanation || '').trim(),
      },
    }
  }
  return undefined
}

function sanitize(raw, date) {
  const stamp = Date.now()
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .filter((it) => it && it.title && it.summary)
    .map((it, i) => {
      const out = {
        id: `ca-${stamp}-${i}`,
        category: String(it.category || 'National'),
        title: String(it.title).trim(),
        summary: String(it.summary).trim(),
        source: String(it.source || 'news'),
      }
      const tr = itemTr(it.translations)
      if (tr) out.translations = tr
      return out
    })
  const quiz = (Array.isArray(raw.quiz) ? raw.quiz : [])
    .filter(
      (q) =>
        q && q.question && Array.isArray(q.options) && q.options.length === 4 &&
        Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3,
    )
    .map((q, i) => {
      const out = {
        id: `ca-q-${stamp}-${i}`,
        section: 'Current Affairs',
        topic: String(q.topic || 'Current Affairs'),
        difficulty: ['easy', 'medium', 'hard', 'expert'].includes(q.difficulty) ? q.difficulty : 'medium',
        source: 'ai',
        status: 'pending', // factual news content — review before students see it
        question: String(q.question).trim(),
        options: q.options.map((o) => String(o)),
        answer: q.answer,
        explanation: String(q.explanation || '').trim(),
      }
      const tr = quizTr(q.translations, q.options.length)
      if (tr) out.translations = tr
      return out
    })
  return { date, items, quiz }
}

async function main() {
  const date = new Date().toISOString().slice(0, 10)
  const headlines = await fetchHeadlines()
  console.log(`Fetched ${headlines.length} headlines.`)
  if (headlines.length === 0) {
    console.error('No headlines fetched; leaving existing current-affairs.json untouched.')
    process.exit(0)
  }
  const raw = await callGemini(buildPrompt(headlines))
  const out = sanitize(raw, date)
  if (out.items.length === 0) {
    console.error('Model returned no usable items; aborting to avoid wiping good data.')
    process.exit(1)
  }
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
  console.log(`✅ Wrote ${out.items.length} items + ${out.quiz.length} quiz questions for ${date}.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
