import type { Question, QuestionL10n, CurrentAffairItem } from '../types'

// Resolve a question's text for the given language, falling back to English
// when no translation exists (e.g. English-only exams like banking).
export function localizeQuestion(q: Question, lang: string): QuestionL10n {
  const tr = lang !== 'en' ? q.translations?.[lang] : undefined
  return {
    question: tr?.question ?? q.question,
    options: tr?.options && tr.options.length === q.options.length ? tr.options : q.options,
    explanation: tr?.explanation ?? q.explanation,
  }
}

export function localizeAffair(item: CurrentAffairItem, lang: string): { title: string; summary: string } {
  const tr = lang !== 'en' ? item.translations?.[lang] : undefined
  return {
    title: tr?.title ?? item.title,
    summary: tr?.summary ?? item.summary,
  }
}
