import { useCallback, useEffect, useState } from "react"
import {
  getDashboardSummary,
  getRecentRequests,
} from "../services/dashboardService"

const initialSummary = {
  totalRequests: 0,
  openRequests: 0,
  acceptedRequests: 0,
  applicationsSent: 0,
  completedTutoring: 0,
  rating: 5,
}

export function useDashboard() {
  const [summary, setSummary] = useState(initialSummary)
  const [recentRequests, setRecentRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError("")

    try {
      const [summaryData, recentData] = await Promise.all([
        getDashboardSummary(),
        getRecentRequests(),
      ])

      setSummary(summaryData)
      setRecentRequests(recentData)
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
    recentRequests,
    loading,
    error,
    reload: loadDashboard,
  }
}