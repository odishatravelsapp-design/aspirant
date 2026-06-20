// Theme + text-size preferences, applied to <html> via data attributes so CSS
// can react. Stored on-device; applied immediately on import to avoid a flash.

export type Theme = 'light' | 'dark' | 'auto'
export type FontScale = 'normal' | 'large' | 'xl'

const THEME_KEY = 'aspirant.theme'
const FONT_KEY = 'aspirant.font'

export function getTheme(): Theme {
  const v = localStorage.getItem(THEME_KEY)
  return v === 'light' || v === 'dark' || v === 'auto' ? v : 'auto'
}

export function getFontScale(): FontScale {
  const v = localStorage.getItem(FONT_KEY)
  return v === 'large' || v === 'xl' ? v : 'normal'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = resolveTheme(theme)
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme)
  applyTheme(theme)
}

export function applyFontScale(scale: FontScale): void {
  document.documentElement.dataset.font = scale
}

export function setFontScale(scale: FontScale): void {
  localStorage.setItem(FONT_KEY, scale)
  applyFontScale(scale)
}

// Apply saved prefs at startup, and keep 'auto' in sync with the OS theme.
export function initSettings(): void {
  applyTheme(getTheme())
  applyFontScale(getFontScale())
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'auto') applyTheme('auto')
  })
}
