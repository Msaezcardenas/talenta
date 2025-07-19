'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, FileText, CheckCircle, Clock, Plus, UserCheck } from 'lucide-react'
import StatsCard from '@/components/admin/StatsCard'
import RecentActivityTable from '@/components/admin/RecentActivityTable'
import { createClient } from '@/lib/supabase/client'
import { DashboardStats, AssignmentWithDetails } from '@/lib/types/database'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    totalInterviews: 0,
    completedAssignments: 0,
    pendingAssignments: 0
  })
  const [recentAssignments, setRecentAssignments] = useState<AssignmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    const supabase = createClient()
    
    try {
      // Fetch stats
      const [candidatesResult, interviewsResult, assignmentsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('count', { count: 'exact' })
          .eq('role', 'candidate'),
        
        supabase
          .from('interviews')
          .select('count', { count: 'exact' }),
        
        supabase
          .from('assignments')
          .select('status')
      ])

      const completedCount = assignmentsResult.data?.filter(a => a.status === 'completed').length || 0
      const pendingCount = assignmentsResult.data?.filter(a => a.status === 'pending').length || 0

      setStats({
        totalCandidates: candidatesResult.count || 0,
        totalInterviews: interviewsResult.count || 0,
        completedAssignments: completedCount,
        pendingAssignments: pendingCount
      })

      // Fetch recent assignments with details
      const { data: assignments } = await supabase
        .from('assignments')
        .select(`
          *,
          interview:interviews(*),
          profile:profiles(*),
          responses(*)
        `)
        .order('assigned_at', { ascending: false })
        .limit(10)

      if (assignments) {
        // Fetch questions count for each interview
        const interviewIds = [...new Set(assignments.map(a => a.interview_id))]
        const { data: questions } = await supabase
          .from('questions')
          .select('interview_id')
          .in('interview_id', interviewIds)

        // Group questions by interview
        const questionsByInterview = questions?.reduce((acc, q) => {
          if (!acc[q.interview_id]) acc[q.interview_id] = []
          acc[q.interview_id].push(q)
          return acc
        }, {} as Record<string, any[]>) || {}

        // Add questions to interviews
        const assignmentsWithQuestions = assignments.map(assignment => ({
          ...assignment,
          interview: assignment.interview ? {
            ...assignment.interview,
            questions: questionsByInterview[assignment.interview_id] || []
          } : undefined
        }))

        setRecentAssignments(assignmentsWithQuestions as AssignmentWithDetails[])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Resumen de la actividad de entrevistas y candidatos
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/admin/assignments/new"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
          >
            <UserCheck className="w-5 h-5 mr-2" />
            Asignar Proceso
          </Link>
          <Link
            href="/admin/interviews/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Crear Nuevo Proceso
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Candidatos Activos"
          value={stats.totalCandidates}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          description="Total de candidatos registrados"
        />
        <StatsCard
          title="Entrevistas Creadas"
          value={stats.totalInterviews}
          icon={FileText}
          description="Total de pruebas disponibles"
        />
        <StatsCard
          title="Completadas"
          value={stats.completedAssignments}
          icon={CheckCircle}
          trend={{ value: 8, isPositive: true }}
          description="Entrevistas finalizadas"
        />
        <StatsCard
          title="Pendientes"
          value={stats.pendingAssignments}
          icon={Clock}
          description="En espera de respuesta"
        />
      </div>

      {/* Recent activity */}
      <RecentActivityTable assignments={recentAssignments} />
    </div>
  )
} 