import React from 'react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-shell">
          <div className="card-surface px-6 py-8 text-center">
            <h2 className="font-display text-2xl text-stone-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-stone-600">
              The page could not render. Please refresh and try again.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
