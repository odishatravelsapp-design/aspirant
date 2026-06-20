import { useEffect, useState } from 'react'

// Tracks connectivity so the UI can reassure rural users they can keep working offline.
export function useOnline(): boolean {
  const [online, setOnline] = useState<boolean>(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}
