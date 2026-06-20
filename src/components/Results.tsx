import { useMemo } from 'react'
import type { Attempt, Question } from '../types'
import { topicStats } from '../lib/storage'
import { useT } from '../i18n/LanguageContext'
import { localizeQuestion } from '../lib/localize'
import { ReportButton } from './ReportButton'

interface Props {
  attempt: Attempt
  questions: Question[] // the questions that were asked, for review
  onRetry: () => void
  onHome: () => void
}

export function Results({ attempt, questions, onRetry, onHome }: Props) {
  const { t, lang } = useT()
  const pct = Math.round((attempt.correctCount / attempt.total) * 100)
  const skipped = attempt.answers.filter((a) => a.selected === null).length
  const wrong = attempt.total - attempt.correctCount - skipped
  const seconds = Math.max(1, Math.round((attempt.finishedAt - attempt.startedAt) / 1000))
  const topics = useMemo(() => topicStats([attempt]), [attempt])
  const qById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions])

  const negativeMark = attempt.negativeMark ?? 0
  const penalty = wrong * negativeMark
  const netScore = Math.max(0, attempt.correctCount - penalty)
  const scoreColor = pct >= 60 ? 'var(--good)' : pct >= 40 ? 'var(--warn)' : 'var(--bad)'

  function share() {
    const url = window.location.origin + import.meta.env.BASE_URL
    const text = t('res.shareText', { pct, exam: attempt.examName, url })
    // Prefer the native share sheet (mobile); fall back to WhatsApp.
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
    }
  }

  return (
    <div className="screen">
      <div className="card score-ring">
        <div className="big" style={{ color: scoreColor }}>
          {pct}%
        </div>
        <div className="muted">{t('res.ofCorrect', { c: attempt.correctCount, t: attempt.total })}</div>
      </div>

      <div className="card">
        <div className="stat-row">
          <span>✅ {t('res.correct')}</span>
          <strong>{attempt.correctCount}</strong>
        </div>
        <div className="stat-row">
          <span>❌ {t('res.wrong')}</span>
          <strong>{wrong}</strong>
        </div>
        <div className="stat-row">
          <span>⏭️ {t('res.skipped')}</span>
          <strong>{skipped}</strong>
        </div>
        <div className="stat-row">
          <span>⏱️ {t('res.time')}</span>
          <strong>
            {Math.floor(seconds / 60)}m {seconds % 60}s
          </strong>
        </div>
        {negativeMark > 0 && (
          <div className="stat-row" style={{ borderBottom: 'none' }}>
            <span>🎯 {t('res.netScore')}</span>
            <strong>
              {netScore.toFixed(2)} / {attempt.total}
              <span className="muted" style={{ fontWeight: 400 }}> (−{penalty.toFixed(2)})</span>
            </strong>
          </div>
        )}
      </div>

      <div className="section-title">{t('res.analysis')}</div>
      <div className="card">
        {topics.map((t) => (
          <div className="topic-bar" key={t.topic}>
            <div className="label">
              <span>{t.topic}</span>
              <span>
                {t.correct}/{t.attempted} · {Math.round(t.accuracy * 100)}%
              </span>
            </div>
            <div className="track">
              <div
                className="fill"
                style={{
                  width: `${Math.round(t.accuracy * 100)}%`,
                  background: t.accuracy < 0.5 ? 'var(--bad)' : 'var(--good)',
                }}
              />
            </div>
          </div>
        ))}
        <p className="muted" style={{ marginTop: 8 }}>
          {t('res.focusTip')}
        </p>
      </div>

      <div className="section-title">{t('res.review')}</div>
      {attempt.answers.map((a, i) => {
        const q = qById.get(a.questionId)
        if (!q) return null
        const loc = localizeQuestion(q, lang)
        return (
          <div className="card" key={a.questionId}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {i + 1}. {loc.question}
            </div>
            <div style={{ fontSize: '0.92rem' }}>
              <div style={{ color: 'var(--good)' }}>
                {t('res.correctLabel')} {String.fromCharCode(65 + q.answer)}. {loc.options[q.answer]}
              </div>
              {a.selected !== null && a.selected !== q.answer && (
                <div style={{ color: 'var(--bad)' }}>
                  {t('res.yourAnswer')} {String.fromCharCode(65 + a.selected)}. {loc.options[a.selected]}
                </div>
              )}
              {a.selected === null && <div className="muted">{t('res.skipped')}</div>}
            </div>
            <div className="explain">{loc.explanation}</div>
            {q.attribution && (
              <div className="muted" style={{ fontSize: '0.72rem', marginTop: 4 }}>
                {t('ca.source')}: {q.attribution}
              </div>
            )}
            <ReportButton question={q} examId={attempt.examId} />
          </div>
        )
      })}

      <button className="btn" onClick={onRetry}>
        {t('res.tryAgain')}
      </button>
      <button className="btn secondary" onClick={share}>
        📲 {t('res.share')}
      </button>
      <button className="btn secondary" onClick={onHome}>
        {t('res.backHome')}
      </button>
    </div>
  )
}
