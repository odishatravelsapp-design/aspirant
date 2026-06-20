import { useState } from 'react'
import type { Question } from '../types'
import { useT } from '../i18n/LanguageContext'
import { localizeQuestion } from '../lib/localize'

const KEY = 'aspirant.qotd.v1'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// Day-of-epoch so everyone gets the same question on the same calendar day.
function dayIndex(): number {
  return Math.floor(Date.now() / 86400000)
}

interface Stored {
  date: string
  selected: number
}

// A single deterministic daily question, drawn from the available quiz pool.
// Pairs with the streak to build a daily habit.
export function QuestionOfDay({ pool }: { pool: Question[] }) {
  const { t, lang } = useT()
  const q = pool.length > 0 ? pool[dayIndex() % pool.length] : null

  const [selected, setSelected] = useState<number | null>(() => {
    try {
      const s: Stored | null = JSON.parse(localStorage.getItem(KEY) || 'null')
      // Today's question is deterministic, so a same-day record restores the answer.
      return s && s.date === today() ? s.selected : null
    } catch {
      return null
    }
  })

  if (!q) return null
  const answerIdx = q.answer
  const loc = localizeQuestion(q, lang)
  const revealed = selected !== null

  function choose(i: number) {
    if (revealed) return
    setSelected(i)
    localStorage.setItem(KEY, JSON.stringify({ date: today(), selected: i }))
  }

  function optionClass(i: number): string {
    if (!revealed) return 'option'
    if (i === answerIdx) return 'option correct'
    if (i === selected) return 'option wrong'
    return 'option'
  }

  return (
    <div className="card qotd">
      <div className="section-title" style={{ margin: '0 0 8px' }}>
        💡 {t('qotd.title')}
      </div>
      <div className="q-text" style={{ fontSize: '1rem' }}>{loc.question}</div>
      {loc.options.map((opt, i) => (
        <button key={i} className={optionClass(i)} disabled={revealed} onClick={() => choose(i)}>
          {String.fromCharCode(65 + i)}. {opt}
        </button>
      ))}
      {revealed && (
        <div className="explain">
          <strong>{selected === answerIdx ? t('quiz.correct') : t('quiz.wrong')}</strong> {loc.explanation}
        </div>
      )}
    </div>
  )
}
