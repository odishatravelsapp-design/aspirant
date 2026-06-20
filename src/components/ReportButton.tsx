import { useState } from 'react'
import type { Question } from '../types'
import { useT } from '../i18n/LanguageContext'
import { logReport } from '../lib/storage'
import { getReportConfig } from '../lib/appMeta'

// Lets a student flag a wrong/unclear question. Always logs locally; if a
// WhatsApp number or email is configured, it also opens that channel pre-filled.
export function ReportButton({ question, examId }: { question: Question; examId: string }) {
  const { t } = useT()
  const [done, setDone] = useState(false)

  function report() {
    logReport({ questionId: question.id, questionText: question.question, examId, at: Date.now() })
    setDone(true)

    const { whatsapp, email } = getReportConfig()
    const msg = `Reporting a question in Aspirant.\nExam: ${examId}\nID: ${question.id}\nQ: ${question.question}`
    if (whatsapp) {
      window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
    } else if (email) {
      window.open(
        `mailto:${email}?subject=${encodeURIComponent('Aspirant: question report')}&body=${encodeURIComponent(msg)}`,
        '_blank',
        'noopener',
      )
    }
  }

  if (done) return <span className="report-done">{t('report.done')}</span>

  return (
    <button className="report-btn" onClick={report} type="button">
      ⚠ {t('report.action')}
    </button>
  )
}
