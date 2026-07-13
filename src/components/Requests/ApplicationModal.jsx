import { useEffect, useState } from "react"
import { Send, X } from "lucide-react"
import { createTutorApplication } from "../../services/requestService"

function ApplicationModal({ request, onClose, onSuccess }) {
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscape)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [onClose])

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage("")

    if (message.trim().length < 15) {
      setErrorMessage(
        "Escribe un mensaje de al menos 15 caracteres.",
      )
      return
    }

    setSubmitting(true)

    try {
      await createTutorApplication(request.id, message)

      if (onSuccess) {
        onSuccess("Postulación enviada correctamente.")
      }

      onClose()
    } catch (error) {
      console.error(error)
      setErrorMessage(
        error.message || "No se pudo enviar la postulación.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-5 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Cerrar ventana"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />

      <section className="relative z-10 w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Postulación
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Quiero ayudar
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={22} />
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">
            Solicitud seleccionada
          </p>

          <h3 className="mt-1 font-bold text-slate-900">
            {request.title}
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            {request.subject?.name}
          </p>
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6">
          <label
            htmlFor="applicationMessage"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Mensaje para el estudiante
          </label>

          <textarea
            id="applicationMessage"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={6}
            maxLength={500}
            placeholder="Explica brevemente por qué puedes ayudarle y cuál es tu experiencia con el tema."
            className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <p className="mt-2 text-right text-xs text-slate-400">
            {message.length}/500
          </p>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              <Send size={18} />
              {submitting
                ? "Enviando..."
                : "Enviar postulación"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ApplicationModal