import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BadgeCheck,
  BookOpen,
  Camera,
  CheckCircle2,
  GraduationCap,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  Star,
  User,
} from "lucide-react"
import { Link, useOutletContext } from "react-router-dom"

import { uploadAvatar } from "../../services/avatarService"
import { ensureCurrentProfile } from "../../services/profileService"
import { getMyReviews } from "../../services/reputationService"
import { supabase } from "../../services/supabase"

function Profile() {
  const { user } = useOutletContext()

  const [careers, setCareers] = useState([])
  const [semesters, setSemesters] = useState([])
  const [reviews, setReviews] = useState([])

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    careerId: "",
    semesterId: "",
    bio: "",
  })

  const [avatarUrl, setAvatarUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  useEffect(() => {
    if (!user) return

    async function loadProfile() {
      setLoading(true)
      setMessage("")
      setMessageType("")

      const [profileResult, careersResult, semestersResult, reviewsResult] =
        await Promise.allSettled([
          ensureCurrentProfile(),
          supabase
            .from("careers")
            .select("id, name")
            .eq("is_active", true)
            .order("name"),
          supabase
            .from("semesters")
            .select("id, name, level")
            .eq("is_active", true)
            .order("level"),
          getMyReviews(),
        ])

      if (
        profileResult.status === "rejected" ||
        profileResult.value?.error
      ) {
        console.error(
          profileResult.status === "rejected"
            ? profileResult.reason
            : profileResult.value?.error,
        )
        setMessage("No se pudo cargar el perfil.")
        setMessageType("error")
        setLoading(false)
        return
      }

      const profile = profileResult.value?.data ?? profileResult.value
      const careersData =
        careersResult.status === "fulfilled" && !careersResult.value.error
          ? careersResult.value.data ?? []
          : []
      const semestersData =
        semestersResult.status === "fulfilled" &&
        !semestersResult.value.error
          ? semestersResult.value.data ?? []
          : []

      setCareers(careersData)
      setSemesters(semestersData)
      setReviews(
        reviewsResult.status === "fulfilled" ? reviewsResult.value : [],
      )

      setFormData({
        firstName: profile.first_name ?? "",
        lastName: profile.last_name ?? "",
        careerId: profile.career_id?.toString() ?? "",
        semesterId: profile.semester_id?.toString() ?? "",
        bio: profile.bio ?? "",
      })
      setAvatarUrl(profile.avatar_url ?? "")
      setLoading(false)
    }

    loadProfile()
  }, [user])

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((currentData) => ({ ...currentData, [name]: value }))
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    setMessage("")
    setMessageType("")

    try {
      const url = await uploadAvatar(file)
      setAvatarUrl(url)
      setMessage("Fotografía actualizada correctamente.")
      setMessageType("success")
    } catch (error) {
      console.error(error)
      setMessage(error.message || "No se pudo subir la fotografía.")
      setMessageType("error")
    } finally {
      setUploadingAvatar(false)
      event.target.value = ""
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage("")
    setMessageType("")

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.careerId ||
      !formData.semesterId
    ) {
      setMessage("Completa los campos obligatorios.")
      setMessageType("error")
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          career_id: Number(formData.careerId),
          semester_id: Number(formData.semesterId),
          bio: formData.bio.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          career_id: Number(formData.careerId),
          semester_id: Number(formData.semesterId),
          avatar_url: avatarUrl || null,
        },
      })

      if (metadataError) {
        setMessage(
          "El perfil se guardó, pero no se actualizó la información de la sesión.",
        )
        setMessageType("error")
        return
      }

      setMessage("Perfil actualizado correctamente.")
      setMessageType("success")
    } catch (error) {
      console.error(error)
      setMessage("No se pudieron guardar los cambios.")
      setMessageType("error")
    } finally {
      setSaving(false)
    }
  }

  const careerName =
    careers.find((career) => String(career.id) === formData.careerId)?.name ||
    "Carrera pendiente"
  const semesterName =
    semesters.find(
      (semester) => String(semester.id) === formData.semesterId,
    )?.name || "Semestre pendiente"

  const rating = useMemo(() => {
    if (reviews.length === 0) return 0
    return (
      reviews.reduce((total, review) => total + Number(review.rating || 0), 0) /
      reviews.length
    )
  }, [reviews])

  const profileCompletion = useMemo(() => {
    const fields = [
      formData.firstName.trim(),
      formData.lastName.trim(),
      formData.careerId,
      formData.semesterId,
      formData.bio.trim(),
      avatarUrl,
    ]
    return Math.round((fields.filter(Boolean).length / fields.length) * 100)
  }, [formData, avatarUrl])

  const initials = `${formData.firstName.charAt(0)}${formData.lastName.charAt(
    0,
  )}`.toUpperCase()

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
          <p className="mt-4 font-medium text-slate-600">Cargando perfil...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 py-6 sm:px-7 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-6 py-8 text-white shadow-2xl shadow-blue-200/50 sm:px-9 sm:py-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="relative mx-auto sm:mx-0">
                <div className="h-28 w-28 overflow-hidden rounded-[2rem] border-4 border-white/20 bg-gradient-to-br from-blue-500 to-violet-600 shadow-xl">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={`Fotografía de ${formData.firstName}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold">
                      {initials || <User size={38} />}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-slate-950 bg-emerald-500 text-white">
                  <BadgeCheck size={20} />
                </span>
              </div>

              <div className="text-center sm:text-left">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">
                  Perfil académico
                </p>
                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                  {formData.firstName} {formData.lastName}
                </h1>
                <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm text-slate-200 sm:justify-start">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                    <GraduationCap size={16} /> {careerName}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                    <BookOpen size={16} /> {semesterName}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center backdrop-blur">
                <p className="text-2xl font-bold">
                  {reviews.length > 0 ? rating.toFixed(1) : "—"}
                </p>
                <p className="mt-1 text-xs text-blue-100">Reputación</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center backdrop-blur">
                <p className="text-2xl font-bold">{reviews.length}</p>
                <p className="mt-1 text-xs text-blue-100">Reseñas</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-center backdrop-blur">
                <p className="text-2xl font-bold">{profileCompletion}%</p>
                <p className="mt-1 text-xs text-blue-100">Completado</p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div
            role="alert"
            className={`mt-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 size={19} />
            ) : (
              <AlertCircle size={19} />
            )}
            {message}
          </div>
        )}

        <section className="mt-6 grid gap-6 xl:grid-cols-[340px_1fr]">
          <aside className="space-y-6">
            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Estado del perfil
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {profileCompletion}% completo
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Sparkles size={24} />
                </div>
              </div>

              <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-600 transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-500">
                Completa tu fotografía y descripción para generar más confianza en la comunidad.
              </p>
            </article>

            <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-slate-900">Información visible</h2>
              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 text-blue-600" size={19} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Correo
                    </p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-700">
                      {user?.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 text-emerald-600" size={19} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Estado
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      Cuenta académica activa
                    </p>
                  </div>
                </div>
              </div>

              <Link
                to="/dashboard/reputacion"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Star size={18} /> Ver reputación completa
              </Link>
            </article>
          </aside>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                  Información personal
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  Editar perfil
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Estos datos aparecerán en tus solicitudes y tutorías.
                </p>
              </div>

              <label
                className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  uploadingAvatar
                    ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    : "cursor-pointer border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                }`}
              >
                <Camera size={18} />
                {uploadingAvatar ? "Subiendo..." : "Cambiar fotografía"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                  className="hidden"
                />
              </label>
            </div>

            <form onSubmit={handleSubmit} className="mt-7 grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombres
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="mb-2 block text-sm font-semibold text-slate-700">
                  Apellidos
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="careerId" className="mb-2 block text-sm font-semibold text-slate-700">
                  Carrera
                </label>
                <select
                  id="careerId"
                  name="careerId"
                  value={formData.careerId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Selecciona una carrera</option>
                  {careers.map((career) => (
                    <option key={career.id} value={career.id}>
                      {career.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="semesterId" className="mb-2 block text-sm font-semibold text-slate-700">
                  Semestre
                </label>
                <select
                  id="semesterId"
                  name="semesterId"
                  value={formData.semesterId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Selecciona un semestre</option>
                  {semesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label htmlFor="bio" className="text-sm font-semibold text-slate-700">
                    Descripción académica
                  </label>
                  <span className="text-xs font-medium text-slate-400">
                    {formData.bio.length}/300
                  </span>
                </div>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  maxLength={300}
                  rows={6}
                  placeholder="Cuéntanos sobre tus intereses, conocimientos y materias favoritas."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="md:col-span-2 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-slate-400">
                  La fotografía admite JPG, PNG o WEBP de hasta 2 MB.
                </p>
                <button
                  type="submit"
                  disabled={saving || uploadingAvatar}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={19} />
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </section>
        </section>
      </div>
    </main>
  )
}

export default Profile
