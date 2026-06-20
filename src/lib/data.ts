import type { AppConfig, QuestionBank, CurrentAffairsDay } from '../types'

// All fetches honour Vite's base path so it works on GitHub Pages subpaths.
const BASE = import.meta.env.BASE_URL

export async function loadConfig(): Promise<AppConfig> {
  const res = await fetch(`${BASE}data/config.json`)
  if (!res.ok) throw new Error('Failed to load config')
  return res.json()
}

// Master switch (config.autoApprove). When true the app is fully autonomous:
// generated/community questions show instantly. When false, pending questions
// stay hidden until a human approves them. App sets this after loading config.
let autoApprove = true
export function setAutoApprove(flag: boolean): void {
  autoApprove = flag
}

// Hide questions still pending approval — unless we're in autonomous mode.
const isVisible = (q: { status?: string }) => autoApprove || q.status !== 'pending'

export async function loadQuestionBank(examId: string): Promise<QuestionBank> {
  const res = await fetch(`${BASE}data/questions/${examId}.json`)
  if (!res.ok) throw new Error(`No question bank for ${examId}`)
  const bank: QuestionBank = await res.json()
  return { ...bank, questions: bank.questions.filter(isVisible) }
}

export async function loadCurrentAffairs(): Promise<CurrentAffairsDay | null> {
  try {
    const res = await fetch(`${BASE}data/current-affairs.json`)
    if (!res.ok) return null
    const day: CurrentAffairsDay = await res.json()
    return { ...day, quiz: day.quiz.filter(isVisible) }
  } catch {
    return null
  }
}

// Fisher–Yates shuffle (pure, returns a new array).
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
