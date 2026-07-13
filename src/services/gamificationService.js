import { supabase } from "./supabase"

export const LEVELS = [
  { name: "Principiante", minXp: 0, icon: "🌱" },
  { name: "Colaborador", minXp: 100, icon: "📚" },
  { name: "Tutor", minXp: 250, icon: "🎓" },
  { name: "Mentor", minXp: 500, icon: "🏆" },
  { name: "Experto", minXp: 900, icon: "💎" },
  { name: "Leyenda AulaConecta", minXp: 1500, icon: "👑" },
]

export const ACHIEVEMENTS = [
  { key: "first_tutoring", title: "Primera tutoría", description: "Completa tu primera tutoría como tutor.", icon: "🎓", check: s => s.completed_tutoring >= 1 },
  { key: "active_tutor", title: "Tutor activo", description: "Completa 10 tutorías como tutor.", icon: "🔥", check: s => s.completed_tutoring >= 10 },
  { key: "first_material", title: "Primer aporte", description: "Consigue la aprobación de tu primer material.", icon: "📄", check: s => s.approved_materials >= 1 },
  { key: "librarian", title: "Bibliotecario", description: "Publica 10 materiales aprobados.", icon: "📚", check: s => s.approved_materials >= 10 },
  { key: "group_builder", title: "Impulsor de grupos", description: "Crea 5 grupos de estudio.", icon: "🤝", check: s => s.created_groups >= 5 },
  { key: "five_stars", title: "Cinco estrellas", description: "Recibe tu primera valoración de 5 estrellas.", icon: "⭐", check: s => s.five_star_reviews >= 1 },
  { key: "excellent", title: "Excelencia académica", description: "Mantén un promedio mínimo de 4.8 con al menos 5 reseñas.", icon: "💎", check: s => s.review_count >= 5 && Number(s.average_rating) >= 4.8 },
  { key: "legend", title: "Leyenda", description: "Alcanza 1500 XP en AulaConecta.", icon: "👑", check: s => s.xp >= 1500 },
]

export function getLevelInfo(xp = 0) {
  const currentIndex = [...LEVELS].reverse().findIndex(level => xp >= level.minXp)
  const index = currentIndex < 0 ? 0 : LEVELS.length - 1 - currentIndex
  const current = LEVELS[index]
  const next = LEVELS[index + 1] ?? null
  const progress = next
    ? Math.min(100, Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100))
    : 100
  return { current, next, progress, remaining: next ? Math.max(0, next.minXp - xp) : 0 }
}

export async function getMyGamification() {
  const { data, error } = await supabase.rpc("get_my_gamification")
  if (error) throw error
  const stats = data ?? { xp: 0, completed_tutoring: 0, approved_materials: 0, created_groups: 0, five_star_reviews: 0, review_count: 0, average_rating: 0 }
  return { ...stats, achievements: ACHIEVEMENTS.map(item => ({ ...item, unlocked: item.check(stats) })) }
}

export async function getLeaderboard(limit = 20) {
  const { data, error } = await supabase.rpc("get_gamification_leaderboard", { result_limit: limit })
  if (error) throw error
  return data ?? []
}
