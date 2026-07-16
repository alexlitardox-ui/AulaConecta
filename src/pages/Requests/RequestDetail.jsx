import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Laptop,
  LoaderCircle,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  Users,
  XCircle,
} from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import ReportButton from "../../components/Reports/ReportButton"

import {
  acceptTutorApplication,
  cancelTutorRequest,
  getTutorRequestById,
} from "../../services/requestService"

const statusInformation = {
  open: {
    label: "Abierta",
    styles: "border-emerald-200 bg-emerald-50 text-emerald-700",
    description: "La solicitud está disponible para recibir postulaciones.",
  },
  with_applications: {
    label: "Con postulaciones",
    styles: "border-amber-200 bg-amber-50 text-amber-700",
    description: "Ya existen estudiantes interesados en ayudar.",
  },
  accepted: {
    label: "Tutor asignado",
    styles: "border-blue-200 bg-blue-50 text-blue-700",
    description: "Se seleccionó un tutor para esta solicitud.",
  },
  cancelled: {
    label: "Cancelada",
    styles: "border-red-200 bg-red-50 text-red-700",
    description: "La solicitud fue cancelada por su autor.",
  },
  closed: {
    label: "Cerrada",
    styles: "border-slate-200 bg-slate-100 text-slate-700",
    description: "Esta solicitud ya no recibe postulaciones.",
  },
}

const applicationStatus = {
  pending: {
    label: "Pendiente",
    styles: "bg-amber-50 text-amber-700",
  },
  accepted: {
    label: "Aceptada",
    styles: "bg-emerald-50 text-emerald-700",
  },
  rejected: {
    label: "No seleccionada",
    styles: "bg-slate-100 text-slate-600",
  },
}

function formatDate(date) {
  if (!date) return "Por definir"

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`))
}

function formatDateTime(date) {
  if (!date) return ""

  return new Intl.DateTimeFormat("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function formatTime(time) {
  return time?.slice(0, 5) || "--:--"
}

function getInitials(profile, fallback = "AC") {
  if (!profile) return fallback

  return `${profile.first_name?.charAt(0) || ""}${
    profile.last_name?.charAt(0) || ""
  }`.toUpperCase() || fallback
}

function ProfileAvatar({ profile, fallback, size = "h-14 w-14" }) {
  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={`${profile.first_name || "Usuario"} ${profile.last_name || ""}`}
        className={`${size} shrink-0 rounded-2xl object-cover ring-4 ring-white`}
      />
    )
  }

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white shadow-lg shadow-blue-200`}
    >
      {getInitials(profile, fallback)}
    </div>
  )
}

function RequestDetail() {
  const { requestId } = useParams()
  const navigate = useNavigate()

  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [acceptingId, setAcceptingId] = useState(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const loadRequest = useCallback(async ({ showLoader = true } = {}) => {
    if (showLoader) setLoading(true)

    try {
      const data = await getTutorRequestById(requestId)
      setRequest(data)
    } catch (error) {
      console.error(error)
      setRequest(null)
      setMessage(error.message || "No se pudo cargar la solicitud.")
      setMessageType("error")
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    loadRequest()
  }, [loadRequest])

  const applications = useMemo(
    () => request?.applications ?? [],
    [request?.applications],
  )

  const pendingApplications = useMemo(
    () => applications.filter((application) => application.status === "pending"),
    [applications],
  )

  const acceptedApplication = useMemo(
    () => applications.find((application) => application.status === "accepted"),
    [applications],
  )

  async function handleCancel() {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas cancelar esta solicitud?",
    )

    if (!confirmed) return

    setCancelling(true)
    setMessage("")

    try {
      await cancelTutorRequest(requestId)
      setMessage("Solicitud cancelada correctamente.")
      setMessageType("success")
      await loadRequest({ showLoader: false })
    } catch (error) {
      console.error(error)
      setMessage(error.message || "No se pudo cancelar la solicitud.")
      setMessageType("error")
    } finally {
      setCancelling(false)
    }
  }

  async function handleAccept(application) {
    const tutorName = application.tutor
      ? `${application.tutor.first_name} ${application.tutor.last_name}`
      : "este tutor"

    const confirmed = window.confirm(
      `¿Deseas aceptar a ${tutorName}? Las demás postulaciones dejarán de estar disponibles.`,
    )

    if (!confirmed) return

    setAcceptingId(application.id)
    setMessage("")

    try {
      await acceptTutorApplication(application.id)
      setMessage(
        `Aceptaste a ${tutorName}. La tutoría fue registrada correctamente.`,
      )
      setMessageType("success")
      await loadRequest({ showLoader: false })
    } catch (error) {
      console.error(error)
      setMessage(error.message || "No se pudo aceptar esta postulación.")
      setMessageType("error")
    } finally {
      setAcceptingId(null)
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center px-5">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-blue-600" size={46} />
          <p className="mt-4 font-semibold text-slate-600">Cargando solicitud...</p>
          <p className="mt-1 text-sm text-slate-400">Estamos preparando todos los detalles.</p>
        </div>
      </main>
    )
  }

  if (!request) {
    return (
      <main className="px-5 py-8 sm:px-8">
        <section className="mx-auto max-w-3xl rounded-[2rem] border border-red-100 bg-white p-10 text-center shadow-sm">
          <AlertCircle className="mx-auto text-red-500" size={42} />
          <h1 className="mt-5 text-2xl font-black text-slate-900">Solicitud no encontrada</h1>
          <p className="mx-auto mt-3 max-w-lg text-slate-600">
            Es posible que haya sido eliminada o que no tengas permiso para verla.
          </p>
          <Link
            to="/dashboard/solicitudes"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            <ArrowLeft size={18} />
            Volver a solicitudes
          </Link>
        </section>
      </main>
    )
  }

  const status = statusInformation[request.status] || statusInformation.closed
  const studentName = request.student
    ? `${request.student.first_name} ${request.student.last_name}`
    : "Estudiante"
  const canCancel =
    request.isOwnRequest && ["open", "with_applications"].includes(request.status)
  const isVirtualLink =
    request.modality === "virtual" &&
    /^https?:\/\//i.test(request.location_or_link || "")

  return (
    <main className="px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white hover:text-blue-700 hover:shadow-sm"
        >
          <ArrowLeft size={18} />
          Volver
        </button>

        {!request.isOwnRequest && <div className="mt-3 flex justify-end"><ReportButton entityType="request" entityId={request.id} /></div>}

        {message && (
          <div
            role="alert"
            className={`mt-5 flex items-start gap-3 rounded-2xl border px-4 py-4 text-sm font-medium ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            ) : (
              <AlertCircle className="mt-0.5 shrink-0" size={20} />
            )}
            <span>{message}</span>
          </div>
        )}

        <section className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_370px]">
          <div className="space-y-6">
            <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 px-6 py-8 text-white sm:px-9 sm:py-10">
                <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-400/20 blur-3xl" />
                <div className="absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />

                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur">
                        <BookOpen size={14} />
                        {request.subject?.code || "ASIGNATURA"} · {request.subject?.name || "Materia"}
                      </span>
                      {request.isOwnRequest && (
                        <span className="rounded-full border border-blue-300/30 bg-blue-300/15 px-3 py-1.5 text-xs font-bold text-blue-100">
                          Tu solicitud
                        </span>
                      )}
                    </div>

                    <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                      {request.title}
                    </h1>
                    <p className="mt-3 text-lg font-medium text-blue-100">
                      {request.topic}
                    </p>
                  </div>

                  <div className={`w-fit rounded-2xl border px-4 py-3 text-sm font-bold ${status.styles}`}>
                    <p>{status.label}</p>
                    <p className="mt-1 max-w-52 text-xs font-medium opacity-80">
                      {status.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-9">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <DetailItem icon={CalendarDays} label="Fecha" value={formatDate(request.requested_date)} />
                  <DetailItem
                    icon={Clock}
                    label="Horario"
                    value={`${formatTime(request.start_time)} - ${formatTime(request.end_time)}`}
                  />
                  <DetailItem
                    icon={request.modality === "virtual" ? Laptop : MapPin}
                    label="Modalidad"
                    value={request.modality === "virtual" ? "Virtual" : "Presencial"}
                  />
                  <DetailItem
                    icon={MapPin}
                    label="Lugar o plataforma"
                    value={request.location_or_link || "Por definir"}
                    link={isVirtualLink ? request.location_or_link : null}
                  />
                </div>

                <div className="mt-8 border-t border-slate-100 pt-8">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Contexto de ayuda</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-900">Descripción de la solicitud</h2>
                  <p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-slate-600">
                    {request.description || "El estudiante no añadió una descripción adicional."}
                  </p>
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-400">
                    Publicada el {formatDateTime(request.created_at)}
                  </p>

                  {canCancel && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {cancelling ? <LoaderCircle className="animate-spin" size={19} /> : <XCircle size={19} />}
                      {cancelling ? "Cancelando..." : "Cancelar solicitud"}
                    </button>
                  )}
                </div>
              </div>
            </article>

            {request.isOwnRequest && (
              <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Selección de tutor</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-900">Postulaciones recibidas</h2>
                    <p className="mt-2 text-slate-600">
                      Revisa la experiencia y el mensaje de cada estudiante antes de elegir.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <SummaryPill value={applications.length} label="Total" />
                    <SummaryPill value={pendingApplications.length} label="Pendientes" highlight />
                  </div>
                </div>

                {applications.length === 0 ? (
                  <div className="mt-7 flex min-h-56 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
                    <div className="rounded-2xl bg-blue-100 p-4 text-blue-600">
                      <MessageSquare size={30} />
                    </div>
                    <h3 className="mt-4 font-black text-slate-900">Todavía no existen postulaciones</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                      Cuando otro estudiante se postule para ayudarte, su información aparecerá aquí.
                    </p>
                  </div>
                ) : (
                  <div className="mt-7 space-y-4">
                    {applications.map((application) => {
                      const tutorName = application.tutor
                        ? `${application.tutor.first_name} ${application.tutor.last_name}`
                        : "Tutor"
                      const applicationInfo =
                        applicationStatus[application.status] || applicationStatus.pending
                      const isAccepted = application.status === "accepted"
                      const canAccept =
                        application.status === "pending" &&
                        ["open", "with_applications"].includes(request.status)

                      return (
                        <div
                          key={application.id}
                          className={`rounded-3xl border p-5 transition sm:p-6 ${
                            isAccepted
                              ? "border-emerald-200 bg-emerald-50/50"
                              : "border-slate-200 hover:border-blue-200 hover:shadow-md"
                          }`}
                        >
                          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                            <ProfileAvatar profile={application.tutor} fallback="TU" />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <h3 className="text-lg font-black text-slate-900">{tutorName}</h3>
                                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                    <span className="flex items-center gap-1 font-bold text-amber-600">
                                      <Star size={16} className="fill-amber-400 text-amber-400" />
                                      {Number(application.tutor?.rating ?? 5).toFixed(1)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <GraduationCap size={16} />
                                      {application.tutor?.completed_tutoring ?? 0} tutorías
                                    </span>
                                  </div>
                                </div>
                                <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${applicationInfo.styles}`}>
                                  {applicationInfo.label}
                                </span>
                              </div>

                              <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm leading-7 text-slate-600 ring-1 ring-slate-100">
                                {application.message || "No añadió un mensaje."}
                              </div>

                              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-slate-400">
                                  Recibida el {formatDateTime(application.created_at)}
                                </p>

                                {canAccept && (
                                  <button
                                    type="button"
                                    onClick={() => handleAccept(application)}
                                    disabled={acceptingId !== null}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                                  >
                                    {acceptingId === application.id ? (
                                      <LoaderCircle className="animate-spin" size={18} />
                                    ) : (
                                      <CheckCircle2 size={18} />
                                    )}
                                    {acceptingId === application.id ? "Aceptando..." : "Aceptar como tutor"}
                                  </button>
                                )}

                                {isAccepted && (
                                  <span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                                    <CheckCircle2 size={18} /> Tutor seleccionado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>
            )}
          </div>

          <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">Publicado por</p>
              <div className="mt-5 flex items-center gap-4">
                <ProfileAvatar profile={request.student} fallback="ES" />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black text-slate-900">{studentName}</h2>
                  <div className="mt-1 flex items-center gap-1 text-sm font-bold text-amber-600">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    {Number(request.student?.rating ?? 5).toFixed(1)}
                  </div>
                </div>
              </div>

              {request.student?.bio && (
                <p className="mt-5 text-sm leading-7 text-slate-600">{request.student.bio}</p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniStat
                  icon={GraduationCap}
                  value={request.student?.completed_tutoring ?? 0}
                  label="Tutorías"
                />
                <MiniStat
                  icon={Users}
                  value={applications.length}
                  label="Postulaciones"
                />
              </div>
            </article>

            {request.status === "accepted" && acceptedApplication && (
              <article className="rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-600 p-2.5 text-white">
                    <CheckCircle2 size={21} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Tutor confirmado</p>
                    <h2 className="mt-1 font-black text-slate-900">
                      {acceptedApplication.tutor
                        ? `${acceptedApplication.tutor.first_name} ${acceptedApplication.tutor.last_name}`
                        : "Tutor asignado"}
                    </h2>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  La sesión ya debe aparecer en la sección de tutorías. Desde allí podrás gestionar su progreso.
                </p>
                <Link
                  to="/dashboard/tutorias"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Ver mis tutorías
                  <ExternalLink size={17} />
                </Link>
              </article>
            )}

            <article className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-blue-600" size={24} />
                <h2 className="font-black text-slate-900">Seguridad y privacidad</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Evita publicar contraseñas, direcciones personales, números de tarjetas o información sensible dentro de la plataforma.
              </p>
            </article>
          </aside>
        </section>
      </div>
    </main>
  )
}

function DetailItem({ icon: Icon, label, value, link }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white p-2.5 text-blue-600 shadow-sm">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center gap-1 break-all font-bold text-blue-700 hover:underline"
            >
              Abrir enlace <ExternalLink size={15} />
            </a>
          ) : (
            <p className="mt-1 break-words font-bold text-slate-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryPill({ value, label, highlight = false }) {
  return (
    <div className={`rounded-2xl px-4 py-2 text-center ${highlight ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}>
      <p className="text-lg font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</p>
    </div>
  )
}

function MiniStat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <Icon className="text-blue-600" size={20} />
      <p className="mt-3 text-xl font-black text-slate-900">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{label}</p>
    </div>
  )
}

export default RequestDetail
