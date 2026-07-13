import { useCallback, useEffect, useState } from "react"
import { getDashboardStats } from "../services/dashboardService"

const initialSummary = {
  requests: 0,
  tutoring: 0,
  groups: 0,
  notifications: [],
  rating: 0,
}

export function useDashboard() {
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const summaryData = await getDashboardStats()
      setSummary(summaryData)
    } catch (loadError) {
      console.error(loadError)
      setError("No se pudo cargar la información del Dashboard.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return {
    summary,
    loading,
    error,
    reload: loadDashboard,
  }
}