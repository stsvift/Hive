import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('React ErrorBoundary caught an error:', error, errorInfo)
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div
          style={{
            padding: '20px',
            margin: '20px',
            backgroundColor: '#feeeee',
            color: '#ea4335',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h2>Что-то пошло не так 😕</h2>
          <p>Произошла ошибка при загрузке компонента.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ea4335',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              marginTop: '15px',
              cursor: 'pointer',
            }}
          >
            Перезагрузить страницу
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
