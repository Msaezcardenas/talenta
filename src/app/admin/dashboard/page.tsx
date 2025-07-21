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
  CheckCircle2
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ActionCard } from '@/components/dashboard/ActionCard'
import { InterviewCard } from '@/components/dashboard/InterviewCard'
import { ActivityItem } from '@/components/dashboard/ActivityItem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState({
    totalInterviews: 0,
    activeCandidates: 0,
    completedToday: 0,
    activeProcesses: 0,
  })
  const [interviews, setInterviews] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    loadRecentActivity()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Cargar estadísticas
      const { data: interviews, error: interviewsError } = await supabase
        .from('interviews')
        .select('*, assignments(*), questions(*)')

      const { data: candidates, error: candidatesError } = await supabase
        .from('assignments')
        .select('*')

      const { data: todayCompletions, error: completionsError } = await supabase
        .from('assignments')
        .select('*')
        .eq('status', 'completed')
        .gte('completed_at', new Date().toISOString().split('T')[0])

      // Calcular estadísticas
      setStats({
        totalInterviews: interviews?.length || 0,
        activeCandidates: candidates?.length || 0,
        completedToday: todayCompletions?.length || 0,
        activeProcesses: interviews?.filter((interview) => {
          const candidates = interview.assignments?.length || 0
          const completed = interview.assignments?.filter((c: any) => c.status === 'completed').length || 0
          return candidates > 0 && completed < candidates
        }).length || 0,
      })

      // Mapear las entrevistas al formato esperado por InterviewCard
      if (interviews) {
        const mappedInterviews = interviews.slice(0, 3).map(interview => {
          const totalCandidates = interview.assignments?.length || 0
          const completedCount = interview.assignments?.filter((a: any) => a.status === 'completed').length || 0
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

      setLoading(false)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentActivity = async () => {
    const { data: activities, error } = await supabase
      .from('responses')
      .select('*, assignments(*, profiles(*)), questions(*)')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Bienvenido a Talium <Sparkles className="w-8 h-8 text-violet-600" />
        </h1>
        <p className="text-gray-600 mt-2">Gestiona tus procesos de selección de manera inteligente</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entrevistas Totales
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInterviews}</div>
            <p className="text-xs text-muted-foreground">
              Procesos de entrevista creados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Candidatos Activos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Candidatos con entrevistas asignadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completadas Hoy
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedToday}</div>
            <p className="text-xs text-muted-foreground">
              Entrevistas finalizadas hoy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Procesos Activos
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProcesses}</div>
            <p className="text-xs text-muted-foreground">
              Con candidatos en proceso
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Actions and Interviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-violet-600" />
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onClick={() => router.push('/admin/assignments')}
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
                icon={<Send className="w-5 h-5" />}
                iconBg="bg-amber-100"
                iconColor="text-amber-600"
                title="Enviar Recordatorios"
                description="Notificar candidatos pendientes"
                onClick={() => {}}
              />
            </div>
          </div>

          {/* Recent Interviews */}
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
        </div>

        {/* Right Column - Activity and Insights */}
        <div className="space-y-8">
          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Actividad Reciente
            </h2>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="divide-y divide-gray-100">
                {activities.map((activity) => (
                  <ActivityItem key={activity.id} {...activity} />
                ))}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-violet-600" />
              Insights
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-medium text-gray-900">Tasa de Completación</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">85%</p>
                <p className="text-sm text-gray-600 mt-1">
                  de candidatos completan las entrevistas
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium text-gray-900">Tiempo Promedio</h3>
                </div>
                <p className="text-2xl font-bold text-gray-900">18 minutos</p>
                <p className="text-sm text-gray-600 mt-1">por entrevista</p>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="w-5 h-5 text-violet-500" />
                  <h3 className="font-medium text-gray-900">Mejor Posición</h3>
                </div>
                <p className="text-lg font-bold text-gray-900">Desarrollador Frontend</p>
                <p className="text-sm text-gray-600 mt-1">(92% completación)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 