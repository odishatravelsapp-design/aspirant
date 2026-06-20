import { useMemo } from 'react'
import type { QuestionBank } from '../types'
import { useT } from '../i18n/LanguageContext'
import { topicWeightage, repeatedTopics, type Probability } from '../lib/insights'

interface Props {
  bank: QuestionBank
  onPracticePredicted: () => void
}

const PROB_COLOR: Record<Probability, string> = {
  high: 'var(--good)',
  medium: 'var(--warn)',
  low: 'var(--muted)',
}

// PYQ pattern analysis: high-weightage topics + most-repeated, plus a predicted
// practice set. As real past-year questions accumulate, this becomes powerful.
export function Insights({ bank, onPracticePredicted }: Props) {
  const { t } = useT()
  const weights = useMemo(() => topicWeightage(bank.questions), [bank])
  const repeated = useMemo(() => repeatedTopics(weights), [weights])
  const maxCount = weights[0]?.count ?? 1

  return (
    <div className="screen">
      <h2 style={{ marginTop: 0 }}>📈 {t('insights.title')}</h2>
      <p className="muted">{t('insights.intro')}</p>

      <button className="btn" onClick={onPracticePredicted}>
        🎯 {t('insights.practicePredicted')}
      </button>

      <div className="section-title">{t('insights.weightage')}</div>
      <div className="card">
        {weights.map((w) => (
          <div className="topic-bar" key={w.topic}>
            <div className="label">
              <span>
                {w.topic}{' '}
                <span className="prob-tag" style={{ color: PROB_COLOR[w.prob] }}>
                  · {t(`insights.prob.${w.prob}`)}
                </span>
              </span>
              <span>{t('insights.appeared', { n: w.count })}</span>
            </div>
            <div className="track">
              <div
                className="fill"
                style={{ width: `${(w.count / maxCount) * 100}%`, background: PROB_COLOR[w.prob] }}
              />
            </div>
            {w.years.length > 0 && (
              <div className="muted" style={{ fontSize: '0.75rem', marginTop: 2 }}>
                {t('insights.years')}: {w.years.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="section-title">{t('insights.repeated')}</div>
      <div className="card">
        {repeated.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>{t('insights.repeatedNone')}</p>
        ) : (
          repeated.map((w) => (
            <div className="stat-row" key={w.topic}>
              <span>🔁 {w.topic}</span>
              <strong>{t('insights.appeared', { n: w.count })}</strong>
            </div>
          ))
        )}
      </div>

      <p className="muted" style={{ fontSize: '0.8rem' }}>{t('insights.disclaimer')}</p>
    </div>
  )
}
