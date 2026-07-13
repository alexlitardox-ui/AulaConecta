import { useEffect, useState } from "react"
import { Send, Star, X } from "lucide-react"

import { createReview } from "../../services/reviewService"

const initialFormData = {
  rating: 5,
  clarity: 5,
  punctuality: 5,
  respect: 5,
  comment: "",
}

function StarSelector({ label, value, onChange }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">
        {label}
      </p>

      <div className="mt-2 flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded-lg p-1 transition hover:scale-110"
            aria-label={`${star} estrellas`}
          >
            <Star
              size={27}
              className={
                star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-300"
              }
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function ReviewModal({
  session,
  onClose,
  onSuccess,
}) {
  const [formData, setFormData] =
    useState(initialFormData)

  const [submitting, setSubmitting] =
    useState(false)

  const [message, setMessage] = useState("")

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    )

    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      )

      document.body.style.overflow = ""
    }
  }, [onClose])

  function updateRating(field, value) {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setSubmitting(true)
    setMessage("")

    try {
      await createReview({
        session,
        rating: formData.rating,
        clarity: formData.clarity,
        punctuality: formData.punctuality,
        respect: formData.respect,
        comment: formData.comment,
      })

      if (onSuccess) {
        onSuccess(
          "Calificación enviada correctamente.",
        )
      }

      onClose()
    } catch (error) {
      console.error(error)

      setMessage(
        error.message ||
          "No se pudo guardar la calificación.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const otherPerson =
    session.currentUserRole === "student"
      ? session.tutor
      : session.student

  const otherPersonName = otherPerson
    ? `${otherPerson.first_name} ${otherPerson.last_name}`
    : "Estudiante"

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-5 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Cerrar ventana"
        onClick={onClose}
        className="absolute inset-0"
      />

      <section className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Reputación académica
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Calificar tutoría
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Estás calificando a {otherPersonName}.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X size={22} />
          </button>
        </div>

        {message && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-7 space-y-6"
        >
          <StarSelector
            label="Calificación general"
            value={formData.rating}
            onChange={(value) =>
              updateRating("rating", value)
            }
          />

          <StarSelector
            label="Claridad de la explicación"
            value={formData.clarity}
            onChange={(value) =>
              updateRating("clarity", value)
            }
          />

          <StarSelector
            label="Puntualidad"
            value={formData.punctuality}
            onChange={(value) =>
              updateRating(
                "punctuality",
                value,
              )
            }
          />

          <StarSelector
            label="Respeto y trato"
            value={formData.respect}
            onChange={(value) =>
              updateRating("respect", value)
            }
          />

          <div>
            <label
              htmlFor="reviewComment"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Comentario
            </label>

            <textarea
              id="reviewComment"
              value={formData.comment}
              onChange={(event) =>
                setFormData((currentData) => ({
                  ...currentData,
                  comment: event.target.value,
                }))
              }
              maxLength={500}
              rows={5}
              placeholder="Describe brevemente tu experiencia durante la tutoría."
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />

            <p className="mt-2 text-right text-xs text-slate-400">
              {formData.comment.length}/500
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                : "Enviar calificación"}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default ReviewModal