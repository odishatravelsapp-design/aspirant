import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useT } from '../i18n/LanguageContext'

// Dismissible "Add to Home Screen" banner shown once, to boost adoption and
// guarantee offline caching for rural users.
export function InstallPrompt() {
  const { canShow, isIOS, hasPrompt, install, dismiss } = useInstallPrompt()
  const { t } = useT()

  if (!canShow) return null

  return (
    <div className="install-prompt" role="dialog" aria-label={t('install.title')}>
      <span className="emoji">📲</span>
      <div className="install-text">
        <strong>{t('install.title')}</strong>
        <span>{isIOS && !hasPrompt ? t('install.iosHint') : t('install.subtitle')}</span>
      </div>
      <div className="install-actions">
        {hasPrompt && (
          <button className="install-cta" onClick={install}>
            {t('install.action')}
          </button>
        )}
        <button className="install-x" onClick={dismiss} aria-label={t('install.dismiss')}>
          {t('install.dismiss')}
        </button>
      </div>
    </div>
  )
}
