import type { Attempt, Question, ReviewItem } from '../types'

// Attempts are stored on-device so history & analysis work fully offline.
const KEY = 'aspirant.attempts.v1'
const REVIEW_KEY = 'aspirant.reviews.v1'
const ACTIVITY_KEY = 'aspirant.activity.v1'
const REPORTS_KEY = 'aspirant.reports.v1'

export function getAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Attempt[]) : []
  } catch {
    return []
  }
}

export function saveAttempt(attempt: Attempt): void {
  const all = getAttempts()
  all.unshift(attempt)
  // Keep the most recent 200 attempts to bound storage on low-end devices.
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)))
}

export function getAttemptsForExam(examId: string): Attempt[] {
  return getAttempts().filter((a) => a.examId === examId)
}

// Merge attempts pulled from the cloud into local storage, de-duplicating by id.
// Returns the merged list (most recent first).
export function mergeAttempts(incoming: Attempt[]): Attempt[] {
  const byId = new Map<string, Attempt>()
  for (const a of [...getAttempts(), ...incoming]) byId.set(a.id, a)
  const merged = [...byId.values()].sort((a, b) => b.finishedAt - a.finishedAt).slice(0, 200)
  localStorage.setItem(KEY, JSON.stringify(merged))
  return merged
}

// Simple unique id without external deps (crypto when available).
export function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e6)}`
}

// Aggregate accuracy per topic across a set of attempts — powers analysis.
export interface TopicStat {
  topic: string
  attempted: number
  correct: number
  accuracy: number // 0..1
}

export function topicStats(attempts: Attempt[]): TopicStat[] {
  const map = new Map<string, { attempted: number; correct: number }>()
  for (const att of attempts) {
    for (const ans of att.answers) {
      if (ans.selected === null) continue
      const cur = map.get(ans.topic) ?? { attempted: 0, correct: 0 }
      cur.attempted++
      if (ans.correct) cur.correct++
      map.set(ans.topic, cur)
    }
  }
  return [...map.entries()]
    .map(([topic, v]) => ({
      topic,
      attempted: v.attempted,
      correct: v.correct,
      accuracy: v.attempted ? v.correct / v.attempted : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy)
}

// Topics with accuracy below `threshold` (and at least one attempt), weakest first.
export function weakTopics(attempts: Attempt[], threshold = 0.7): string[] {
  return topicStats(attempts)
    .filter((t) => t.attempted > 0 && t.accuracy < threshold)
    .map((t) => t.topic)
}

// ---- Mistakes notebook + spaced revision (Leitner system) ----

const DAY = 24 * 60 * 60 * 1000
// Interval per box, in days. Box 0 = review tomorrow, up to ~5 weeks.
const BOX_DAYS = [1, 3, 7, 16, 35]

export function getReviews(): ReviewItem[] {
  try {
    const raw = localStorage.getItem(REVIEW_KEY)
    return raw ? (JSON.parse(raw) as ReviewItem[]) : []
  } catch {
    return []
  }
}

function saveReviews(items: ReviewItem[]): void {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(items.slice(0, 500)))
}

export function dueReviews(now = Date.now()): ReviewItem[] {
  return getReviews().filter((r) => r.nextReviewAt <= now)
}

export function dueReviewsForExam(examId: string, now = Date.now()): ReviewItem[] {
  return dueReviews(now).filter((r) => r.examId === examId)
}

function intervalMs(box: number): number {
  return BOX_DAYS[Math.min(box, BOX_DAYS.length - 1)] * DAY
}

// Add a freshly-missed question to the notebook (no-op if already tracked).
function addMistake(items: ReviewItem[], q: Question, examId: string, examName: string, now: number) {
  if (items.some((r) => r.question.id === q.id)) return
  items.push({ question: q, examId, examName, box: 0, nextReviewAt: now + intervalMs(0), addedAt: now })
}

// Grade a previously-tracked question: correct promotes it, wrong resets it.
function gradeReview(items: ReviewItem[], questionId: string, correct: boolean, now: number) {
  const r = items.find((x) => x.question.id === questionId)
  if (!r) return
  r.box = correct ? r.box + 1 : 0
  r.nextReviewAt = now + intervalMs(r.box)
}

// After any quiz: track new mistakes and grade re-encountered ones.
export function recordQuizForReview(
  graded: { question: Question; selected: number | null; correct: boolean }[],
  examId: string,
  examName: string,
  now = Date.now(),
): void {
  const items = getReviews()
  const tracked = new Set(items.map((r) => r.question.id))
  for (const g of graded) {
    if (g.selected === null) continue // skipped — don't grade
    if (tracked.has(g.question.id)) gradeReview(items, g.question.id, g.correct, now)
    else if (!g.correct) addMistake(items, g.question, examId, examName, now)
  }
  // Drop questions that have been mastered (graduated past the last box).
  saveReviews(items.filter((r) => r.box < BOX_DAYS.length))
}

// ---- Daily streak ----

function todayStr(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

export function markActiveToday(): void {
  const days = getActiveDays()
  const today = todayStr()
  if (!days.includes(today)) {
    days.push(today)
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(days.slice(-400)))
  }
}

function getActiveDays(): string[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

// ---- Reported questions (quality feedback) ----

export interface QuestionReport {
  questionId: string
  questionText: string
  examId: string
  at: number
}

// Log a report locally so nothing breaks even when no contact channel is set up;
// these can later be synced or exported for review.
export function logReport(r: QuestionReport): void {
  try {
    const raw = localStorage.getItem(REPORTS_KEY)
    const all: QuestionReport[] = raw ? JSON.parse(raw) : []
    if (all.some((x) => x.questionId === r.questionId)) return
    all.unshift(r)
    localStorage.setItem(REPORTS_KEY, JSON.stringify(all.slice(0, 200)))
  } catch {
    /* ignore storage errors */
  }
}

// Current consecutive-day streak ending today or yesterday.
export function currentStreak(now = new Date()): number {
  const set = new Set(getActiveDays())
  if (set.size === 0) return 0
  let streak = 0
  const cursor = new Date(now)
  // Allow the streak to still count if they were active yesterday but not yet today.
  if (!set.has(todayStr(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (set.has(todayStr(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
