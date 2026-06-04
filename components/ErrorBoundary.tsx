"use client"

import React from "react"
import { logger } from "@/lib/logger"

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, info: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logger.error("React ErrorBoundary caught", {
      error:     error.message,
      stack:     error.stack,
      component: info.componentStack ?? "",
    })
    this.props.onError?.(error, info)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="glass rounded-2xl p-8 max-w-sm w-full text-center space-y-4 border border-red-500/20">
            <div className="text-5xl" role="img" aria-label="Error">😔</div>
            <h2 className="font-display text-xl font-bold text-fairy-text">Something went wrong</h2>
            <p className="text-fairy-text-muted text-sm">
              An unexpected error occurred. Your diary data is safe.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-xs text-red-400 text-left bg-red-500/5 rounded-lg p-3 overflow-auto max-h-32 border border-red-500/20">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 glass rounded-xl py-2 text-sm text-fairy-text hover:bg-fairy-purple/20 border border-fairy-border transition-colors"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => window.location.href = "/"}
                className="flex-1 glass rounded-xl py-2 text-sm text-fairy-text hover:bg-fairy-purple/20 border border-fairy-border transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/** Lightweight functional wrapper for simpler cases */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode,
) {
  const Wrapped = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  Wrapped.displayName = `withErrorBoundary(${Component.displayName ?? Component.name})`
  return Wrapped
}
