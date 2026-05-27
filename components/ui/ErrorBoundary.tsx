'use client'
// Error Boundary React — intercepte les erreurs de rendu et affiche un fallback propre

import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props   { children: ReactNode; fallback?: ReactNode }
interface State   { hasError: boolean; message: string }

/** React class component that catches render errors and displays a fallback UI; logs errors to the console. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error('[ErrorBoundary]', error, info)
  }

  reset = () => this.setState({ hasError: false, message: '' })

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="size-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertTriangle className="size-6 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">Une erreur est survenue</h3>
        <p className="text-sm text-zinc-400 max-w-xs mb-6">{this.state.message || 'Quelque chose s\'est mal passé.'}</p>
        <button
          onClick={this.reset}
          className="px-4 py-2 rounded-lg bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }
}
