'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileText, Video, MessageSquare, List, Users, Calendar, Edit } from 'lucide-react'
import toast from 'react-hot-toast'

interface Interview {
  id: string
  name: string
  description?: string
  created_at: string
  questions: Question[]
}

interface Question {
  id: string
  question_text: string
  type: 'video' | 'text' | 'multiple_choice'
  options?: any
  order_index: number
}

const questionTypeIcons = {
  text: { icon: MessageSquare, label: 'Texto', color: 'blue' },
  video: { icon: Video, label: 'Video', color: 'purple' },
  multiple_choice: { icon: List, label: 'Selección Múltiple', color: 'green' }
}

export default function InterviewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const [assignmentCount, setAssignmentCount] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadInterview()
  }, [id])

  const loadInterview = async () => {
    try {
      // Cargar entrevista con preguntas
      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .select(`
          *,
          questions (*)
        `)
        .eq('id', id)
        .single()

      if (interviewError) throw interviewError

      // Ordenar preguntas por order_index
      if (interviewData.questions) {
        interviewData.questions.sort((a: Question, b: Question) => a.order_index - b.order_index)
      }

      setInterview(interviewData)

      // Contar asignaciones
      const { count } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('interview_id', id)

      setAssignmentCount(count || 0)
    } catch (error) {
      console.error('Error loading interview:', error)
      toast.error('Error al cargar la entrevista')
      router.push('/admin/interviews')
    } finally {
      setLoading(false)
    }
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
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-all hover:translate-x-[-4px] group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:translate-x-[-2px]" />
          Volver
        </button>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{interview.name}</h1>
              {interview.description && (
                <p className="text-gray-600 text-lg">{interview.description}</p>
              )}
            </div>
            <button
              onClick={() => router.push(`/admin/interviews/${id}/edit`)}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all hover:scale-105 hover:shadow-md group"
            >
              <Edit className="w-4 h-4 mr-2 group-hover:text-violet-600 transition-colors" />
              Editar
            </button>
          </div>

          <div className="flex items-center gap-6 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Creada el {new Date(interview.created_at).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{assignmentCount} candidatos asignados</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{interview.questions?.length || 0} preguntas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preguntas */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Preguntas de la Entrevista</h2>

        {!interview.questions || interview.questions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay preguntas en esta entrevista</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interview.questions.map((question, index) => {
              const typeInfo = questionTypeIcons[question.type]
              const Icon = typeInfo.icon

              return (
                <div key={question.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <div className="flex items-start gap-4">
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
                      <p className="text-gray-700">{question.question_text}</p>

                      {question.type === 'multiple_choice' && question.options && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-gray-600 mb-2">Opciones:</p>
                          {question.options.map((option: any, optIndex: number) => (
                            <div key={optIndex} className="flex items-center gap-2 text-sm">
                              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-violet-600">
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                              </div>
                              <span className="text-gray-600">{option.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="mt-8 flex justify-end gap-4">
        <button
          onClick={() => router.push('/admin/assignments')}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-md"
        >
          Asignar Candidatos
        </button>
      </div>
    </div>
  )
}