import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileWarning,
  Globe2,
  HardDrive,
  History,
  LockKeyhole,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react"

import { runAdminSecurityScan } from "../../services/securityService"

function scoreMeta(score) {
  if (score === null) {
    return {
      label: "Pendiente",
      text: "text-slate-600",
      ring: "border-slate-200 bg-slate-50",
    }
  }

  if (score >= 90) {
    return {
      label: "Protección sólida",
      text: "text-emerald-700",
      ring: "border-emerald-200 bg-emerald-50",
    }
  }

  if (score >= 70) {
    return {
      label: "Requiere mejoras",
      text: "text-amber-700",
      ring: "border-amber-200 bg-amber-50",
    }
  }

  return {
    label: "Riesgo elevado",
    text: "text-red-700",
    ring: "border-red-200 bg-red-50",
  }
}

function StatusIcon({ passed }) {
  return passed ? (
    <CheckCircle2 className="text-emerald-600" size={20} />
  ) : (
    <XCircle className="text-red-600" size={20} />
  )
}

function Metric({ icon: Icon, label, value, detail, danger = false }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p
            className={`mt-2 text-2xl font-black ${
              danger ? "text-red-600" : "text-slate-950 dark:text-white"
            }`}
          >
            {value}
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
        </div>
        <span
          className={`rounded-xl p-2.5 ${
            danger
              ? "bg-red-50 text-red-600 dark:bg-red-950/40"
              : "bg-blue-50 text-blue-600 dark:bg-blue-950/40"
          }`}
        >
          <Icon size={20} />
        </span>
      </div>
    </div>
  )
}

export default function SecurityPanel() {
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  async function loadSecurityScan() {
    setLoading(true)
    setError("")

    try {
      setScan(await runAdminSecurityScan())
    } catch (scanError) {
      console.error(scanError)
      setError(
        scanError.message || "No se pudo completar el análisis de seguridad.",
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSecurityScan()
  }, [])

  const meta = scoreMeta(scan?.score ?? null)
  const failedChecks = useMemo(
    () => scan?.checks?.filter((check) => !check.passed) ?? [],
    [scan],
  )

  if (loading && !scan) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="text-center">
          <RefreshCw className="mx-auto animate-spin text-blue-600" size={32} />
          <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Analizando la configuración de seguridad...
          </p>
        </div>
      </div>
    )
  }

  if (error && !scan) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-7 text-center text-red-700">
        <ShieldAlert className="mx-auto" size={38} />
        <h2 className="mt-4 text-xl font-black">No se pudo abrir Ciberseguridad</h2>
        <p className="mt-2 text-sm">{error}</p>
        <button
          type="button"
          onClick={loadSecurityScan}
          className="mt-5 rounded-xl bg-red-600 px-5 py-3 font-bold text-white"
        >
          Reintentar
        </button>
      </div>
    )
  }

  const overview = scan?.overview
  const tablesWithoutRls = overview?.rls?.tables_without_rls ?? []
  const publicBuckets = overview?.storage?.public_buckets ?? []
  const recentScans = overview?.recent_scans ?? []

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-xl md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em]">
              <LockKeyhole size={15} /> Solo administradores
            </span>
            <h2 className="mt-5 text-3xl font-black">Centro de Ciberseguridad</h2>
            <p className="mt-3 text-sm leading-7 text-blue-100">
              Comprueba las cabeceras HTTP, la Política de Seguridad de
              Contenido, RLS, Storage y la autorización administrativa. Este
              panel ayuda a detectar configuraciones débiles; no sustituye un
              firewall, un WAF ni la supervisión del proveedor de alojamiento.
            </p>
          </div>

          <div className={`min-w-52 rounded-3xl border p-5 ${meta.ring}`}>
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">
              Puntuación actual
            </p>
            <p className={`mt-2 text-5xl font-black ${meta.text}`}>
              {scan?.score ?? "—"}
              {scan?.score !== null && <span className="text-xl">/100</span>}
            </p>
            <p className={`mt-2 text-sm font-bold ${meta.text}`}>{meta.label}</p>
          </div>
        </div>
      </section>

      {(scan?.note || scan?.databaseWarning || error) && (
        <div className="space-y-3">
          {scan?.note && (
            <div className="flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              <Globe2 className="mt-0.5 shrink-0" size={19} />
              <span>{scan.note}</span>
            </div>
          )}
          {scan?.databaseWarning && (
            <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 shrink-0" size={19} />
              <span>{scan.databaseWarning}</span>
            </div>
          )}
          {error && (
            <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <XCircle className="mt-0.5 shrink-0" size={19} />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Database}
          label="Tablas sin RLS"
          value={overview ? tablesWithoutRls.length : "—"}
          detail="Las tablas públicas expuestas deben utilizar Row Level Security."
          danger={tablesWithoutRls.length > 0}
        />
        <Metric
          icon={HardDrive}
          label="Buckets públicos"
          value={overview ? publicBuckets.length : "—"}
          detail="Los archivos académicos sensibles deben servirse mediante URLs firmadas."
          danger={publicBuckets.length > 0}
        />
        <Metric
          icon={FileWarning}
          label="Reportes pendientes"
          value={overview?.activity?.pending_reports ?? "—"}
          detail="Casos de moderación que requieren revisión administrativa."
          danger={(overview?.activity?.pending_reports ?? 0) > 0}
        />
        <Metric
          icon={ShieldAlert}
          label="Cuentas suspendidas"
          value={overview?.activity?.suspended_users ?? "—"}
          detail="Cuentas bloqueadas por acciones administrativas."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                Cabeceras HTTP
              </p>
              <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
                Controles activos en Netlify
              </h3>
            </div>
            <button
              type="button"
              onClick={loadSecurityScan}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
              Analizar nuevamente
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {(scan?.checks ?? []).map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <StatusIcon passed={check.passed} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <b className="text-sm text-slate-900 dark:text-white">
                      {check.label}
                    </b>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                        check.passed
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {check.passed ? "Configurada" : "Revisar"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {check.detail}
                  </p>
                  <code className="mt-2 block max-h-24 overflow-auto rounded-xl bg-slate-950 px-3 py-2 text-[11px] text-slate-200">
                    {check.value}
                  </code>
                </div>
              </div>
            ))}

            {!scan?.checks?.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-700">
                Abre la página publicada en Netlify para comprobar las cabeceras
                HTTP reales.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
            Content Security Policy
          </p>
          <h3 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
            Directivas CSP esenciales
          </h3>

          <div className="mt-5 space-y-2">
            {(scan?.cspDirectives ?? []).map((item) => (
              <div
                key={item.directive}
                className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950"
              >
                <StatusIcon passed={item.configured} />
                <div className="min-w-0">
                  <code className="text-xs font-black text-slate-900 dark:text-white">
                    {item.directive}
                  </code>
                  <p className="mt-1 break-all text-[11px] text-slate-500">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}

            {!scan?.cspDirectives?.length && (
              <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                El detalle CSP estará disponible en la versión publicada.
              </p>
            )}
          </div>
        </article>
      </section>

      {overview && (
        <section className="grid gap-6 xl:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-600" size={24} />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                  Supabase
                </p>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                  Autorización y datos
                </h3>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                <span className="text-slate-500">Tablas públicas</span>
                <b>{overview.rls?.total_tables ?? 0}</b>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                <span className="text-slate-500">Tablas con RLS</span>
                <b>{overview.rls?.tables_with_rls ?? 0}</b>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                <span className="text-slate-500">Políticas RLS</span>
                <b>{overview.rls?.policy_count ?? 0}</b>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                <span className="text-slate-500">Funciones SECURITY DEFINER</span>
                <b>{overview.database?.security_definer_functions ?? 0}</b>
              </div>
            </div>

            {tablesWithoutRls.length > 0 && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <b>Tablas que requieren revisión:</b>
                <p className="mt-1 break-words">{tablesWithoutRls.join(", ")}</p>
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <div className="flex items-center gap-3">
              <History className="text-indigo-600" size={24} />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  Historial
                </p>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">
                  Análisis recientes
                </h3>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {recentScans.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950"
                >
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">
                      Puntuación {item.score}/100
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleString("es-EC")}
                    </p>
                  </div>
                  <ShieldCheck
                    className={item.score >= 90 ? "text-emerald-600" : "text-amber-600"}
                    size={24}
                  />
                </div>
              ))}

              {!recentScans.length && (
                <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                  El historial se llenará al ejecutar análisis desde este panel.
                </p>
              )}
            </div>
          </article>
        </section>
      )}

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900 sm:p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0" size={22} />
          <div>
            <h3 className="font-black">Alcance real del panel</h3>
            <p className="mt-2 text-sm leading-6">
              CSP reduce el riesgo de XSS e inyección de contenido, pero no
              elimina por sí sola todos los ataques. La protección completa
              depende también de RLS, validación de archivos, gestión de
              dependencias, HTTPS, controles de Netlify y revisión de eventos.
              Un panel del frontend no puede bloquear ataques DDoS ni sustituir
              un WAF.
            </p>
            {failedChecks.length > 0 && (
              <p className="mt-3 text-sm font-bold">
                Controles pendientes: {failedChecks.map((item) => item.label).join(", ")}.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
