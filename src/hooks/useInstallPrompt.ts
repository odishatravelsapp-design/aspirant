import { useEffect, useState } from 'react'

// Captures the browser's PWA install event so we can offer a friendly
// "Add to Home Screen" prompt. iOS Safari has no event, so we detect it to
// show manual instructions instead.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'aspirant.installDismissed.v1'

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState<boolean>(
    () => localStorage.getItem(DISMISS_KEY) === '1',
  )

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true

  const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
  }

  function dismiss() {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  // Show when: not already installed, not dismissed, and either we have a
  // deferred prompt (Android/Chrome) or we're on iOS (manual instructions).
  const canShow = !isStandalone && !dismissed && (!!deferred || isIOS)

  return { canShow, isIOS, hasPrompt: !!deferred, install, dismiss }
}
