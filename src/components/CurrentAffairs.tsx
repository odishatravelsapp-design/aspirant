import type { CurrentAffairsDay } from '../types'
import { useT } from '../i18n/LanguageContext'
import { localizeAffair } from '../lib/localize'

interface Props {
  day: CurrentAffairsDay | null
  onTakeQuiz: () => void
}

// Daily current-affairs digest: categorised news cards + a quiz on the day's items.
export function CurrentAffairs({ day, onTakeQuiz }: Props) {
  const { t, lang } = useT()

  if (!day || day.items.length === 0) {
    return (
      <div className="screen">
        <div className="card center muted">{t('ca.none')}</div>
      </div>
    )
  }

  const prettyDate = new Date(day.date).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="screen">
      <div className="card">
        <h2 style={{ margin: '0 0 4px' }}>{t('ca.title')}</h2>
        <div className="muted">{t('ca.updated', { date: prettyDate })}</div>
      </div>

      {day.quiz.length > 0 && (
        <button className="btn" onClick={onTakeQuiz}>
          {t('ca.takeQuiz')} ({day.quiz.length})
        </button>
      )}

      <div className="section-title">{t('ca.points')}</div>
      {day.items.map((item) => {
        const loc = localizeAffair(item, lang)
        return (
        <div className="card" key={item.id}>
          <span className="badge">{item.category}</span>
          <div style={{ fontWeight: 600, margin: '6px 0' }}>{loc.title}</div>
          <div style={{ fontSize: '0.95rem' }}>{loc.summary}</div>
          {item.url ? (
            <a href={item.url} target="_blank" rel="noreferrer" className="muted" style={{ fontSize: '0.8rem' }}>
              {t('ca.source')}: {item.source}
            </a>
          ) : (
            item.source && (
              <div className="muted" style={{ fontSize: '0.8rem', marginTop: 4 }}>
                {t('ca.source')}: {item.source}
              </div>
            )
          )}
        </div>
        )
      })}
    </div>
  )
}
