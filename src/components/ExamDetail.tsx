import { useMemo, useState } from 'react'
import type { Exam, QuestionBank, Difficulty } from '../types'
import { getAttemptsForExam, topicStats, weakTopics as computeWeakTopics } from '../lib/storage'
import { useT } from '../i18n/LanguageContext'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert']

interface Props {
  exam: Exam
  bank: QuestionBank
  dueReviewCount: number
  onStart: (mode: 'mock' | 'practice' | 'fullmock', section: string | null, difficulty: Difficulty | null) => void
  onViewHistory: () => void
  onViewInsights: () => void
  onPracticeWeak: () => void
  onRevise: () => void
}

export function ExamDetail({
  exam,
  bank,
  dueReviewCount,
  onStart,
  onViewHistory,
  onViewInsights,
  onPracticeWeak,
  onRevise,
}: Props) {
  const { t } = useT()
  const [mode, setMode] = useState<'mock' | 'practice' | 'fullmock'>('mock')
  const [section, setSection] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)

  const attempts = useMemo(() => getAttemptsForExam(exam.id), [exam.id])
  const weakTopics = useMemo(() => topicStats(attempts).slice(0, 3), [attempts])
  // Can we offer a focused weak-topic drill? (need weak topics that have questions)
  const hasWeakPractice = useMemo(() => {
    const weak = new Set(computeWeakTopics(attempts))
    return weak.size > 0 && bank.questions.some((q) => weak.has(q.topic))
  }, [attempts, bank])

  const available = bank.questions.filter(
    (q) => (!section || q.section === section) && (!difficulty || q.difficulty === difficulty),
  ).length

  return (
    <div className="screen">
      <div className="card">
        <div style={{ fontSize: '2rem' }}>{exam.icon}</div>
        <h2 style={{ margin: '4px 0' }}>{exam.name}</h2>
        <div className="muted">{exam.category}</div>
      </div>

      <div className="section-title">{t('exam.testType')}</div>
      <div className="chip-row">
        <button className={`chip ${mode === 'mock' ? 'active' : ''}`} onClick={() => setMode('mock')}>
          {t('exam.mock')}
        </button>
        <button
          className={`chip ${mode === 'practice' ? 'active' : ''}`}
          onClick={() => setMode('practice')}
        >
          {t('exam.practice')}
        </button>
        <button
          className={`chip ${mode === 'fullmock' ? 'active' : ''}`}
          onClick={() => setMode('fullmock')}
        >
          {t('exam.fullmock')}
        </button>
      </div>

      <div className="section-title">{t('exam.section')}</div>
      <div className="chip-row">
        <button className={`chip ${section === null ? 'active' : ''}`} onClick={() => setSection(null)}>
          {t('exam.all')}
        </button>
        {exam.sections.map((s) => (
          <button key={s} className={`chip ${section === s ? 'active' : ''}`} onClick={() => setSection(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="section-title">{t('exam.difficulty')}</div>
      <div className="chip-row">
        <button className={`chip ${difficulty === null ? 'active' : ''}`} onClick={() => setDifficulty(null)}>
          {t('diff.all')}
        </button>
        {DIFFICULTIES.map((d) => (
          <button key={d} className={`chip ${difficulty === d ? 'active' : ''}`} onClick={() => setDifficulty(d)}>
            {t(`diff.${d}`)}
          </button>
        ))}
      </div>

      <p className="muted" style={{ marginTop: 12 }}>
        {t('exam.available', { n: available })}
      </p>

      <button className="btn" disabled={available === 0} onClick={() => onStart(mode, section, difficulty)}>
        {mode === 'mock' ? t('exam.startMock') : mode === 'fullmock' ? t('exam.startFullmock') : t('exam.startPractice')}
      </button>

      <button className="btn secondary" onClick={onViewInsights}>
        📈 {t('exam.insights')}
      </button>

      {dueReviewCount > 0 && (
        <button className="btn secondary" onClick={onRevise}>
          📒 {t('exam.revise', { n: dueReviewCount })}
        </button>
      )}

      {hasWeakPractice && (
        <button className="btn secondary" onClick={onPracticeWeak}>
          🎯 {t('exam.practiceWeak')}
        </button>
      )}

      {attempts.length > 0 && (
        <>
          <div className="section-title">{t('exam.weakTopics')}</div>
          <div className="card">
            {weakTopics.map((tp) => (
              <div className="topic-bar" key={tp.topic}>
                <div className="label">
                  <span>{tp.topic}</span>
                  <span>{Math.round(tp.accuracy * 100)}%</span>
                </div>
                <div className="track">
                  <div
                    className="fill"
                    style={{
                      width: `${Math.round(tp.accuracy * 100)}%`,
                      background: tp.accuracy < 0.5 ? 'var(--bad)' : 'var(--good)',
                    }}
                  />
                </div>
              </div>
            ))}
            <button className="btn secondary" onClick={onViewHistory}>
              {t('exam.viewHistory')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
