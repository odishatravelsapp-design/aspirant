import type { Difficulty } from '../types'
import { useT } from '../i18n/LanguageContext'

const COLOR: Record<Difficulty, string> = {
  easy: 'var(--good)',
  medium: 'var(--warn)',
  hard: 'var(--bad)',
  expert: '#7c3aed',
}

// Small coloured pill showing a question's difficulty (easy → expert).
export function DifficultyBadge({ level }: { level: Difficulty }) {
  const { t } = useT()
  const lvl = (COLOR[level] ? level : 'medium') as Difficulty
  return (
    <span className="diff-badge" style={{ color: COLOR[lvl], borderColor: COLOR[lvl] }}>
      {t(`diff.${lvl}`)}
    </span>
  )
}
