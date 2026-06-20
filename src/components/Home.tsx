import type { Exam, Question } from '../types'
import { useT } from '../i18n/LanguageContext'
import { currentStreak } from '../lib/storage'
import { QuestionOfDay } from './QuestionOfDay'

interface Props {
  exams: Exam[]
  tagline: string
  hasCurrentAffairs: boolean
  dueReviewCount: number
  qotdPool: Question[]
  onPick: (exam: Exam) => void
  onOpenCurrentAffairs: () => void
  onRevise: () => void
}

// Home shows streak, revision, daily current affairs, then feature-flagged exams.
export function Home({
  exams,
  tagline,
  hasCurrentAffairs,
  dueReviewCount,
  qotdPool,
  onPick,
  onOpenCurrentAffairs,
  onRevise,
}: Props) {
  const { t } = useT()
  const enabled = exams.filter((e) => e.enabled)
  const categories = [...new Set(enabled.map((e) => e.category))]
  const streak = currentStreak()

  return (
    <div className="screen">
      <div className="home-head">
        <p className="muted" style={{ margin: 0 }}>{tagline}</p>
        {streak > 0 && <span className="streak">🔥 {t('home.streak', { n: streak })}</span>}
      </div>

      {dueReviewCount > 0 && (
        <button className="revise-banner" onClick={onRevise}>
          <span className="emoji">📒</span>
          <span>
            <span className="ca-title">{t('home.revise.title')}</span>
            <span className="ca-sub">{t('home.revise.subtitle', { n: dueReviewCount })}</span>
          </span>
          <span className="ca-arrow">→</span>
        </button>
      )}

      {hasCurrentAffairs && (
        <button className="ca-banner" onClick={onOpenCurrentAffairs}>
          <span className="emoji">📰</span>
          <span>
            <span className="ca-title">{t('home.ca.title')}</span>
            <span className="ca-sub">{t('home.ca.subtitle')}</span>
          </span>
          <span className="ca-arrow">→</span>
        </button>
      )}

      {qotdPool.length > 0 && <QuestionOfDay pool={qotdPool} />}

      <div className="section-title">{t('home.exams')}</div>
      {enabled.length === 0 && (
        <div className="card center muted">No exams enabled yet. Check back soon!</div>
      )}

      {categories.map((cat) => (
        <div key={cat}>
          <div className="section-title">{cat}</div>
          <div className="exam-grid">
            {enabled
              .filter((e) => e.category === cat)
              .map((exam) => (
                <button key={exam.id} className="exam-card" onClick={() => onPick(exam)}>
                  <div className="emoji">{exam.icon}</div>
                  <div className="name">{exam.name}</div>
                  <div className="cat">{t('home.sections', { n: exam.sections.length })}</div>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
