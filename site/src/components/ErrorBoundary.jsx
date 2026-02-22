import { Component } from 'react'
import styles from './ErrorBoundary.module.css'

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className={styles.fallback}>
          <p className={styles.message}>Something went wrong.</p>
          <p className={styles.detail}>{this.state.error?.message ?? 'Unknown error'}</p>
          <button
            type="button"
            className={styles.retry}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try again
          </button>
        </section>
      )
    }
    return this.props.children
  }
}
