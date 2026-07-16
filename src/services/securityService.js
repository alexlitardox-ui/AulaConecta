import { supabase } from "./supabase"

const SECURITY_OVERVIEW_RPC = "admin_security_overview"
const RECORD_SECURITY_SCAN_RPC = "admin_record_security_scan"

const REQUIRED_CSP_DIRECTIVES = [
  "default-src",
  "base-uri",
  "form-action",
  "object-src",
  "frame-ancestors",
  "script-src",
  "style-src",
  "img-src",
  "font-src",
  "connect-src",
]

function normalizeHeader(value) {
  return String(value ?? "").trim()
}

function parseCsp(value) {
  return normalizeHeader(value)
    .split(";")
    .map((directive) => directive.trim())
    .filter(Boolean)
    .reduce((result, directive) => {
      const [name, ...sources] = directive.split(/\s+/)

      if (name) {
        result[name] = sources
      }

      return result
    }, {})
}

function makeCheck({
  id,
  label,
  value,
  passed,
  severity = "high",
  detail,
}) {
  return {
    id,
    label,
    value: value || "No configurada",
    passed: Boolean(passed),
    severity,
    detail,
  }
}

function getRpcErrorMessage(error) {
  if (!error) return "Error desconocido."

  return (
    error.message ||
    error.details ||
    error.hint ||
    error.code ||
    "Error desconocido."
  )
}

function normalizeOverview(data) {
  if (Array.isArray(data)) {
    return data[0] ?? null
  }

  return data ?? null
}

async function requireStrictAdmin() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error("No existe una sesión activa.")

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) throw profileError

  const isAdmin = Boolean(
    profile?.is_admin || profile?.role === "admin",
  )

  if (!isAdmin) {
    throw new Error(
      "Solo los administradores pueden acceder al panel de ciberseguridad.",
    )
  }

  return user
}

async function readLiveHeaders() {
  const isLocal = ["localhost", "127.0.0.1"].includes(
    window.location.hostname,
  )

  if (isLocal) {
    return {
      isLocal: true,
      headers: new Headers(),
      status: 0,
    }
  }

  const response = await fetch(window.location.href, {
    method: "GET",
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "Cache-Control": "no-cache",
    },
  })

  return {
    isLocal: false,
    headers: response.headers,
    status: response.status,
  }
}

function evaluateHeaders({ headers, isLocal }) {
  if (isLocal) {
    return {
      checks: [],
      cspDirectives: [],
      note:
        "En desarrollo local Vite no aplica las cabeceras de Netlify. La validación completa debe ejecutarse en la URL pública.",
    }
  }

  const csp = normalizeHeader(
    headers.get("content-security-policy"),
  )
  const xFrameOptions = normalizeHeader(
    headers.get("x-frame-options"),
  )
  const contentTypeOptions = normalizeHeader(
    headers.get("x-content-type-options"),
  )
  const hsts = normalizeHeader(
    headers.get("strict-transport-security"),
  )
  const referrerPolicy = normalizeHeader(
    headers.get("referrer-policy"),
  )
  const permissionsPolicy = normalizeHeader(
    headers.get("permissions-policy"),
  )
  const coop = normalizeHeader(
    headers.get("cross-origin-opener-policy"),
  )
  const corp = normalizeHeader(
    headers.get("cross-origin-resource-policy"),
  )

  const parsedCsp = parseCsp(csp)

  const checks = [
    makeCheck({
      id: "https",
      label: "Conexión HTTPS",
      value: window.location.protocol,
      passed: window.location.protocol === "https:",
      severity: "critical",
      detail:
        "Evita que credenciales y sesiones viajen sin cifrado.",
    }),
    makeCheck({
      id: "csp",
      label: "Content-Security-Policy",
      value: csp,
      passed: Boolean(csp),
      severity: "critical",
      detail:
        "Restringe las fuentes de scripts, estilos, imágenes y conexiones.",
    }),
    makeCheck({
      id: "frame",
      label: "Protección contra clickjacking",
      value:
        xFrameOptions ||
        parsedCsp["frame-ancestors"]?.join(" "),
      passed:
        ["DENY", "SAMEORIGIN"].includes(
          xFrameOptions.toUpperCase(),
        ) ||
        parsedCsp["frame-ancestors"]?.includes("'none'"),
      severity: "high",
      detail:
        "Impide que AulaConecta sea incrustada en marcos maliciosos.",
    }),
    makeCheck({
      id: "nosniff",
      label: "X-Content-Type-Options",
      value: contentTypeOptions,
      passed: contentTypeOptions.toLowerCase() === "nosniff",
      detail:
        "Evita que el navegador intente adivinar tipos MIME.",
    }),
    makeCheck({
      id: "hsts",
      label: "Strict-Transport-Security",
      value: hsts,
      passed: /max-age=\d+/i.test(hsts),
      severity: "critical",
      detail:
        "Obliga al navegador a utilizar HTTPS en visitas posteriores.",
    }),
    makeCheck({
      id: "referrer",
      label: "Referrer-Policy",
      value: referrerPolicy,
      passed: Boolean(referrerPolicy),
      severity: "medium",
      detail:
        "Reduce la información de navegación enviada a otros sitios.",
    }),
    makeCheck({
      id: "permissions",
      label: "Permissions-Policy",
      value: permissionsPolicy,
      passed: Boolean(permissionsPolicy),
      severity: "medium",
      detail:
        "Deshabilita funciones del navegador que la plataforma no utiliza.",
    }),
    makeCheck({
      id: "coop",
      label: "Cross-Origin-Opener-Policy",
      value: coop,
      passed: coop.toLowerCase() === "same-origin",
      severity: "medium",
      detail:
        "Aísla la ventana frente a contextos de otros orígenes.",
    }),
    makeCheck({
      id: "corp",
      label: "Cross-Origin-Resource-Policy",
      value: corp,
      passed: ["same-site", "same-origin"].includes(
        corp.toLowerCase(),
      ),
      severity: "medium",
      detail:
        "Limita el consumo de recursos por sitios externos.",
    }),
  ]

  const cspDirectives = REQUIRED_CSP_DIRECTIVES.map(
    (directive) => ({
      directive,
      configured: Object.hasOwn(parsedCsp, directive),
      value:
        parsedCsp[directive]?.join(" ") || "No configurada",
    }),
  )

  return {
    checks,
    cspDirectives,
    note: "",
  }
}

function calculateScore(checks, overview) {
  const weights = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  }

  const weighted = checks.reduce(
    (result, check) => {
      const weight = weights[check.severity] ?? 1

      result.total += weight

      if (check.passed) {
        result.passed += weight
      }

      return result
    },
    {
      total: 0,
      passed: 0,
    },
  )

  if (overview) {
    weighted.total += 8

    if (overview.rls?.tables_without_rls?.length === 0) {
      weighted.passed += 4
    }

    if (overview.storage?.public_buckets?.length === 0) {
      weighted.passed += 2
    }

    if (overview.authorization?.strict_admin === true) {
      weighted.passed += 2
    }
  }

  if (!weighted.total) return null

  return Math.round(
    (weighted.passed / weighted.total) * 100,
  )
}

async function loadSecurityOverview() {
  const { data, error } = await supabase.rpc(
    SECURITY_OVERVIEW_RPC,
  )

  if (error) {
    const message = getRpcErrorMessage(error)

    throw new Error(
      `No se pudo ejecutar ${SECURITY_OVERVIEW_RPC}: ${message}`,
    )
  }

  return normalizeOverview(data)
}

async function recordSecurityScan({
  score,
  checks,
  cspDirectives,
}) {
  /*
   * Estos nombres deben coincidir con los argumentos definidos
   * en public.admin_record_security_scan(integer, jsonb).
   */
  const { error } = await supabase.rpc(
    RECORD_SECURITY_SCAN_RPC,
    {
      scan_score: score,
      scan_checks: {
        headers: checks,
        csp: cspDirectives,
      },
    },
  )

  if (error) {
    throw new Error(
      `No se pudo registrar el análisis: ${getRpcErrorMessage(
        error,
      )}`,
    )
  }
}

export async function runAdminSecurityScan() {
  await requireStrictAdmin()

  const [headerResult, overviewResult] =
    await Promise.allSettled([
      readLiveHeaders(),
      loadSecurityOverview(),
    ])

  if (headerResult.status === "rejected") {
    throw headerResult.reason
  }

  const headerEvaluation = evaluateHeaders(
    headerResult.value,
  )

  let overview = null
  let databaseWarning = ""

  if (overviewResult.status === "fulfilled") {
    overview = overviewResult.value
  } else {
    console.warn(
      "No se pudo cargar el diagnóstico de Supabase:",
      overviewResult.reason,
    )

    databaseWarning =
      overviewResult.reason?.message ||
      "El diagnóstico avanzado de Supabase no está disponible."
  }

  const score = calculateScore(
    headerEvaluation.checks,
    overview,
  )

  if (overview && score !== null) {
    try {
      await recordSecurityScan({
        score,
        checks: headerEvaluation.checks,
        cspDirectives:
          headerEvaluation.cspDirectives,
      })
    } catch (recordError) {
      console.warn(
        "No se pudo registrar el análisis de seguridad:",
        recordError,
      )
    }
  }

  return {
    score,
    checkedAt: new Date().toISOString(),
    isLocal: headerResult.value.isLocal,
    responseStatus: headerResult.value.status,
    checks: headerEvaluation.checks,
    cspDirectives: headerEvaluation.cspDirectives,
    note: headerEvaluation.note,
    databaseWarning,
    overview,
  }
}