// Aspirant — approve pending questions.
//
// AI/web factual questions are written with "status": "pending" so a human can
// glance at them before students see them. After reviewing (e.g. via `git diff`),
// run this to publish them: it clears the pending flag everywhere.
//
//   node scripts/approve-questions.mjs            # approve all pending
//   node scripts/approve-questions.mjs ibps-clerk # approve one exam's bank
//
// Tip: to reject a question, just delete it before approving.

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, '..', 'public', 'data')
const only = process.argv[2] // optional exam id

function approveList(list) {
  let n = 0
  for (const q of list) {
    if (q.status === 'pending') {
      delete q.status
      n++
    }
  }
  return n
}

async function approveFile(path, getList, setList) {
  const json = JSON.parse(await readFile(path, 'utf8'))
  const n = approveList(getList(json))
  if (n > 0) {
    setList(json)
    await writeFile(path, JSON.stringify(json, null, 2) + '\n')
  }
  return n
}

async function main() {
  let total = 0

  // Exam question banks.
  const qDir = join(DATA, 'questions')
  for (const f of await readdir(qDir)) {
    if (!f.endsWith('.json')) continue
    if (only && f !== `${only}.json`) continue
    const n = await approveFile(join(qDir, f), (j) => j.questions, () => {})
    if (n) console.log(`  ${f}: approved ${n}`)
    total += n
  }

  // Current-affairs quiz.
  if (!only) {
    try {
      const n = await approveFile(join(DATA, 'current-affairs.json'), (j) => j.quiz, () => {})
      if (n) console.log(`  current-affairs.json: approved ${n}`)
      total += n
    } catch {
      /* no current-affairs file yet */
    }
  }

  console.log(`✅ Approved ${total} pending question(s).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
