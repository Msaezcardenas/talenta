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
          color: 'text-amber-700 bg-gradient-to-r from-amber-50 to-orange-100 border-amber-300 shadow-amber-100'
        }
      case 'in_progress':
        return {
          icon: <Play className="w-4 h-4" />,
          text: 'En Progreso',
          color: 'bg-gradient-to-r from-indigo-50 to-purple-100 border-2 shadow-sm',
          style: { color: '#5b4aef', borderColor: '#5b4aef' }
        }
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Completada',
          color: 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-100 border-emerald-300 shadow-emerald-100'
        }
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Desconocido',
          color: 'text-gray-700 bg-gradient-to-r from-gray-50 to-slate-100 border-gray-300 shadow-gray-100'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderBottomColor: '#5b4aef'}}></div>
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
        <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-red-600 rounded-2xl p-8 mb-8 shadow-xl overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
          
          <div className="relative flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-3 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl transition-all hover:scale-105 shadow-lg text-white"
              title="Volver a candidatos"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Volver</span>
            </button>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">Candidato no encontrado</h1>
              <p className="text-red-100 text-lg">El candidato que buscas no existe o ha sido eliminado</p>
            </div>
          </div>
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
      <div className="relative rounded-2xl p-8 mb-8 shadow-xl overflow-hidden" style={{background: 'linear-gradient(135deg, #5b4aef 0%, #4a3bd8 50%, #5b4aef 100%)'}}>
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-3 px-4 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 rounded-xl transition-all hover:scale-105 shadow-lg text-white"
            title="Volver a candidatos"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Volver</span>
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">Detalles del Candidato</h1>
            <p className="text-white/90 text-lg">Información completa del candidato y sus entrevistas</p>
          </div>
        </div>
      </div>

      {/* Candidate Profile Card */}
      <Card className="border-0 shadow-lg" style={{background: 'linear-gradient(135deg, #faf9ff 0%, #ffffff 50%, #f8f7ff 100%)'}}>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg" style={{background: 'linear-gradient(135deg, #5b4aef 0%, #4a3bd8 100%)'}}>
              {candidate.first_name?.charAt(0) || candidate.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{candidateName}</h2>
              <p className="font-medium text-lg" style={{color: '#5b4aef'}}>{candidate.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Candidato activo</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm" style={{border: '1px solid #e4e0ff'}}>
              <div className="p-3 rounded-lg" style={{background: 'linear-gradient(135deg, #ede9ff 0%, #f7f5ff 100%)'}}>
                <User className="w-5 h-5" style={{color: '#5b4aef'}} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Nombre completo</p>
                <p className="font-semibold text-gray-900">{candidateName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm" style={{border: '1px solid #e4e0ff'}}>
              <div className="p-3 rounded-lg" style={{background: 'linear-gradient(135deg, #ede9ff 0%, #f7f5ff 100%)'}}>
                <Mail className="w-5 h-5" style={{color: '#5b4aef'}} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Email</p>
                <p className="font-semibold text-gray-900">{candidate.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm" style={{border: '1px solid #e4e0ff'}}>
              <div className="p-3 rounded-lg" style={{background: 'linear-gradient(135deg, #ede9ff 0%, #f7f5ff 100%)'}}>
                <Calendar className="w-5 h-5" style={{color: '#5b4aef'}} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Fecha de registro</p>
                <p className="font-semibold text-gray-900">{formatDate(candidate.created_at)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300" style={{background: 'linear-gradient(135deg, #faf9ff 0%, #f5f3ff 100%)'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide" style={{color: '#5b4aef'}}>Total Entrevistas</p>
                <p className="text-3xl font-bold mt-1" style={{color: '#5b4aef'}}>{totalInterviews}</p>
              </div>
              <div className="p-3 rounded-xl" style={{background: 'linear-gradient(135deg, #ede9ff 0%, #f7f5ff 100%)'}}>
                <FileText className="w-8 h-8" style={{color: '#5b4aef'}} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-100 hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide">Completadas</p>
                <p className="text-3xl font-bold text-emerald-800 mt-1">{completedInterviews}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300" style={{background: 'linear-gradient(135deg, #f0efff 0%, #e8e6ff 100%)'}}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide" style={{color: '#5b4aef'}}>En Progreso</p>
                <p className="text-3xl font-bold mt-1" style={{color: '#5b4aef'}}>{inProgressInterviews}</p>
              </div>
              <div className="p-3 rounded-xl" style={{background: 'linear-gradient(135deg, #d7d3ff 0%, #e8e6ff 100%)'}}>
                <Play className="w-8 h-8" style={{color: '#5b4aef'}} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-100 hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 uppercase tracking-wide">Pendientes</p>
                <p className="text-3xl font-bold text-amber-800 mt-1">{pendingInterviews}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments List */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-white rounded-t-lg" style={{background: 'linear-gradient(135deg, #5b4aef 0%, #4a3bd8 100%)'}}>
          <CardTitle className="flex items-center gap-3 text-white text-xl">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            Entrevistas Asignadas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No hay entrevistas asignadas</h3>
              <p className="text-gray-600 text-lg">Este candidato aún no tiene entrevistas asignadas</p>
            </div>
          ) : (
            <div className="space-y-6">
              {assignments.map((assignment) => {
                const statusInfo = getStatusInfo(assignment.status)
                const totalQuestions = assignment.interview?.questions?.length || 0
                const answeredQuestions = assignment.responses?.length || 0
                const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0

                return (
                  <div key={assignment.id} className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300" style={{border: '1px solid #e4e0ff', '--hover-border': '#5b4aef'}} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#5b4aef'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e4e0ff'}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            {assignment.interview?.name || 'Entrevista sin título'}
                          </h3>
                        </div>
                        <p className="text-gray-600 mb-4 text-base leading-relaxed">
                          {assignment.interview?.description || 'Sin descripción'}
                        </p>
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" style={{color: '#5b4aef'}} />
                            <span className="font-medium">Asignada:</span>
                            <span>{formatDate(assignment.assigned_at)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="w-4 h-4" style={{color: '#5b4aef'}} />
                            <span className="font-medium">{totalQuestions} pregunta{totalQuestions !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{answeredQuestions} respondida{answeredQuestions !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 ml-4">
                        <span 
                          className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${statusInfo.color} shadow-sm`}
                          style={statusInfo.style || {}}
                        >
                          {statusInfo.icon}
                          {statusInfo.text}
                        </span>
                        <button
                          onClick={() => router.push(`/admin/interviews/${assignment.interview?.id}/results?assignmentId=${assignment.id}`)}
                          className="p-3 text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
                          style={{background: 'linear-gradient(135deg, #5b4aef 0%, #4a3bd8 100%)'}}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #4a3bd8 0%, #3b2db8 100%)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #5b4aef 0%, #4a3bd8 100%)'}
                          title="Ver respuestas"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {totalQuestions > 0 && (
                      <div className="bg-white rounded-lg p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-semibold text-gray-700">Progreso de la entrevista</span>
                          <span className="text-lg font-bold" style={{color: '#5b4aef'}}>{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div 
                            className="h-3 rounded-full transition-all duration-500 shadow-sm"
                            style={{ 
                              width: `${progressPercentage}%`,
                              background: 'linear-gradient(135deg, #5b4aef 0%, #4a3bd8 100%)'
                            }}
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