import { Component } from "react"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error("Error no controlado en AulaConecta:", error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 dark:bg-slate-950">
        <section className="w-full max-w-lg rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
            <AlertTriangle size={31} />
          </span>
          <h1 className="mt-6 text-2xl font-black text-slate-950 dark:text-white">
            Algo no salió como esperábamos
          </h1>
          <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
            La aplicación evitó cerrarse por completo. Puedes volver a intentar o regresar al inicio.
          </p>
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-5 max-h-36 overflow-auto rounded-2xl bg-slate-950 p-4 text-left text-xs text-slate-200">
              {this.state.error.message}
            </pre>
          )}
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
            >
              <RefreshCw size={18} />
              Intentar nuevamente
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Home size={18} />
              Ir al inicio
            </a>
          </div>
        </section>
      </main>
    )
  }
}

export default ErrorBoundary
