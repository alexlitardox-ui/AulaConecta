import { useEffect, useMemo, useRef, useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import {
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FileText,
  GraduationCap,
  Heart,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react"

import GlobalSearch from "../components/Search/GlobalSearch"
import ThemeToggle from "../components/Theme/ThemeToggle"
import {
  getUnreadNotificationsCount,
  subscribeToNotifications,
} from "../services/notificationService"
import { ensureCurrentProfile } from "../services/profileService"
import { supabase } from "../services/supabase"

const menuSections = [
  {
    title: "Principal",
    items: [
      {
        label: "Inicio",
        path: "/dashboard",
        icon: Home,
        end: true,
      },
      {
        label: "Mi perfil",
        path: "/dashboard/perfil",
        icon: User,
      },
      {
        label: "Tutorías",
        path: "/dashboard/tutorias",
        icon: GraduationCap,
      },
      {
        label: "Calendario",
        path: "/dashboard/calendario",
        icon: CalendarDays,
      },
      {
        label: "Solicitudes",
        path: "/dashboard/solicitudes",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Comunidad",
    items: [
      {
        label: "Grupos de estudio",
        path: "/dashboard/grupos",
        icon: Users,
      },
      {
        label: "Materiales",
        path: "/dashboard/materiales",
        icon: FileText,
      },
      {
        label: "Favoritos",
        path: "/dashboard/materiales/favoritos",
        icon: Heart,
      },
      {
        label: "Mensajes",
        path: "/dashboard/chat",
        icon: MessageCircle,
      },
      {
        label: "Mi reputación",
        path: "/dashboard/reputacion",
        icon: Star,
      },
      {
        label: "Logros y ranking",
        path: "/dashboard/logros",
        icon: Trophy,
      },
      {
        label: "Centro analítico",
        path: "/dashboard/analiticas",
        icon: BarChart3,
      },
      {
        label: "AulaConecta AI",
        path: "/dashboard/asistente",
        icon: Bot,
      },
      {
        label: "Notificaciones",
        path: "/dashboard/notificaciones",
        icon: Bell,
      },
    ],
  },
]

const quickActions = [
  {
    label: "Nueva solicitud",
    description: "Solicita ayuda académica",
    path: "/dashboard/solicitudes/nueva",
    icon: BookOpen,
    iconClass: "bg-blue-100 text-blue-700",
  },
  {
    label: "Subir material",
    description: "Comparte apuntes o recursos",
    path: "/dashboard/materiales/nuevo",
    icon: FileText,
    iconClass: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Crear grupo",
    description: "Organiza un grupo de estudio",
    path: "/dashboard/grupos/nuevo",
    icon: Users,
    iconClass: "bg-indigo-100 text-indigo-700",
  },
]

function DashboardLayout() {
  const navigate = useNavigate()

  const quickActionsRef = useRef(null)
  const userMenuRef = useRef(null)

  const [user, setUser] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState("")
  const [profileName, setProfileName] = useState({
    firstName: "",
    lastName: "",
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  const [quickActionsOpen, setQuickActionsOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    let unsubscribeNotifications = () => {}
    let mounted = true

    async function loadLayoutData() {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        console.error("No se pudo cargar el usuario:", userError)
        return
      }

      if (!currentUser || !mounted) return

      setUser(currentUser)

      let profile = null

      try {
        profile = await ensureCurrentProfile()
      } catch (profileError) {
        console.error(
          "No se pudo cargar o completar el perfil:",
          profileError,
        )
      }

      if (mounted) {
        setAvatarUrl(
          profile?.avatar_url ||
            currentUser.user_metadata?.avatar_url ||
            "",
        )

        setProfileName({
          firstName:
            profile?.first_name ||
            currentUser.user_metadata?.first_name ||
            "",
          lastName:
            profile?.last_name ||
            currentUser.user_metadata?.last_name ||
            "",
        })

        setIsAdmin(
          Boolean(
            profile?.is_admin ||
              profile?.role === "admin" ||
              profile?.role === "moderator",
          ),
        )
      }

      async function loadUnreadCount() {
        try {
          const count = await getUnreadNotificationsCount()

          if (mounted) {
            setUnreadNotifications(count)
          }
        } catch (countError) {
          console.error(
            "No se pudo cargar el número de notificaciones:",
            countError,
          )
        }
      }

      await loadUnreadCount()

      unsubscribeNotifications = subscribeToNotifications(
        currentUser.id,
        loadUnreadCount,
      )
    }

    loadLayoutData()

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) return

        const currentUser = currentSession?.user ?? null
        setUser(currentUser)

        if (!currentUser) {
          setAvatarUrl("")
          setUnreadNotifications(0)
          setIsAdmin(false)
          setProfileName({
            firstName: "",
            lastName: "",
          })
          return
        }

        const metadataAvatar =
          currentUser.user_metadata?.avatar_url || ""

        if (metadataAvatar) {
          setAvatarUrl(metadataAvatar)
        }
      },
    )

    return () => {
      mounted = false
      unsubscribeNotifications()
      authSubscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    function handleDocumentClick(event) {
      if (
        quickActionsRef.current &&
        !quickActionsRef.current.contains(event.target)
      ) {
        setQuickActionsOpen(false)
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setUserMenuOpen(false)
      }
    }

    function handleEscape(event) {
      if (event.key !== "Escape") return

      setQuickActionsOpen(false)
      setUserMenuOpen(false)
      setSidebarOpen(false)
    }

    document.addEventListener("mousedown", handleDocumentClick)
    window.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentClick,
      )
      window.removeEventListener("keydown", handleEscape)
    }
  }, [])

  const visibleMenuSections = useMemo(() => {
    if (!isAdmin) return menuSections

    return [
      ...menuSections,
      {
        title: "Administración",
        items: [
          {
            label: "Panel administrativo",
            path: "/dashboard/administracion",
            icon: ShieldCheck,
          },
        ],
      },
    ]
  }, [isAdmin])

  async function handleLogout() {
    setLoggingOut(true)
    setUserMenuOpen(false)

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("No se pudo cerrar la sesión:", error)
      setLoggingOut(false)
      return
    }

    navigate("/login", { replace: true })
  }

  function handleQuickAction(path) {
    setQuickActionsOpen(false)
    navigate(path)
  }

  function handleUserNavigation(path) {
    setUserMenuOpen(false)
    navigate(path)
  }

  const firstName =
    profileName.firstName ||
    user?.user_metadata?.first_name ||
    user?.email?.split("@")[0] ||
    "Estudiante"

  const lastName =
    profileName.lastName ||
    user?.user_metadata?.last_name ||
    ""

  const fullName = `${firstName} ${lastName}`.trim()

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`
      .trim()
      .toUpperCase() || firstName.slice(0, 2).toUpperCase()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()

    if (hour < 12) return "Buenos días"
    if (hour < 19) return "Buenas tardes"
    return "Buenas noches"
  }, [])

  const displayedRole = isAdmin ? "Administrador" : "Estudiante"

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-600/25 via-indigo-500/10 to-transparent" />

        <div className="pointer-events-none absolute -left-24 top-36 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex min-h-24 items-center justify-between border-b border-white/10 px-5">
          <NavLink
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="group flex min-w-0 items-center gap-3"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-950/50 transition duration-300 group-hover:scale-105 group-hover:rotate-2">
              <GraduationCap size={26} />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight">
                AulaConecta
              </h1>

              <p className="mt-0.5 text-xs font-medium text-slate-400">
                Aprende · Comparte · Crece
              </p>
            </div>
          </NavLink>

          <button
            type="button"
            aria-label="Cerrar menú lateral"
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-4 py-5">
          <div className="mb-5 rounded-2xl border border-blue-400/15 bg-blue-500/10 p-3.5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-blue-500/15 p-2 text-blue-300">
                <Sparkles size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-white">
                  Tu espacio académico
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Conecta con estudiantes y avanza en tus materias.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {visibleMenuSections.map((section) => (
              <section key={section.title}>
                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {section.title}
                </p>

                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isNotifications =
                      item.path ===
                      "/dashboard/notificaciones"

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={() =>
                          setSidebarOpen(false)
                        }
                        className={({ isActive }) =>
                          `group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-3.5 py-3 text-sm font-semibold transition duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/30"
                              : "text-slate-300 hover:bg-white/[0.07] hover:text-white"
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`absolute inset-y-2 left-0 w-1 rounded-r-full transition ${
                                isActive
                                  ? "bg-white"
                                  : "bg-transparent"
                              }`}
                            />

                            <Icon
                              size={19}
                              className={`shrink-0 transition duration-200 ${
                                isActive
                                  ? "text-white"
                                  : "text-slate-400 group-hover:text-blue-300"
                              }`}
                            />

                            <span className="flex-1 truncate text-left">
                              {item.label}
                            </span>

                            {isNotifications &&
                            unreadNotifications > 0 ? (
                              <span className="flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-extrabold text-white ring-2 ring-white/10">
                                {unreadNotifications > 99
                                  ? "99+"
                                  : unreadNotifications}
                              </span>
                            ) : (
                              <ChevronRight
                                size={16}
                                className={`transition duration-200 ${
                                  isActive
                                    ? "translate-x-0 opacity-90"
                                    : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-70"
                                }`}
                              />
                            )}
                          </>
                        )}
                      </NavLink>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="relative border-t border-white/10 bg-slate-950/80 p-4 backdrop-blur">
          <NavLink
            to="/dashboard/perfil"
            onClick={() => setSidebarOpen(false)}
            className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 transition hover:border-blue-400/30 hover:bg-white/[0.08]"
          >
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-slate-950/40">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Fotografía de ${firstName}`}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarUrl("")}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-black text-white">
                  {initials}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {fullName}
              </p>

              <p className="mt-0.5 truncate text-xs text-slate-400">
                {user?.email || "Cargando..."}
              </p>
            </div>

            <ChevronRight
              size={17}
              className="shrink-0 text-slate-500"
            />
          </NavLink>

          <div className="grid grid-cols-2 gap-2">
            <NavLink
              to="/dashboard/configuracion"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-white/[0.05] text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Settings size={17} />
              Ajustes
            </NavLink>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut size={17} />
              {loggingOut ? "Saliendo..." : "Salir"}
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-20 items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
            <button
              type="button"
              aria-label="Abrir menú lateral"
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:hidden"
            >
              <Menu size={22} />
            </button>

            <div className="hidden min-w-44 xl:block">
              <p className="text-sm font-bold text-slate-900">
                {greeting}, {firstName} 👋
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Bienvenido nuevamente
              </p>
            </div>

            <div className="hidden max-w-2xl flex-1 md:block">
              <GlobalSearch />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div
                ref={quickActionsRef}
                className="relative"
              >
                <button
                  type="button"
                  aria-label="Abrir acciones rápidas"
                  aria-expanded={quickActionsOpen}
                  onClick={() => {
                    setQuickActionsOpen(
                      (currentValue) => !currentValue,
                    )
                    setUserMenuOpen(false)
                  }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <Plus size={19} />

                  <span className="hidden lg:inline">
                    Nuevo
                  </span>
                </button>

                {quickActionsOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <div className="border-b border-slate-100 px-3 py-3">
                      <p className="font-bold text-slate-900">
                        Crear contenido
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Accede rápidamente a las acciones principales.
                      </p>
                    </div>

                    <div className="space-y-1 p-1 pt-2">
                      {quickActions.map((action) => {
                        const Icon = action.icon

                        return (
                          <button
                            key={action.path}
                            type="button"
                            onClick={() =>
                              handleQuickAction(action.path)
                            }
                            className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50"
                          >
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.iconClass}`}
                            >
                              <Icon size={20} />
                            </div>

                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">
                                {action.label}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {action.description}
                              </p>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <ThemeToggle compact />

              <NavLink
                to="/dashboard/notificaciones"
                aria-label={`${unreadNotifications} notificaciones sin leer`}
                className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <Bell size={21} />

                {unreadNotifications > 0 && (
                  <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-extrabold text-white ring-2 ring-white">
                    {unreadNotifications > 99
                      ? "99+"
                      : unreadNotifications}
                  </span>
                )}
              </NavLink>

              <div
                ref={userMenuRef}
                className="relative"
              >
                <button
                  type="button"
                  aria-label="Abrir menú de usuario"
                  aria-expanded={userMenuOpen}
                  onClick={() => {
                    setUserMenuOpen(
                      (currentValue) => !currentValue,
                    )
                    setQuickActionsOpen(false)
                  }}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-1.5 pr-2.5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`Fotografía de ${firstName}`}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarUrl("")}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-black text-white">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="hidden min-w-0 text-left sm:block">
                    <p className="max-w-36 truncate text-sm font-bold text-slate-900">
                      {fullName}
                    </p>

                    <p className="max-w-36 truncate text-xs text-slate-500">
                      {displayedRole}
                    </p>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`hidden text-slate-400 transition sm:block ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                    <div className="border-b border-slate-100 bg-slate-50 px-4 py-4">
                      <p className="truncate font-bold text-slate-900">
                        {fullName}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {user?.email || ""}
                      </p>
                    </div>

                    <div className="p-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleUserNavigation(
                            "/dashboard/perfil",
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <User size={18} />
                        Mi perfil
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUserNavigation(
                            "/dashboard/configuracion",
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Settings size={18} />
                        Configuración
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleUserNavigation(
                            "/dashboard/asistente",
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <CircleHelp size={18} />
                        Ayuda y asistente
                      </button>
                    </div>

                    <div className="border-t border-slate-100 p-2">
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <LogOut size={18} />

                        {loggingOut
                          ? "Cerrando sesión..."
                          : "Cerrar sesión"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 px-4 py-3 md:hidden">
            <GlobalSearch />
          </div>
        </header>

        <main className="min-h-[calc(100vh-5rem)]">
          <Outlet
            context={{
              user,
              firstName,
              avatarUrl,
              setAvatarUrl,
              unreadNotifications,
              isAdmin,
            }}
          />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout