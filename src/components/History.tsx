import { useMemo } from 'react'
import type { Exam } from '../types'
import { getAttemptsForExam, topicStats } from '../lib/storage'
import { useT } from '../i18n/LanguageContext'

interface Props {
  exam: Exam
}

// Cross-attempt analysis: overall trend + weak/strong topics for this exam.
export function History({ exam }: Props) {
  const { t } = useT()
  const attempts = useMemo(() => getAttemptsForExam(exam.id), [exam.id])
  const topics = useMemo(() => topicStats(attempts), [attempts])

  if (attempts.length === 0) {
    return (
      <div className="screen">
        <div className="card center muted">{t('hist.none')}</div>
      </div>
    )
  }

  const avgPct = Math.round(
    (attempts.reduce((s, a) => s + a.correctCount / a.total, 0) / attempts.length) * 100,
  )

  return (
    <div className="screen">
      <div className="card score-ring">
        <div className="big" style={{ color: 'var(--primary)' }}>
          {avgPct}%
        </div>
        <div className="muted">{t('hist.average', { n: attempts.length })}</div>
      </div>

      <div className="section-title">{t('hist.weakest')}</div>
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
      </div>

      <div className="section-title">{t('hist.recent')}</div>
      {attempts.slice(0, 15).map((a) => {
        const pct = Math.round((a.correctCount / a.total) * 100)
        const d = new Date(a.finishedAt)
        return (
          <div className="card" key={a.id}>
            <div className="stat-row" style={{ borderBottom: 'none', padding: 0 }}>
              <span>
                {a.mode === 'mock' ? '🧪' : '✏️'} {a.section ?? t('hist.allSections')}
                <br />
                <small className="muted">{d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
              </span>
              <strong style={{ color: pct >= 60 ? 'var(--good)' : pct >= 40 ? 'var(--warn)' : 'var(--bad)' }}>
                {pct}%
              </strong>
            </div>
          </div>
        )
      })}
    </div>
  )
}
