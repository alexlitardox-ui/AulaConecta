import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "../../context/useTheme"

const themeOptions = {
  light: {
    label: "Tema claro",
    next: "dark",
    Icon: Sun,
  },
  dark: {
    label: "Tema oscuro",
    next: "system",
    Icon: Moon,
  },
  system: {
    label: "Tema del sistema",
    next: "light",
    Icon: Monitor,
  },
}

function ThemeToggle({ compact = false, className = "" }) {
  const { theme, setTheme } = useTheme()
  const { label, next, Icon } = themeOptions[theme]

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      title={`${label}. Cambiar a ${themeOptions[next].label.toLowerCase()}`}
      aria-label={`${label}. Cambiar a ${themeOptions[next].label}`}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/10 dark:hover:text-blue-300 ${
        compact ? "h-11 w-11 p-0" : "px-3 py-2.5 text-sm font-semibold"
      } ${className}`}
    >
      <Icon size={20} />
      {!compact && <span>{label}</span>}
    </button>
  )
}

export default ThemeToggle
