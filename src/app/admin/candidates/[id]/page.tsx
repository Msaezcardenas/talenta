'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Play,
  FileText
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CandidateProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  created_at: string
}

interface Assignment {
  id: string
  status: 'pending' | 'in_progress' | 'completed'
  assigned_at: string
  interview: {
    id: string
    name: string
    description?: string
    questions: Array<{
      id: string
      question_text: string
      type: string
      order_index: number
    }>
  }
  responses: Array<{
    id: string
    question_id: string
    data: any
    created_at: string
  }>
}

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string
  const supabase = createClientComponentClient()
  
  const [candidate, setCandidate] = useState<CandidateProfile | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (candidateId) {
      loadCandidateDetails()
    }
  }, [candidateId])

  const loadCandidateDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      // Cargar perfil del candidato
      const { data: candidateData, error: candidateError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', candidateId)
        .eq('role', 'candidate')
        .single()

      if (candidateError) throw new Error(`Error cargando candidato: ${candidateError.message}`)
      if (!candidateData) throw new Error('Candidato no encontrado')

      setCandidate(candidateData)

      // Cargar asignaciones con detalles completos
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          status,
          assigned_at,
          interview:interviews(
            id,
            name,
            description,
            questions(id, question_text, type, order_index)
          ),
          responses(
            id,
            question_id,
            data,
            created_at
          )
        `)
        .eq('user_id', candidateId)
        .order('assigned_at', { ascending: false })

      if (assignmentsError) throw new Error(`Error cargando asignaciones: ${assignmentsError.message}`)

      setAssignments(assignmentsData || [])

    } catch (err: any) {
      console.error('Error loading candidate details:', err)
      setError(err.message || 'Error cargando detalles del candidato')
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          text: 'Pendiente',
          color: 'text-amber-600 bg-amber-50 border-amber-200'
        }
      case 'in_progress':
        return {
          icon: <Play className="w-4 h-4" />,
          text: 'En Progreso',
          color: 'text-blue-600 bg-blue-50 border-blue-200'
        }
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Completada',
          color: 'text-green-600 bg-green-50 border-green-200'
        }
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Desconocido',
          color: 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Error</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Error cargando candidato</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button 
                  onClick={loadCandidateDetails}
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

  if (!candidate) {
    return (
      <div className="space-y-8 py-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Candidato no encontrado</h1>
        </div>
      </div>
    )
  }

  const candidateName = candidate.first_name && candidate.last_name 
    ? `${candidate.first_name} ${candidate.last_name}`
    : 'Sin nombre'

  const totalInterviews = assignments.length
  const completedInterviews = assignments.filter(a => a.status === 'completed').length
  const pendingInterviews = assignments.filter(a => a.status === 'pending').length
  const inProgressInterviews = assignments.filter(a => a.status === 'in_progress').length

  return (
    <div className="space-y-8 py-8">
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Volver a candidatos"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Detalles del Candidato</h1>
          <p className="text-gray-600 mt-1">Información completa del candidato y sus entrevistas</p>
        </div>
      </div>

      {/* Candidate Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {candidate.first_name?.charAt(0) || candidate.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{candidateName}</h2>
              <p className="text-gray-600 font-normal">{candidate.email}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Nombre completo</p>
                <p className="font-medium">{candidateName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{candidate.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Fecha de registro</p>
                <p className="font-medium">{formatDate(candidate.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entrevistas</p>
                <p className="text-2xl font-bold text-gray-900">{totalInterviews}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{completedInterviews}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressInterviews}</p>
              </div>
              <Play className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600">{pendingInterviews}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Entrevistas Asignadas</CardTitle>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay entrevistas asignadas</h3>
              <p className="text-gray-600">Este candidato aún no tiene entrevistas asignadas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const statusInfo = getStatusInfo(assignment.status)
                const totalQuestions = assignment.interview?.questions?.length || 0
                const answeredQuestions = assignment.responses?.length || 0
                const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

                return (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {assignment.interview?.name || 'Entrevista sin título'}
                        </h3>
                        <p className="text-gray-600 mb-3">
                          {assignment.interview?.description || 'Sin descripción'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Asignada: {formatDate(assignment.assigned_at)}</span>
                          <span>•</span>
                          <span>{totalQuestions} pregunta{totalQuestions !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{answeredQuestions} respondida{answeredQuestions !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.text}
                        </span>
                        <button
                          onClick={() => router.push(`/admin/interviews/${assignment.interview?.id}/results?assignmentId=${assignment.id}`)}
                          className="p-2 text-violet-600 hover:text-violet-900 hover:bg-violet-50 rounded-lg transition-all"
                          title="Ver respuestas"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {totalQuestions > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Progreso de la entrevista</span>
                          <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}