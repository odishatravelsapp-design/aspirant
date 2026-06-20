import { Component, type ErrorInfo, type ReactNode } from 'react'

// Catches render-time crashes so users see a friendly message + reload, not a
// blank white screen. Kept dependency-free (static text) so it works even if the
// language/provider layer is what failed.
export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Aspirant crashed:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="screen center" style={{ paddingTop: 60 }}>
          <div style={{ fontSize: '2.5rem' }}>😕</div>
          <h2>Something went wrong</h2>
          <p className="muted">Please reload the app. Your saved progress is safe.</p>
          <button className="btn" onClick={() => window.location.reload()} style={{ maxWidth: 240, margin: '12px auto 0' }}>
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
