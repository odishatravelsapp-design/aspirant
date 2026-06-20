import { useEffect, useRef, useState } from 'react'
import type { Question, AnswerRecord } from '../types'
import { useT } from '../i18n/LanguageContext'
import { localizeQuestion } from '../lib/localize'

interface Props {
  questions: Question[]
  mode: 'mock' | 'practice'
  negativeMark: number
  timeLimitSec?: number // mock-mode sectional timer; auto-submits at 0
  onFinish: (answers: AnswerRecord[]) => void
}

export function Quiz({ questions, mode, negativeMark, timeLimitSec, onFinish }: Props) {
  const { t, lang } = useT()
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false) // practice mode shows answer after pick
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [remaining, setRemaining] = useState<number>(timeLimitSec ?? 0)

  // Refs keep the timer's auto-submit working with the latest values.
  const answersRef = useRef(answers)
  const selectedRef = useRef(selected)
  const indexRef = useRef(index)
  const finishedRef = useRef(false)
  answersRef.current = answers
  selectedRef.current = selected
  indexRef.current = index

  const q = questions[index]
  const loc = localizeQuestion(q, lang)
  const isLast = index === questions.length - 1

  function finish(final: AnswerRecord[]) {
    if (finishedRef.current) return
    finishedRef.current = true
    onFinish(final)
  }

  // When time runs out, record the current pick + the rest as skipped, then submit.
  function finalizeTimeout() {
    const collected = [...answersRef.current]
    for (let i = indexRef.current; i < questions.length; i++) {
      const qq = questions[i]
      const sel = i === indexRef.current ? selectedRef.current : null
      collected.push({
        questionId: qq.id,
        topic: qq.topic,
        section: qq.section,
        selected: sel,
        correct: sel === qq.answer,
      })
    }
    finish(collected)
  }

  // Sectional countdown (mock mode only).
  useEffect(() => {
    if (!timeLimitSec) return
    if (remaining <= 0) {
      finalizeTimeout()
      return
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, timeLimitSec])

  function choose(optIdx: number) {
    if (revealed) return
    setSelected(optIdx)
    if (mode === 'practice') setRevealed(true)
  }

  function record(sel: number | null): AnswerRecord[] {
    const rec: AnswerRecord = {
      questionId: q.id,
      topic: q.topic,
      section: q.section,
      selected: sel,
      correct: sel === q.answer,
    }
    const next = [...answers, rec]
    setAnswers(next)
    return next
  }

  function advance(sel: number | null) {
    const updated = record(sel)
    if (isLast) {
      finish(updated)
      return
    }
    setIndex(index + 1)
    setSelected(null)
    setRevealed(false)
  }

  function optionClass(i: number): string {
    if (mode === 'practice' && revealed) {
      if (i === q.answer) return 'option correct'
      if (i === selected) return 'option wrong'
      return 'option'
    }
    return `option ${selected === i ? 'selected' : ''}`
  }

  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')
  const lowTime = remaining <= 30

  return (
    <div className="screen">
      <div className="quiz-meta">
        <span>{t('quiz.progress', { i: index + 1, n: questions.length })}</span>
        {timeLimitSec ? (
          <span style={{ color: lowTime ? 'var(--bad)' : 'var(--muted)', fontWeight: 600 }}>
            ⏱️ {mm}:{ss}
          </span>
        ) : (
          <span>
            {q.section} · {q.topic}
          </span>
        )}
      </div>
      <div className="progress-bar">
        <div style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="q-text">{loc.question}</div>

      {loc.options.map((opt, i) => (
        <button key={i} className={optionClass(i)} disabled={revealed} onClick={() => choose(i)}>
          {String.fromCharCode(65 + i)}. {opt}
        </button>
      ))}

      {mode === 'practice' && revealed && (
        <div className="explain">
          <strong>{selected === q.answer ? t('quiz.correct') : t('quiz.wrong')}</strong> {loc.explanation}
        </div>
      )}

      {mode === 'mock' && negativeMark > 0 && index === 0 && (
        <p className="muted" style={{ fontSize: '0.82rem' }}>
          {t('quiz.negativeNote', { mark: negativeMark })}
        </p>
      )}

      <button
        className="btn"
        onClick={() => advance(selected)}
        disabled={selected === null && mode === 'practice' && !revealed}
      >
        {isLast ? t('quiz.finish') : t('quiz.next')}
      </button>
      {mode === 'mock' && (
        <button className="btn secondary" onClick={() => advance(null)}>
          {t('quiz.skip')}
        </button>
      )}
    </div>
  )
}
