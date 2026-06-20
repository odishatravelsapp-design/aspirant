import { useAuth } from '../hooks/useAuth'
import { useT } from '../i18n/LanguageContext'

// Compact sign-in / account control for the topbar. Renders nothing when cloud
// sync is not configured, so the app stays purely local by default.
export function AccountButton() {
  const { enabled, user, signInWithGoogle, signOut } = useAuth()
  const { t } = useT()

  if (!enabled) return null

  if (!user) {
    return (
      <button className="lang-select" onClick={signInWithGoogle} title={t('auth.signInHint')}>
        {t('auth.signIn')}
      </button>
    )
  }

  const initial = (user.email ?? '?').charAt(0).toUpperCase()
  return (
    <button className="account-chip" onClick={signOut} title={`${user.email} — ${t('auth.signOut')}`}>
      {initial}
    </button>
  )
}
