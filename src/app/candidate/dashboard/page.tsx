'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Circle, FileText, Clock, CheckCircle, PlayCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AssignmentWithDetails } from '@/lib/types/database'

export default function CandidateDashboard() {
  const router = useRouter()
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    checkAuthAndFetchData()
    
    // Refresh data when returning to the page (e.g., after completing an interview)
    const handleFocus = () => {
      checkAuthAndFetchData()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const checkAuthAndFetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }

    setUserEmail(user.email || '')

    // Fetch assignments for the current candidate
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          interview:interviews(*, questions(*)),
          responses(*)
        `)
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false })

      if (!error && data) {
        // Process each assignment to ensure proper response counting
        for (const assignment of data) {
          if (assignment.responses && assignment.interview?.questions) {
            // Create a map of responses by question_id for efficient lookup
            const responseMap = new Map()
            
            // Keep only the most recent response per question
            assignment.responses.forEach((response: any) => {
              const existing = responseMap.get(response.question_id)
              if (!existing || new Date(response.updated_at) > new Date(existing.updated_at)) {
                responseMap.set(response.question_id, response)
              }
            })
            
            // Convert map back to array
            assignment.responses = Array.from(responseMap.values())
            
            // Verify we have responses for all questions if status is completed
            if (assignment.status === 'completed') {
              const questionIds = new Set(assignment.interview.questions.map((q: any) => q.id))
              const respondedQuestionIds = new Set(assignment.responses.map((r: any) => r.question_id))
              
              // Log for debugging
              console.log(`Assignment ${assignment.id}: ${respondedQuestionIds.size}/${questionIds.size} questions answered`)
            }
          }
        }
      }

      if (error) throw error

      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartProcess = (assignmentId: string) => {
    router.push(`/candidate/interview/${assignmentId}`)
  }

  const getStatusInfo = (status: string) => {
    const statusConfig = {
              pending: { 
          bg: 'bg-yellow-50', 
          text: 'text-yellow-700',
          border: 'border-yellow-200',
          icon: Clock,
          label: 'Pendiente',
          action: 'Comenzar'
        },
        in_progress: { 
          bg: 'bg-blue-50', 
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: PlayCircle,
          label: 'En Progreso',
          action: 'Continuar'
        },
        completed: { 
          bg: 'bg-green-50', 
          text: 'text-green-700',
          border: 'border-green-200',
          icon: CheckCircle,
          label: 'Completado',
          action: 'Entrevista Completada'
        }
    }
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tus procesos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex">
                <Circle className="w-6 h-6 text-pink-500 fill-pink-500" />
                <Circle className="w-6 h-6 text-purple-500 fill-purple-500 -ml-1.5" />
                <Circle className="w-6 h-6 text-blue-500 fill-blue-500 -ml-1.5" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">GetonPro</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{userEmail}</span>
              <button
                onClick={async () => {
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  router.push('/')
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Mis Procesos de Postulación
            </h2>
            <p className="text-gray-600">
              Aquí encontrarás todos los procesos a los que has sido asignado
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true)
              checkAuthAndFetchData().finally(() => setLoading(false))
            }}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes procesos asignados
            </h3>
            <p className="text-gray-600">
              Cuando tu empresa te asigne un proceso de entrevista, aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => {
              const statusInfo = getStatusInfo(assignment.status)
              const Icon = statusInfo.icon
              const totalQuestions = assignment.interview?.questions?.length || 0
              const answeredQuestions = assignment.responses?.length || 0
              const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
              
              // Ensure 100% progress for completed assignments
              const displayProgress = assignment.status === 'completed' ? 100 : progress
              const displayAnswered = assignment.status === 'completed' ? totalQuestions : answeredQuestions

              return (
                <div
                  key={assignment.id}
                  className={`bg-white rounded-xl shadow-sm border-2 ${statusInfo.border} p-6 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {assignment.interview?.name || 'Sin título'}
                      </h3>
                      {assignment.interview?.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {assignment.interview.description}
                        </p>
                      )}
                    </div>
                    <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                      <Icon className={`w-5 h-5 ${statusInfo.text}`} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progreso</span>
                        <span className="font-medium text-gray-900">{displayProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${displayProgress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Estado</span>
                      <span className={`font-medium ${statusInfo.text}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Preguntas</span>
                      <span className="font-medium text-gray-900">
                        {displayAnswered} de {totalQuestions}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartProcess(assignment.id)}
                    disabled={assignment.status === 'completed'}
                    className={`w-full mt-6 py-2.5 px-4 rounded-lg font-medium transition-colors ${
                      assignment.status === 'completed'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                    }`}
                  >
                    {statusInfo.action}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
} 