// Shared data shapes for Aspirant.

export interface Exam {
  id: string
  name: string
  category: string
  enabled: boolean // feature flag — only enabled exams show on Home
  icon: string
  color: string
  sections: string[]
  // Languages this exam is actually conducted in. Question CONTENT is only ever
  // shown/translated in these languages (e.g. banking exams = ["en"], so their
  // questions stay English even when the UI is set to Odia).
  languages: string[]
}

export interface ReportConfig {
  whatsapp?: string // phone in international format, e.g. 919876543210
  email?: string
}

export interface AppConfig {
  appName: string
  tagline: string
  version: string
  defaultLanguage: string
  languages: string[]
  report?: ReportConfig
  // true = fully autonomous: generated/community questions publish instantly.
  // false = manual gate: factual questions stay hidden until approved.
  autoApprove?: boolean
  exams: Exam[]
}

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type QuestionSource = 'pyq' | 'ai' | 'web' | 'predicted' | 'community'

// A translated copy of a question's text (the answer index is language-agnostic).
export interface QuestionL10n {
  question: string
  options: string[]
  explanation: string
}

export interface Question {
  id: string
  section: string
  topic: string
  difficulty: Difficulty
  year?: number
  source: QuestionSource
  question: string // default language (English)
  options: string[]
  answer: number // index into options
  explanation: string
  attribution?: string // credit for externally-sourced questions
  // Review state. Absent/"approved" = visible. "pending" = hidden from students
  // until a human approves it (used for AI/web factual questions).
  status?: 'approved' | 'pending'
  // Optional per-language overrides, keyed by language code (e.g. "or").
  translations?: Record<string, QuestionL10n>
}

export interface QuestionBank {
  exam: string
  updated: string
  questions: Question[]
}

// A single answered question within a completed attempt.
export interface AnswerRecord {
  questionId: string
  topic: string
  section: string
  selected: number | null // null = skipped
  correct: boolean
}

// ---- Current Affairs ----

export interface CurrentAffairItem {
  id: string
  category: string // National, International, Banking, Sports, Awards, Odisha…
  title: string
  summary: string // 1–2 line exam-focused summary
  source?: string // originating outlet
  url?: string
  // Optional translations of title/summary, keyed by language code.
  translations?: Record<string, { title: string; summary: string }>
}

export interface CurrentAffairsDay {
  date: string // ISO yyyy-mm-dd
  items: CurrentAffairItem[]
  quiz: Question[] // MCQs generated from the day's news
}

// A completed test attempt, persisted to localStorage.
export interface Attempt {
  id: string
  examId: string
  examName: string
  mode: 'mock' | 'practice'
  section: string | null // null = all sections
  startedAt: number
  finishedAt: number
  total: number
  correctCount: number
  answers: AnswerRecord[]
  negativeMark?: number // penalty per wrong answer in mock mode (e.g. 0.25)
}

// A question scheduled for spaced revision (the "mistakes notebook").
// The full question is stored so revision works fully offline.
export interface ReviewItem {
  question: Question
  examId: string
  examName: string
  box: number // Leitner box: higher = longer interval
  nextReviewAt: number // epoch ms when this is due again
  addedAt: number
}
