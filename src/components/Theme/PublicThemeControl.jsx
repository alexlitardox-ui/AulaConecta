import { useLocation } from "react-router-dom"
import ThemeToggle from "./ThemeToggle"

function PublicThemeControl() {
  const location = useLocation()

  if (location.pathname.startsWith("/dashboard")) return null

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      <ThemeToggle compact className="h-12 w-12 rounded-2xl shadow-xl" />
    </div>
  )
}

export default PublicThemeControl
