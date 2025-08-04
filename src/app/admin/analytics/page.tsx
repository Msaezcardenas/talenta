'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Clock, 
  Award, 
  Target, 
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  CheckCircle,
  AlertCircle,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AnalyticsData {
  totalInterviews: number
  totalCandidates: number
  completionRate: number
  avgResponseTime: number
  interviewsThisMonth: number
  candidatesThisMonth: number
  completedThisMonth: number
  
  // Período anterior para comparación
  prevMonthInterviews: number
  prevMonthCandidates: number
  prevMonthCompleted: number
  
  // Datos por entrevista
  interviewPerformance: Array<{
    name: string
    totalAssignments: number
    completedAssignments: number
    completionRate: number
  }>
  
  // Distribución de estados
  statusDistribution: {
    pending: number
    in_progress: number
    completed: number
  }
  
  // Actividad por día
  dailyActivity: Array<{
    date: string
    assignments: number
    completions: number
  }>
  
  // Top candidatos más activos
  topCandidates: Array<{
    name: string
    email: string
    completedInterviews: number
    totalAssignments: number
  }>
}

export default function AnalyticsPage() {
  const supabase = createClientComponentClient()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fechas para comparación
      const now = new Date()
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Consultas paralelas para mejor rendimiento
      const [
        interviewsResult,
        assignmentsResult,
        responsesResult,
        candidatesResult
      ] = await Promise.all([
        // Entrevistas con asignaciones
        supabase
          .from('interviews')
          .select(`
            id,
            name,
            created_at,
            assignments(
              id,
              status,
              assigned_at,
              user_id,
              profiles(first_name, last_name, email)
            )
          `),
        
        // Todas las asignaciones
        supabase
          .from('assignments')
          .select(`
            id,
            status,
            assigned_at,
            interview_id,
            user_id,
            profiles(first_name, last_name, email)
          `),
        
        // Respuestas para calcular tiempos
        supabase
          .from('responses')
          .select('id, assignment_id, created_at'),
        
        // Candidatos
        supabase
          .from('profiles')
          .select('id, email, first_name, last_name, created_at')
          .eq('role', 'candidate')
      ])

      if (interviewsResult.error) throw interviewsResult.error
      if (assignmentsResult.error) throw assignmentsResult.error
      if (responsesResult.error) throw responsesResult.error
      if (candidatesResult.error) throw candidatesResult.error

      const interviews = interviewsResult.data || []
      const assignments = assignmentsResult.data || []
      const responses = responsesResult.data || []
      const candidates = candidatesResult.data || []

      // Métricas principales
      const totalInterviews = interviews.length
      const totalCandidates = candidates.length
      const totalAssignments = assignments.length
      const completedAssignments = assignments.filter(a => a.status === 'completed').length
      const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0

      // Tiempo promedio de respuesta
      let avgResponseTime = 0
      console.log('Debug avgResponseTime calculation:')
      console.log('- responses.length:', responses.length)
      console.log('- assignments.length:', assignments.length)
      
      if (responses.length > 0 && assignments.length > 0) {
        console.log('- Sample response:', responses[0])
        console.log('- Sample assignment:', assignments[0])
        
        const responseTimes = responses.map(r => {
          const assignment = assignments.find(a => a.id === r.assignment_id)
          
          if (assignment && assignment.assigned_at && r.created_at) {
            const assignedAt = new Date(assignment.assigned_at)
            const respondedAt = new Date(r.created_at)
            const timeDiffHours = (respondedAt.getTime() - assignedAt.getTime()) / (1000 * 60 * 60)
            
            console.log(`- Response ${r.id}: assigned ${assignment.assigned_at}, responded ${r.created_at}, diff: ${timeDiffHours}h`)
            
            return Math.max(0, timeDiffHours)
          }
          
          if (!assignment) {
            console.log(`- Response ${r.id}: no matching assignment found for assignment_id ${r.assignment_id}`)
          } else if (!assignment.assigned_at) {
            console.log(`- Response ${r.id}: assignment found but no assigned_at date`)
          }
          
          return 0
        }).filter(time => time > 0)
        
        console.log('- Valid response times:', responseTimes)
        console.log('- Valid response times count:', responseTimes.length)
        
        if (responseTimes.length > 0) {
          avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
          console.log('- Final avgResponseTime:', avgResponseTime)
        }
      } else {
        console.log('- No responses or assignments to calculate average time')
      }

      // Métricas del mes actual
      const interviewsThisMonth = interviews.filter(i => 
        new Date(i.created_at) >= thisMonthStart
      ).length
      
      const candidatesThisMonth = candidates.filter(c => 
        new Date(c.created_at) >= thisMonthStart
      ).length
      
      const completedThisMonth = assignments.filter(a => 
        a.status === 'completed' && 
        new Date(a.assigned_at) >= thisMonthStart
      ).length

      // Métricas del mes anterior
      const prevMonthInterviews = interviews.filter(i => {
        const date = new Date(i.created_at)
        return date >= lastMonthStart && date <= lastMonthEnd
      }).length
      
      const prevMonthCandidates = candidates.filter(c => {
        const date = new Date(c.created_at)
        return date >= lastMonthStart && date <= lastMonthEnd
      }).length
      
      const prevMonthCompleted = assignments.filter(a => {
        if (a.status !== 'completed') return false
        const date = new Date(a.assigned_at)
        return date >= lastMonthStart && date <= lastMonthEnd
      }).length

      // Rendimiento por entrevista
      const interviewPerformance = interviews.map(interview => {
        const interviewAssignments = interview.assignments || []
        const completed = interviewAssignments.filter(a => a.status === 'completed').length
        const total = interviewAssignments.length
        
        return {
          name: interview.name || 'Sin título',
          totalAssignments: total,
          completedAssignments: completed,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        }
      }).filter(item => item.totalAssignments > 0)
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5) // Top 5

      // Distribución de estados
      const statusDistribution = {
        pending: assignments.filter(a => a.status === 'pending').length,
        in_progress: assignments.filter(a => a.status === 'in_progress').length,
        completed: assignments.filter(a => a.status === 'completed').length
      }

      // Actividad por día (últimos 7 días)
      const dailyActivity = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        
        // Debug: log the date we're checking
        console.log(`Checking date: ${dateStr}`)
        
        const dayAssignments = assignments.filter(a => {
          if (!a.assigned_at) return false
          
          // Extraer solo la fecha (sin hora) de assigned_at
          const assignedDate = new Date(a.assigned_at).toISOString().split('T')[0]
          const matches = assignedDate === dateStr
          
          // Debug: log matches
          if (matches) {
            console.log(`Found assignment on ${dateStr}:`, a.assigned_at)
          }
          
          return matches
        }).length
        
        // Para completions, usamos la fecha de la última respuesta
        const dayCompletions = assignments.filter(a => {
          if (a.status !== 'completed') return false
          const assignmentResponses = responses.filter(r => r.assignment_id === a.id)
          if (assignmentResponses.length === 0) return false
          
          const latestResponse = assignmentResponses.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
          
          return latestResponse.created_at.startsWith(dateStr)
        }).length
        
        dailyActivity.push({
          date: date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }),
          assignments: dayAssignments,
          completions: dayCompletions
        })
      }

      // Top candidatos más activos
      const candidateStats = candidates.map(candidate => {
        const candidateAssignments = assignments.filter(a => a.user_id === candidate.id)
        const completed = candidateAssignments.filter(a => a.status === 'completed').length
        
        return {
          name: candidate.first_name && candidate.last_name 
            ? `${candidate.first_name} ${candidate.last_name}`
            : 'Sin nombre',
          email: candidate.email,
          completedInterviews: completed,
          totalAssignments: candidateAssignments.length
        }
      }).filter(c => c.totalAssignments > 0)
      .sort((a, b) => b.completedInterviews - a.completedInterviews)
      .slice(0, 5) // Top 5

      setData({
        totalInterviews,
        totalCandidates,
        completionRate,
        avgResponseTime,
        interviewsThisMonth,
        candidatesThisMonth,
        completedThisMonth,
        prevMonthInterviews,
        prevMonthCandidates,
        prevMonthCompleted,
        interviewPerformance,
        statusDistribution,
        dailyActivity,
        topCandidates: candidateStats
      })

    } catch (err: any) {
      console.error('Error loading analytics:', err)
      setError(err.message || 'Error cargando analytics')
    } finally {
      setLoading(false)
    }
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const formatChange = (change: number) => {
    const isPositive = change >= 0
    return {
      text: `${isPositive ? '+' : ''}${change}% vs mes anterior`,
      color: isPositive ? 'text-green-600' : 'text-red-600'
    }
  }

  const generateInsights = (data: AnalyticsData) => {
    const insights = []
    
    // Insight sobre mejor entrevista
    if (data.interviewPerformance.length > 0) {
      const best = data.interviewPerformance[0]
      insights.push({
        title: 'Top Performer',
        content: `"${best.name}" tiene la mayor tasa de completación (${best.completionRate}%)`
      })
    }
    
    // Insight sobre tiempo de respuesta
    if (data.avgResponseTime > 0) {
      const timeInsight = data.avgResponseTime < 24 
        ? 'Los candidatos responden rápidamente (promedio < 24h)'
        : data.avgResponseTime > 72 
        ? 'Los candidatos tardan más de 3 días en responder'
        : 'Tiempo de respuesta promedio está en el rango óptimo'
      
      insights.push({
        title: 'Tiempo de Respuesta',
        content: timeInsight
      })
    }
    
    // Insight sobre actividad
    const totalActivity = data.dailyActivity.reduce((sum, day) => sum + day.assignments, 0)
    console.log('Total activity for insights:', totalActivity, 'Daily activity:', data.dailyActivity)
    
    if (totalActivity > 0) {
      const avgDaily = totalActivity / 7
      const avgFormatted = avgDaily >= 1 ? Math.round(avgDaily) : Math.round(avgDaily * 10) / 10
      
      insights.push({
        title: 'Actividad Semanal',
        content: `Promedio de ${avgFormatted} asignaciones por día en la última semana (${totalActivity} total)`
      })
    }
    
    return insights.slice(0, 3) // Máximo 3 insights
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 py-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Error cargando métricas</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Error cargando analytics</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button 
                  onClick={loadAnalyticsData}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const insights = generateInsights(data)

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Métricas y análisis de tus procesos de selección</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entrevistas</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalInterviews}</p>
              </div>
              <div className="p-3 bg-violet-100 rounded-lg">
                <FileText className="w-6 h-6 text-violet-600" />
              </div>
            </div>
            <p className={`text-xs mt-3 ${formatChange(calculateChange(data.interviewsThisMonth, data.prevMonthInterviews)).color}`}>
              {formatChange(calculateChange(data.interviewsThisMonth, data.prevMonthInterviews)).text}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Candidatos Totales</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{data.totalCandidates}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className={`text-xs mt-3 ${formatChange(calculateChange(data.candidatesThisMonth, data.prevMonthCandidates)).color}`}>
              {formatChange(calculateChange(data.candidatesThisMonth, data.prevMonthCandidates)).text}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasa Completación</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{data.completionRate}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className={`text-xs mt-3 ${formatChange(calculateChange(data.completedThisMonth, data.prevMonthCompleted)).color}`}>
              {formatChange(calculateChange(data.completedThisMonth, data.prevMonthCompleted)).text}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tiempo Promedio</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {data.avgResponseTime > 0 ? `${data.avgResponseTime}h` : '-'}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {data.avgResponseTime > 0 
                ? 'Tiempo promedio de respuesta'
                : 'Sin respuestas para calcular'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <PieChart className="w-5 h-5 text-blue-600" />
              Estados de Asignaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completadas</span>
                <span className="font-medium text-green-600">{data.statusDistribution.completed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">En Progreso</span>
                <span className="font-medium text-blue-600">{data.statusDistribution.in_progress}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pendientes</span>
                <span className="font-medium text-amber-600">{data.statusDistribution.pending}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Activity className="w-5 h-5 text-green-600" />
              Actividad Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.dailyActivity.map((day, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{day.date}</span>
                  <div className="flex gap-2">
                    <span className="text-blue-600">{day.assignments} asig.</span>
                    <span className="text-green-600">{day.completions} comp.</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Users className="w-5 h-5 text-purple-600" />
              Top Candidatos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topCandidates.slice(0, 3).map((candidate, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {candidate.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {candidate.email}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-violet-600">
                    {candidate.completedInterviews}/{candidate.totalAssignments}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance by Interview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Award className="w-5 h-5 text-violet-600" />
              Rendimiento por Entrevista
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.interviewPerformance.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay datos de entrevistas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.interviewPerformance.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate">{item.name}</span>
                      <span className="text-gray-500 ml-2">
                        {item.completionRate}% ({item.completedAssignments}/{item.totalAssignments})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-violet-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${item.completionRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Actividad de los Últimos 7 Días
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.dailyActivity.map((day, index) => {
                const maxValue = Math.max(...data.dailyActivity.map(d => Math.max(d.assignments, d.completions)))
                const assignmentWidth = maxValue > 0 ? (day.assignments / maxValue) * 100 : 0
                const completionWidth = maxValue > 0 ? (day.completions / maxValue) * 100 : 0
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{day.date}</span>
                      <span className="text-gray-500">{day.assignments} / {day.completions}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${assignmentWidth}%` }}
                        />
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${completionWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>🔵 Asignaciones</span>
                <span>🟢 Completadas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Insights Automáticos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {insights.map((insight, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-2">{insight.title}</h3>
                <p className="text-violet-100">{insight.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}