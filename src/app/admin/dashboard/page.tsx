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
  Award
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ActionCard } from '@/components/dashboard/ActionCard'
import { InterviewCard } from '@/components/dashboard/InterviewCard'
import { ActivityItem } from '@/components/dashboard/ActivityItem'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState({
    activeInterviews: 0,
    totalCandidates: 0,
    completedToday: 0,
    averageTime: 0,
    activeChange: 0,
    candidatesChange: 0,
    completedChange: 0,
    timeChange: 0
  })
  const [interviews, setInterviews] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Cargar estadísticas
      const { data: interviewProcesses } = await supabase
        .from('interview_processes')
        .select('*, candidate_interviews(*), questions(*)')

      const { data: candidatesData } = await supabase
        .from('candidate_interviews')
        .select('*')

      const { data: todayCompleted } = await supabase
        .from('candidate_interviews')
        .select('*')
        .eq('status', 'completed')
        .gte('completed_at', new Date().toISOString().split('T')[0])

      // Calcular estadísticas
      const activeInterviews = interviewProcesses?.filter(p => p.is_active).length || 0
      const totalCandidates = candidatesData?.length || 0
      const completedToday = todayCompleted?.length || 0

      setStats({
        activeInterviews,
        totalCandidates,
        completedToday,
        averageTime: 18,
        activeChange: 12,
        candidatesChange: 8,
        completedChange: 23,
        timeChange: -5
      })

      // Cargar entrevistas recientes
      if (interviewProcesses) {
        const recentInterviews = interviewProcesses.slice(0, 3).map(interview => {
          const candidates = interview.candidate_interviews?.length || 0
          const completed = interview.candidate_interviews?.filter((c: any) => c.status === 'completed').length || 0
          const completionRate = candidates > 0 ? Math.round((completed / candidates) * 100) : 0

          return {
            id: interview.id,
            title: interview.title,
            position: interview.position || 'Sin especificar',
            candidates,
            completed,
            date: new Date(interview.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' }),
            status: interview.is_active ? 'active' : 'completed',
            completionRate
          }
        })
        setInterviews(recentInterviews)
      }

      // Cargar actividades recientes
      const { data: recentActivities } = await supabase
        .from('interview_responses')
        .select('*, candidate_interviews(*, candidates(*)), questions(*)')
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentActivities) {
        const activities = recentActivities.map(activity => {
          const candidate = activity.candidate_interviews?.candidates
          const question = activity.questions
          const timeAgo = getTimeAgo(new Date(activity.created_at))

          return {
            id: activity.id,
            type: 'response' as const,
            title: 'Nueva respuesta recibida',
            subtitle: `${candidate?.first_name || 'Candidato'} ${candidate?.last_name || ''} - ${question?.title || 'Pregunta'}`,
            time: timeAgo
          }
        })
        setActivities(activities)
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          Bienvenido, Admin <span className="text-3xl">👋</span>
        </h1>
        <p className="text-gray-600 mt-2">Gestiona tus procesos de selección desde un solo lugar</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Entrevistas Activas"
          value={stats.activeInterviews}
          change={stats.activeChange}
          changeText="vs mes anterior"
          icon={<FileText className="w-5 h-5" />}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatsCard
          title="Candidatos Totales"
          value={stats.totalCandidates}
          change={stats.candidatesChange}
          changeText="vs mes anterior"
          icon={<Users className="w-5 h-5" />}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatsCard
          title="Completadas Hoy"
          value={stats.completedToday}
          change={stats.completedChange}
          changeText="vs mes anterior"
          icon={<CheckCircle className="w-5 h-5" />}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatsCard
          title="Tiempo Promedio"
          value={`${stats.averageTime}m`}
          change={stats.timeChange}
          changeText="vs mes anterior"
          icon={<Clock className="w-5 h-5" />}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Actions and Interviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Acciones Rápidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ActionCard
                icon={<Plus className="w-5 h-5" />}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                title="Crear Entrevista"
                description="Nueva plantilla de entrevista"
                onClick={() => router.push('/admin/interviews/new')}
              />
              <ActionCard
                icon={<UserPlus className="w-5 h-5" />}
                iconBg="bg-green-100"
                iconColor="text-green-600"
                title="Asignar Candidatos"
                description="Enviar invitaciones masivas"
                onClick={() => router.push('/admin/assignments')}
              />
              <ActionCard
                icon={<Eye className="w-5 h-5" />}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                title="Ver Respuestas"
                description="Revisar entrevistas completadas"
                onClick={() => router.push('/admin/interviews')}
              />
              <ActionCard
                icon={<Send className="w-5 h-5" />}
                iconBg="bg-orange-100"
                iconColor="text-orange-600"
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
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
              <Clock className="w-5 h-5 text-green-600" />
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
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Insights
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <Target className="w-5 h-5 text-green-500" />
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
                  <Award className="w-5 h-5 text-purple-500" />
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