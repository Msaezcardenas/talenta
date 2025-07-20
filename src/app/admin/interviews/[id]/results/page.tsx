'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, User, Calendar, Clock, Video, MessageSquare, List, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Interview {
  id: string
  name: string
  description?: string
}

interface Question {
  id: string
  question_text: string
  type: 'video' | 'text' | 'multiple_choice'
  options?: any
  order_index: number
}

interface Assignment {
  id: string
  status: string
  assigned_at: string
  user: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

interface Response {
  id: string
  question_id: string
  data: any
  created_at: string
}

const questionTypeIcons = {
  text: { icon: MessageSquare, label: 'Texto', color: 'blue' },
  video: { icon: Video, label: 'Video', color: 'purple' },
  multiple_choice: { icon: List, label: 'Selección Múltiple', color: 'green' }
}

export default function InterviewResultsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [interview, setInterview] = useState<Interview | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingResponses, setLoadingResponses] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadInterview()
  }, [id])

  useEffect(() => {
    if (selectedAssignment) {
      loadResponses(selectedAssignment.id)
    }
  }, [selectedAssignment])

  const loadInterview = async () => {
    try {
      // Cargar entrevista
      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .select('*')
        .eq('id', id)
        .single()

      if (interviewError) throw interviewError
      setInterview(interviewData)

      // Cargar preguntas
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('interview_id', id)
        .order('order_index')

      if (questionsError) throw questionsError
      setQuestions(questionsData || [])

      // Cargar asignaciones completadas
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          user:profiles(id, email, first_name, last_name)
        `)
        .eq('interview_id', id)
        .eq('status', 'completed')
        .order('assigned_at', { ascending: false })

      if (assignmentsError) throw assignmentsError
      setAssignments(assignmentsData || [])

      // Seleccionar la primera asignación por defecto
      if (assignmentsData && assignmentsData.length > 0) {
        setSelectedAssignment(assignmentsData[0])
      }
    } catch (error) {
      console.error('Error loading interview:', error)
      toast.error('Error al cargar la entrevista')
      router.push('/admin/interviews')
    } finally {
      setLoading(false)
    }
  }

  const loadResponses = async (assignmentId: string) => {
    setLoadingResponses(true)
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('assignment_id', assignmentId)

      if (error) throw error
      setResponses(data || [])
    } catch (error) {
      console.error('Error loading responses:', error)
      toast.error('Error al cargar las respuestas')
    } finally {
      setLoadingResponses(false)
    }
  }

  const getResponseForQuestion = (questionId: string) => {
    return responses.find(r => r.question_id === questionId)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (!interview) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/interviews')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-all hover:translate-x-[-4px] group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-[-2px]" />
          Volver a Entrevistas
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{interview.name} - Resultados</h1>
          {interview.description && (
            <p className="text-gray-600 text-lg">{interview.description}</p>
          )}
          <div className="mt-4 text-sm text-gray-500">
            {assignments.length} entrevistas completadas
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay entrevistas completadas</h3>
          <p className="text-gray-600">Los resultados aparecerán aquí cuando los candidatos completen sus entrevistas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de candidatos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Candidatos</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => setSelectedAssignment(assignment)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedAssignment?.id === assignment.id ? 'bg-violet-50 border-l-4 border-violet-600' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                        {assignment.user.first_name?.charAt(0) || assignment.user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {assignment.user.first_name && assignment.user.last_name
                            ? `${assignment.user.first_name} ${assignment.user.last_name}`
                            : assignment.user.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{assignment.user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(assignment.assigned_at).toLocaleDateString('es-ES')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Respuestas del candidato seleccionado */}
          <div className="lg:col-span-2">
            {selectedAssignment ? (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {selectedAssignment.user.first_name && selectedAssignment.user.last_name
                          ? `${selectedAssignment.user.first_name} ${selectedAssignment.user.last_name}`
                          : selectedAssignment.user.email}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">{selectedAssignment.user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                      Completada
                    </div>
                  </div>
                </div>

                {loadingResponses ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="p-6 space-y-6">
                    {questions.map((question, index) => {
                      const response = getResponseForQuestion(question.id)
                      const typeInfo = questionTypeIcons[question.type]
                      const Icon = typeInfo.icon

                      return (
                        <div key={question.id} className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`w-10 h-10 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`w-5 h-5 text-${typeInfo.color}-600`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-medium text-gray-900">Pregunta {index + 1}</span>
                                <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                  {typeInfo.label}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-4">{question.question_text}</p>

                              {/* Respuesta */}
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                {response ? (
                                  <>
                                    {question.type === 'text' && (
                                      <p className="text-gray-800">{response.data.text || 'Sin respuesta'}</p>
                                    )}
                                    
                                    {question.type === 'video' && (
                                      <div>
                                        {response.data.video_url ? (
                                          <div className="space-y-4">
                                            <video
                                              src={response.data.video_url}
                                              controls
                                              className="w-full rounded-lg max-h-96"
                                            />
                                            {response.data.transcription && (
                                              <div className="p-4 bg-gray-50 rounded-lg">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Transcripción:</p>
                                                <p className="text-sm text-gray-600">{response.data.transcription}</p>
                                              </div>
                                            )}
                                          </div>
                                        ) : (
                                          <p className="text-gray-500">Sin video</p>
                                        )}
                                      </div>
                                    )}
                                    
                                    {question.type === 'multiple_choice' && (
                                      <div>
                                        {response.data.selected_option ? (
                                          <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center">
                                              <span className="text-xs font-medium text-violet-600">
                                                {String.fromCharCode(65 + (question.options?.findIndex((opt: any) => opt.value === response.data.selected_option) || 0))}
                                              </span>
                                            </div>
                                            <span className="text-gray-800">
                                              {question.options?.find((opt: any) => opt.value === response.data.selected_option)?.label || response.data.selected_option}
                                            </span>
                                          </div>
                                        ) : (
                                          <p className="text-gray-500">Sin respuesta</p>
                                        )}
                                      </div>
                                    )}

                                    <div className="mt-3 text-xs text-gray-500">
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {formatDate(response.created_at)}
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-gray-500 italic">No respondida</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Selecciona un candidato para ver sus respuestas</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 