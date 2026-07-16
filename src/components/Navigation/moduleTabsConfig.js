import {
  Compass,
  FilePlus2,
  FileText,
  FolderOpen,
  Plus,
  Search,
  UserRound,
  Users,
} from "lucide-react"

export const requestTabs = [
  { label: "Explorar", to: "/dashboard/solicitudes", end: true, icon: Search },
  { label: "Mis solicitudes", to: "/dashboard/solicitudes/mias", icon: UserRound },
  { label: "Nueva solicitud", to: "/dashboard/solicitudes/nueva", icon: Plus },
]

export const materialTabs = [
  { label: "Explorar", to: "/dashboard/materiales", end: true, icon: Compass },
  { label: "Mis materiales", to: "/dashboard/materiales/mios", icon: FolderOpen },
  { label: "Subir material", to: "/dashboard/materiales/nuevo", icon: FilePlus2 },
]

export const groupTabs = [
  { label: "Explorar", to: "/dashboard/grupos", end: true, icon: Users },
  { label: "Mis grupos", to: "/dashboard/grupos/mios", icon: FileText },
  { label: "Crear grupo", to: "/dashboard/grupos/nuevo", icon: Plus },
]
