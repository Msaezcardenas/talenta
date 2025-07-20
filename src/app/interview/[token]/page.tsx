'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Clock, FileText, CheckCircle } from 'lucide-react'

interface Assignment {
  id: string
  interview_id: string
  user_id: string
  status: string
  interview: {
    name: string
    description: string
    questions: any[]
  }
  candidate: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function InterviewPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    validateToken()
  }, [params.token])

  const validateToken = async () => {
    try {
      // Llamar a la función RPC para validar el token
      const { data, error } = await supabase.rpc('validate_and_access_assignment', {
        token: params.token
      })

      if (error || !data || data.length === 0) {
        setError('El enlace de invitación no es válido o ha expirado.')
        setLoading(false)
        return
      }

      // Cargar los detalles completos del assignment
      const assignmentData = data[0]
      
      // Cargar la entrevista con las preguntas
      const { data: interview } = await supabase
        .from('interviews')
        .select('*, questions(*)')
        .eq('id', assignmentData.interview_id)
        .single()

      // Cargar datos del candidato
      const { data: candidate } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', assignmentData.user_id)
        .single()

      setAssignment({
        id: assignmentData.assignment_id,
        interview_id: assignmentData.interview_id,
        user_id: assignmentData.user_id,
        status: assignmentData.status,
        interview: {
          name: assignmentData.interview_name,
          description: interview?.description || '',
          questions: interview?.questions || []
        },
        candidate: candidate || { first_name: '', last_name: '', email: '' }
      })

      // Si el estado es 'completed', redirigir a una página de finalización
      if (assignmentData.status === 'completed') {
        router.push(`/interview/${params.token}/completed`)
      }

    } catch (err: any) {
      console.error('Error validating token:', err)
      setError('Ocurrió un error al validar el acceso.')
    } finally {
      setLoading(false)
    }
  }

  const handleStartInterview = () => {
    // Aquí navegarías a la primera pregunta
    router.push(`/interview/${params.token}/question/0`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando acceso...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso no válido</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!assignment) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
            <h1 className="text-3xl font-bold text-gray-900 ml-2">GetonPro</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Bienvenido, {assignment.candidate.first_name}
          </h2>
        </div>

        {/* Interview Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {assignment.interview.name}
            </h3>
            {assignment.interview.description && (
              <p className="text-gray-600 max-w-2xl mx-auto">
                {assignment.interview.description}
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {assignment.interview.questions.length}
              </p>
              <p className="text-sm text-gray-600">Preguntas</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {assignment.interview.questions.length * 3}
              </p>
              <p className="text-sm text-gray-600">Minutos estimados</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">
                {assignment.status === 'pending' ? 'Pendiente' : 'En progreso'}
              </p>
              <p className="text-sm text-gray-600">Estado</p>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h4 className="font-semibold text-blue-900 mb-2">Instrucciones:</h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Asegúrate de estar en un lugar tranquilo y sin interrupciones</li>
              <li>• Ten una conexión a internet estable</li>
              <li>• Para las preguntas en video, permite el acceso a tu cámara y micrófono</li>
              <li>• Una vez que comiences, deberás completar toda la entrevista</li>
            </ul>
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={handleStartInterview}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
            >
              Comenzar Entrevista
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 