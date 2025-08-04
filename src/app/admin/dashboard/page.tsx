'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import {
  Users,
  Clock,
  Plus,
  UserPlus,
  Eye,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from 'lucide-react'
import { ActionCard } from '@/components/dashboard/ActionCard'
import { InterviewCard } from '@/components/dashboard/InterviewCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EnhancedStats {
  totalInterviews: number
  activeCandidates: number
  completedToday: number
  activeProcesses: number
}

interface Assignment {
  id: string
  status: string
  assigned_at: string
  user_id?: string
  profiles?: {
    first_name: string | null
    last_name: string | null
    email: string
  }
}

interface Interview {
  id: string
  name: string
  description?: string
  created_at: string
  assignments?: Assignment[]
  questions?: { id: string }[]
}

interface InterviewCardData {
  id: string
  title: string
  position: string
  candidates: number
  completed: number
  date: string
  status: 'active' | 'completed'
  completionRate: number
}





export default function EnhancedDashboardPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [stats, setStats] = useState<EnhancedStats>({
    totalInterviews: 0,
    activeCandidates: 0,
    completedToday: 0,
    activeProcesses: 0,
  })
  const [interviews, setInterviews] = useState<InterviewCardData[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEnhancedDashboardData()
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
              assigned_at,
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

      const interviewsData = interviewsResult.data || []
      const assignments = assignmentsResult.data || []
      const responses = responsesResult.data || []

      // Calcular fecha de hoy e inicio de semana
      const today = new Date()
      const todayISO = today.toISOString().split('T')[0]
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Cálculos mejorados
      const totalInterviews = interviewsData.length
      
      // Candidatos realmente activos (no completados, no cancelados)
      const activeCandidates = assignments.filter(a => 
        a.status === 'pending' || a.status === 'in_progress'
      ).length
      
      // Completadas hoy - verificar cuándo se completaron realmente usando responses
      const completedToday = assignments.filter(a => {
        if (a.status !== 'completed') return false
        
        // Encontrar la respuesta más reciente de esta asignación
        const assignmentResponses = responses.filter(r => r.assignment_id === a.id)
        if (assignmentResponses.length === 0) return false
        
        // La fecha de la respuesta más reciente indica cuándo se completó
        const latestResponse = assignmentResponses.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
        
        return latestResponse.created_at.startsWith(todayISO)
      }).length
      
      // Procesos activos (entrevistas con al menos una asignación no completada)
      const activeProcesses = interviewsData.filter(interview => {
        const interviewAssignments = interview.assignments || []
        return interviewAssignments.some((a: Assignment) => a.status !== 'completed' && a.status !== 'cancelled')
      }).length
      


      setStats({
        totalInterviews,
        activeCandidates,
        completedToday,
        activeProcesses,
      })

      // Mapear entrevistas para las cards
      if (interviewsData.length > 0) {
        const mappedInterviews: InterviewCardData[] = interviewsData.slice(0, 3).map(interview => {
          const interviewAssignments = interview.assignments || []
          const totalCandidates = interviewAssignments.length
          const completedCount = interviewAssignments.filter((a: Assignment) => a.status === 'completed').length
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





  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderBottomColor: '#5b4aef'}}></div>
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

      {/* Stats Grid - Original 4 metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Entrevistas Totales
            </CardTitle>
            <Building2 className="h-5 w-5" style={{color: '#5b4aef'}} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.totalInterviews}</div>
            <p className="text-sm text-gray-600 mt-1">
              Procesos de entrevista creados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Candidatos Activos
            </CardTitle>
            <Users className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeCandidates}</div>
            <p className="text-sm text-gray-600 mt-1">
              Candidatos con entrevistas asignadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Completadas Hoy
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.completedToday}</div>
            <p className="text-sm text-gray-600 mt-1">
              Entrevistas finalizadas hoy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Procesos Activos
            </CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.activeProcesses}</div>
            <p className="text-sm text-gray-600 mt-1">
              Con candidatos en proceso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Plus className="w-5 h-5" style={{color: '#5b4aef'}} />
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            icon={<Plus className="w-5 h-5" style={{color: '#5b4aef'}} />}
            iconBg="bg-violet-100"
            iconColor=""
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
            className="text-sm font-medium text-[#5b4aef] hover:text-[#4a3bd8] transition-colors"
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
  )
}