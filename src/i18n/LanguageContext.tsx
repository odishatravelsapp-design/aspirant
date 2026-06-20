import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { TRANSLATIONS, type LangCode } from './translations'

const STORAGE_KEY = 'aspirant.lang'

type TFn = (key: string, params?: Record<string, string | number>) => string

interface LangContextValue {
  lang: LangCode
  setLang: (l: LangCode) => void
  t: TFn
}

const LangContext = createContext<LangContextValue | null>(null)

function initialLang(): LangCode {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'en' || saved === 'or') return saved
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(initialLang)

  const setLang = useCallback((l: LangCode) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l
  }, [])

  // Translate with {placeholder} interpolation; falls back to English, then the key.
  const t = useCallback<TFn>(
    (key, params) => {
      const dict = TRANSLATIONS[lang]
      let str = dict[key] ?? TRANSLATIONS.en[key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        }
      }
      return str
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useT(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useT must be used within LanguageProvider')
  return ctx
}
