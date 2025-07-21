'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, useRouter } from 'next/navigation'
import { FileText, Video, Send, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Assignment {
  id: string
  interview_id: string
  user_id: string
  status: string
  interview: {
    id: string
    name: string
    description?: string
  }
  user: {
    id: string
    email: string
    first_name?: string
    last_name?: string
  }
}

export default function InterviewPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    validateAccess()
  }, [token])

  const validateAccess = async () => {
    try {
      // Buscar la asignación usando el token (que es el assignment ID)
      // No necesitamos autenticación porque el UUID es único y actúa como token de acceso
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          interview:interviews(*),
          user:profiles(*)
        `)
        .eq('id', token)
        .single()

      if (error || !data) {
        setError('Enlace inválido o expirado')
        return
      }

      if (data.status === 'completed') {
        setError('Esta entrevista ya ha sido completada')
        return
      }

      setAssignment(data)
    } catch (err) {
      console.error('Error validating access:', err)
      setError('Error al validar el acceso')
    } finally {
      setLoading(false)
    }
  }

  const startInterview = async () => {
    if (!assignment) return

    try {
      // Actualizar el estado a "in_progress" si aún está pendiente
      if (assignment.status === 'pending') {
        const { error } = await supabase
          .from('assignments')
          .update({ status: 'in_progress' })
          .eq('id', assignment.id)

        if (error) throw error
      }

      toast.success('¡Entrevista iniciada!')
      
      // Redirigir directamente a la página de entrevista del candidato
      // usando el assignment ID como identificador
      router.push(`/candidate/interview/${assignment.id}`)
    } catch (err) {
      console.error('Error starting interview:', err)
      toast.error('Error al iniciar la entrevista')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Talium
            </h1>
          </div>

          {/* Tarjeta de bienvenida */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <FileText className="w-16 h-16 text-violet-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Bienvenido a tu entrevista!
              </h2>
              <p className="text-gray-600">
                {assignment?.user.first_name 
                  ? `${assignment.user.first_name} ${assignment.user.last_name || ''}`
                  : assignment?.user.email}
              </p>
            </div>

            <div className="bg-violet-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                {assignment?.interview.name}
              </h3>
              {assignment?.interview.description && (
                <p className="text-gray-600 text-sm">
                  {assignment.interview.description}
                </p>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Video className="w-5 h-5 text-violet-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Formato de entrevista</p>
                  <p className="text-sm text-gray-600">
                    Responderás preguntas mediante video, texto o selección múltiple
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Importante</p>
                  <p className="text-sm text-gray-600">
                    Una vez que inicies, deberás completar toda la entrevista
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={startInterview}
              disabled={assignment?.status === 'in_progress'}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              {assignment?.status === 'in_progress' ? 'Continuar Entrevista' : 'Comenzar Entrevista'}
            </button>
          </div>

          {/* Nota de privacidad */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Tus respuestas serán grabadas y procesadas de forma segura y confidencial.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 