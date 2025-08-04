'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  Plus,
  UserPlus,
  Eye,
  Send,
  TrendingUp,
  Target,
  Award,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Calendar,
  Timer
} from 'lucide-react'
import { ActionCard } from '@/components/dashboard/ActionCard'
import { InterviewCard } from '@/components/dashboard/InterviewCard'
import { ActivityItem } from '@/components/dashboard/ActivityItem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EnhancedStats {
  totalInterviews: number
  activeCandidates: number
  completedToday: number
  activeProcesses: number
  // Nuevas métricas
  pendingCandidates: number
  completionRate: number
  avgResponseTime: number
  interviewsThisWeek: number
}

interface MetricCard {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color: string
}

export default function EnhancedDashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState<EnhancedStats>({
    totalInterviews: 0,
    activeCandidates: 0,
    completedToday: 0,
    activeProcesses: 0,
    pendingCandidates: 0,
    completionRate: 0,
    avgResponseTime: 0,
    interviewsThisWeek: 0,
  })
  const [interviews, setInterviews] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEnhancedDashboardData()
    loadRecentActivity()
  }, [])

  const loadEnhancedDashboardData = async () => {
    try {
      setError(null)
      
      // Optimized queries - get all data in fewer calls
      const [
        interviewsResult,
        assignmentsResult,
        responsesResult
      ] = await Promise.all([
        // Entrevistas con sus asignaciones
        supabase
          .from('interviews')
          .select(`
            *,
            assignments(
              id,
              status,
              created_at,
              completed_at,
              user_id,
              profiles(first_name, last_name, email)
            ),
            questions(id)
          `),
        
        // Asignaciones con más detalle
        supabase
          .from('assignments')
          .select(`
            id,
            status,
            created_at,
            completed_at,
            assigned_at,
            interview_id,
            profiles(first_name, last_name, email)
          `),
        
        // Respuestas recientes para calcular tiempos promedio
        supabase
          .from('responses')
          .select('created_at, assignment_id')
          .order('created_at', { ascending: false })
          .limit(100)
      ])

      // Handle errors
      if (interviewsResult.error) throw new Error(`Error cargando entrevistas: ${interviewsResult.error.message}`)
      if (assignmentsResult.error) throw new Error(`Error cargando asignaciones: ${assignmentsResult.error.message}`)
      if (responsesResult.error) console.warn('Error cargando respuestas:', responsesResult.error.message)

      const interviews = interviewsResult.data || []
      const assignments = assignmentsResult.data || []
      const responses = responsesResult.data || []

      // Calcular fecha de hoy e inicio de semana
      const today = new Date()
      const todayISO = today.toISOString().split('T')[0]
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Cálculos mejorados
      const totalInterviews = interviews.length
      
      // Candidatos realmente activos (no completados, no cancelados)
      const activeCandidates = assignments.filter(a => 
        a.status === 'pending' || a.status === 'in_progress'
      ).length
      
      // Candidatos pendientes (solo pending)
      const pendingCandidates = assignments.filter(a => a.status === 'pending').length
      
      // Completadas hoy - usar completed_at en lugar de created_at
      const completedToday = assignments.filter(a => 
        a.status === 'completed' && 
        a.completed_at && 
        a.completed_at.startsWith(todayISO)
      ).length
      
      // Procesos activos (entrevistas con al menos una asignación no completada)
      const activeProcesses = interviews.filter(interview => {
        const interviewAssignments = interview.assignments || []
        return interviewAssignments.some(a => a.status !== 'completed' && a.status !== 'cancelled')
      }).length
      
      // Tasa de finalización global
      const totalAssignments = assignments.length
      const completedAssignments = assignments.filter(a => a.status === 'completed').length
      const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0
      
      // Entrevistas creadas esta semana
      const interviewsThisWeek = interviews.filter(i => 
        new Date(i.created_at) >= weekAgo
      ).length
      
      // Tiempo promedio de respuesta (en horas)
      let avgResponseTime = 0
      if (responses.length > 0) {
        const responseTimes = responses.map(r => {
          const assignment = assignments.find(a => a.id === r.assignment_id)
          if (assignment && assignment.assigned_at) {
            const assignedAt = new Date(assignment.assigned_at)
            const respondedAt = new Date(r.created_at)
            return (respondedAt.getTime() - assignedAt.getTime()) / (1000 * 60 * 60) // hours
          }
          return 0
        }).filter(time => time > 0)
        
        if (responseTimes.length > 0) {
          avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        }
      }

      setStats({
        totalInterviews,
        activeCandidates,
        completedToday,
        activeProcesses,
        pendingCandidates,
        completionRate,
        avgResponseTime,
        interviewsThisWeek,
      })

      // Mapear entrevistas para las cards
      if (interviews.length > 0) {
        const mappedInterviews = interviews.slice(0, 3).map(interview => {
          const interviewAssignments = interview.assignments || []
          const totalCandidates = interviewAssignments.length
          const completedCount = interviewAssignments.filter(a => a.status === 'completed').length
          const completionRate = totalCandidates > 0 ? Math.round((completedCount / totalCandidates) * 100) : 0
          
          return {
            id: interview.id,
            title: interview.name || 'Sin título',
            position: interview.description || 'Sin descripción',
            candidates: totalCandidates,
            completed: completedCount,
            date: new Date(interview.created_at).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            }),
            status: completedCount < totalCandidates ? 'active' : 'completed' as 'active' | 'completed',
            completionRate
          }
        })
        setInterviews(mappedInterviews)
      }

    } catch (error: any) {
      console.error('Error loading enhanced dashboard data:', error)
      setError(error.message || 'Error cargando datos del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadRecentActivity = async () => {
    try {
      const { data: activities, error } = await supabase
        .from('responses')
        .select(`
          id,
          created_at,
          assignments(
            id,
            profiles(first_name, last_name, email)
          ),
          questions(question_text)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error && activities) {
        const formattedActivities = activities.map((activity) => {
          const candidate = activity.assignments?.profiles
          const candidateName = candidate 
            ? `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || candidate.email 
            : 'Usuario desconocido'
          
          return {
            id: activity.id,
            type: 'response' as const,
            title: 'Nueva respuesta recibida',
            subtitle: `${candidateName} - ${activity.questions?.question_text || 'Pregunta desconocida'}`,
            time: getTimeAgo(new Date(activity.created_at))
          }
        })
        setActivities(formattedActivities)
      }
    } catch (error) {
      console.warn('Error loading recent activity:', error)
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    return 'Hace un momento'
  }

  // Configuración de métricas mejoradas
  const metricCards: MetricCard[] = [
    {
      title: 'Entrevistas Totales',
      value: stats.totalInterviews,
      description: 'Procesos de entrevista creados',
      icon: <Building2 className="h-5 w-5" />,
      color: 'text-violet-600',
      trend: stats.interviewsThisWeek > 0 ? {
        value: stats.interviewsThisWeek,
        isPositive: true
      } : undefined
    },
    {
      title: 'Candidatos Activos',
      value: stats.activeCandidates,
      description: 'En proceso de entrevista',
      icon: <Users className="h-5 w-5" />,
      color: 'text-emerald-600'
    },
    {
      title: 'Completadas Hoy',
      value: stats.completedToday,
      description: 'Entrevistas finalizadas hoy',
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      title: 'Tasa de Finalización',
      value: `${stats.completionRate}%`,
      description: 'Porcentaje de finalización global',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      title: 'Candidatos Pendientes',
      value: stats.pendingCandidates,
      description: 'Esperando iniciar entrevista',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-amber-600'
    },
    {
      title: 'Procesos Activos',
      value: stats.activeProcesses,
      description: 'Con candidatos en proceso',
      icon: <Target className="h-5 w-5" />,
      color: 'text-purple-600'
    },
    {
      title: 'Tiempo Promedio',
      value: stats.avgResponseTime > 0 ? `${stats.avgResponseTime}h` : 'N/A',
      description: 'Tiempo de respuesta promedio',
      icon: <Timer className="h-5 w-5" />,
      color: 'text-indigo-600'
    },
    {
      title: 'Esta Semana',
      value: stats.interviewsThisWeek,
      description: 'Entrevistas creadas',
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-teal-600'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">Error cargando dashboard</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button 
              onClick={() => {
                setLoading(true)
                loadEnhancedDashboardData()
              }}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 py-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Bienvenido a TalentaPro <Sparkles className="w-8 h-8" style={{color: '#5b4aef'}} />
        </h1>
        <p className="text-gray-600 mt-2">Gestiona tus procesos de selección con métricas mejoradas</p>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {metric.title}
              </CardTitle>
              <div className={metric.color}>
                {metric.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                {metric.value}
                {metric.trend && (
                  <span className={`text-sm font-normal ${metric.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    +{metric.trend.value}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-violet-600" />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            icon={<Plus className="w-5 h-5" />}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
            title="Crear Entrevista"
            description="Nueva plantilla de entrevista"
            onClick={() => router.push('/admin/interviews/new')}
          />
          <ActionCard
            icon={<UserPlus className="w-5 h-5" />}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            title="Asignar Candidatos"
            description="Enviar invitaciones masivas"
            onClick={() => router.push('/admin/assign-interviews')}
          />
          <ActionCard
            icon={<Eye className="w-5 h-5" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            title="Ver Respuestas"
            description="Revisar entrevistas completadas"
            onClick={() => router.push('/admin/interviews')}
          />
          <ActionCard
            icon={<BarChart3 className="w-5 h-5" />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            title="Analytics"
            description="Métricas y reportes detallados"
            onClick={() => router.push('/admin/analytics')}
          />
        </div>
      </div>

      {/* Entrevistas Recientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Entrevistas Recientes</h2>
          <button
            onClick={() => router.push('/admin/interviews')}
            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
          >
            Ver todas
          </button>
        </div>
        <div className="space-y-4">
          {interviews.map((interview) => (
            <InterviewCard key={interview.id} {...interview} />
          ))}
        </div>
      </div>

      {/* Actividad Reciente */}
      {activities.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} {...activity} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}