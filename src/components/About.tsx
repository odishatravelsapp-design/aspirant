import { useT } from '../i18n/LanguageContext'

// Disclaimer + privacy + attribution. Important for a public launch: avoids
// trademark/impersonation issues and satisfies CC-BY-SA attribution + Google
// login's privacy-policy requirement.
export function About({ version }: { version: string }) {
  const { t } = useT()
  return (
    <div className="screen">
      <h2 style={{ marginTop: 0 }}>{t('about.title')}</h2>
      <p className="muted">v{version}</p>

      <div className="card">
        <strong>{t('about.disclaimerTitle')}</strong>
        <p style={{ marginTop: 6 }}>{t('about.disclaimer')}</p>
      </div>

      <div className="card">
        <strong>{t('about.privacyTitle')}</strong>
        <p style={{ marginTop: 6 }}>{t('about.privacy')}</p>
      </div>

      <div className="card">
        <strong>{t('about.creditsTitle')}</strong>
        <p style={{ marginTop: 6 }}>{t('about.credits')}</p>
      </div>

      <p className="muted center" style={{ fontSize: '0.85rem' }}>{t('about.madeWith')}</p>
    </div>
  )
}
