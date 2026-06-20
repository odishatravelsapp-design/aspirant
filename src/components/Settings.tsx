import { useState } from 'react'
import { useT } from '../i18n/LanguageContext'
import {
  getTheme,
  getFontScale,
  setTheme,
  setFontScale,
  type Theme,
  type FontScale,
} from '../lib/settings'

// Accessibility settings: theme (sunlight/night) and text size (older eyes,
// low-end screens). Applied instantly and saved on-device.
export function Settings({ onAbout }: { onAbout: () => void }) {
  const { t } = useT()
  const [theme, setThemeState] = useState<Theme>(getTheme())
  const [font, setFontState] = useState<FontScale>(getFontScale())

  const themes: { id: Theme; label: string }[] = [
    { id: 'light', label: t('settings.light') },
    { id: 'dark', label: t('settings.dark') },
    { id: 'auto', label: t('settings.auto') },
  ]
  const sizes: { id: FontScale; label: string }[] = [
    { id: 'normal', label: t('settings.sizeNormal') },
    { id: 'large', label: t('settings.sizeLarge') },
    { id: 'xl', label: t('settings.sizeXl') },
  ]

  return (
    <div className="screen">
      <h2 style={{ marginTop: 0 }}>{t('settings.title')}</h2>

      <div className="section-title">{t('settings.theme')}</div>
      <div className="chip-row">
        {themes.map((th) => (
          <button
            key={th.id}
            className={`chip ${theme === th.id ? 'active' : ''}`}
            onClick={() => {
              setTheme(th.id)
              setThemeState(th.id)
            }}
          >
            {th.label}
          </button>
        ))}
      </div>

      <div className="section-title">{t('settings.textSize')}</div>
      <div className="chip-row">
        {sizes.map((s) => (
          <button
            key={s.id}
            className={`chip ${font === s.id ? 'active' : ''}`}
            onClick={() => {
              setFontScale(s.id)
              setFontState(s.id)
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <button className="btn secondary" style={{ marginTop: 20 }} onClick={onAbout}>
        {t('about.title')}
      </button>

      <p className="muted" style={{ marginTop: 12 }}>
        {t('settings.hint')}
      </p>
    </div>
  )
}
