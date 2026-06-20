import { useEffect, useRef, useState } from 'react'
import type { Question, AnswerRecord } from '../types'
import { useT } from '../i18n/LanguageContext'
import { localizeQuestion } from '../lib/localize'
import { DifficultyBadge } from './DifficultyBadge'

interface Props {
  questions: Question[]
  negativeMark: number
  timeLimitSec?: number
  onFinish: (answers: AnswerRecord[]) => void
}

// Real exam-pattern mock: a question palette to jump around, mark-for-review,
// answer in any order, and submit when ready (or on timeout). Mirrors how
// IBPS/SBI/OSSSC online tests actually work.
export function ExamMock({ questions, negativeMark, timeLimitSec, onFinish }: Props) {
  const { t, lang } = useT()
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  const [marked, setMarked] = useState<Set<number>>(new Set())
  const [remaining, setRemaining] = useState<number>(timeLimitSec ?? 0)
  const [confirming, setConfirming] = useState(false)

  const answersRef = useRef(answers)
  const submittedRef = useRef(false)
  answersRef.current = answers

  function submit() {
    if (submittedRef.current) return
    submittedRef.current = true
    const records: AnswerRecord[] = questions.map((q, i) => ({
      questionId: q.id,
      topic: q.topic,
      section: q.section,
      selected: answersRef.current[i],
      correct: answersRef.current[i] === q.answer,
    }))
    onFinish(records)
  }

  // Whole-test countdown with auto-submit.
  useEffect(() => {
    if (!timeLimitSec) return
    if (remaining <= 0) {
      submit()
      return
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, timeLimitSec])

  const q = questions[current]
  const loc = localizeQuestion(q, lang)
  const answeredCount = answers.filter((a) => a !== null).length

  function pick(i: number) {
    setAnswers((prev) => {
      const next = [...prev]
      next[current] = next[current] === i ? null : i // tap again to clear
      return next
    })
  }

  function toggleMark() {
    setMarked((prev) => {
      const next = new Set(prev)
      if (next.has(current)) next.delete(current)
      else next.add(current)
      return next
    })
  }

  function paletteClass(i: number): string {
    let c = 'palette-cell'
    if (answers[i] !== null) c += ' answered'
    if (marked.has(i)) c += ' marked'
    if (i === current) c += ' current'
    return c
  }

  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="screen">
      <div className="quiz-meta">
        <span>
          {t('quiz.progress', { i: current + 1, n: questions.length })} · {t('mock.answered', { n: answeredCount })}
        </span>
        {timeLimitSec ? (
          <span style={{ color: remaining <= 30 ? 'var(--bad)' : 'var(--muted)', fontWeight: 600 }}>
            ⏱️ {mm}:{ss}
          </span>
        ) : null}
      </div>

      {negativeMark > 0 && current === 0 && (
        <p className="muted" style={{ fontSize: '0.82rem', marginTop: 0 }}>
          {t('quiz.negativeNote', { mark: negativeMark })}
        </p>
      )}

      <div className="q-head">
        <DifficultyBadge level={q.difficulty} />
      </div>
      <div className="q-text">{loc.question}</div>
      {loc.options.map((opt, i) => (
        <button
          key={i}
          className={`option ${answers[current] === i ? 'selected' : ''}`}
          onClick={() => pick(i)}
        >
          {String.fromCharCode(65 + i)}. {opt}
        </button>
      ))}

      <div className="mock-controls">
        <button className="btn secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}>
          ‹ {t('mock.prev')}
        </button>
        <button className={`btn secondary ${marked.has(current) ? 'marked-btn' : ''}`} onClick={toggleMark}>
          {marked.has(current) ? t('mock.marked') : t('mock.mark')}
        </button>
        <button
          className="btn secondary"
          disabled={current === questions.length - 1}
          onClick={() => setCurrent(current + 1)}
        >
          {t('mock.next')} ›
        </button>
      </div>

      <div className="section-title">{t('mock.palette')}</div>
      <div className="palette">
        {questions.map((_, i) => (
          <button key={i} className={paletteClass(i)} onClick={() => setCurrent(i)}>
            {i + 1}
          </button>
        ))}
      </div>

      {!confirming ? (
        <button className="btn" onClick={() => setConfirming(true)}>
          {t('mock.submit')}
        </button>
      ) : (
        <div className="card">
          <p style={{ marginTop: 0 }}>{t('mock.confirm', { answered: answeredCount, total: questions.length })}</p>
          <button className="btn" onClick={submit}>
            {t('mock.submitConfirm')}
          </button>
          <button className="btn secondary" onClick={() => setConfirming(false)}>
            {t('mock.cancel')}
          </button>
        </div>
      )}
    </div>
  )
}
