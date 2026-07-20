import { useEffect, useId, useRef } from "react"
import { TURNSTILE_SITE_KEY } from "../../config/appConfig"

const SCRIPT_ID = "cloudflare-turnstile-script"
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID)
    if (existing) {
      existing.addEventListener("load", resolve, { once: true })
      existing.addEventListener("error", reject, { once: true })
      return
    }

    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function TurnstileWidget({ onToken, resetKey = 0, action = "auth" }) {
  const generatedId = useId().replace(/:/g, "")
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function renderWidget() {
      onToken("")
      if (!TURNSTILE_SITE_KEY || !containerRef.current) return

      try {
        await loadTurnstileScript()
        if (cancelled || !containerRef.current || !window.turnstile) return

        if (widgetIdRef.current !== null) {
          window.turnstile.remove(widgetIdRef.current)
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
          language: "es",
          size: "flexible",
          action,
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
          "timeout-callback": () => onToken(""),
          "error-callback": () => onToken(""),
        })
      } catch {
        onToken("")
      }
    }

    renderWidget()

    return () => {
      cancelled = true
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [action, generatedId, onToken, resetKey])

  if (!TURNSTILE_SITE_KEY) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        CAPTCHA pendiente de configuración. Agrega <strong>VITE_TURNSTILE_SITE_KEY</strong> en las variables de entorno.
      </div>
    )
  }

  return <div ref={containerRef} id={`turnstile-${generatedId}`} className="min-h-16 w-full" />
}

export default TurnstileWidget
