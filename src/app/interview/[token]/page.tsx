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

export default function InterviewAccessPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (token) {
      validateAccess()
    }
  }, [token])

  const validateAccess = async () => {
    try {
      console.log('Validating access for token:', token)
      
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

      console.log('Supabase response:', { data, error })

      if (error) {
        console.error('Supabase error:', error)
        if (error.code === 'PGRST116') {
          setError('La entrevista no existe o el enlace es incorrecto')
        } else {
          setError(`Error al cargar la entrevista: ${error.message}`)
        }
        return
      }

      if (!data) {
        setError('No se encontró la entrevista')
        return
      }

      if (data.status === 'completed') {
        // En lugar de mostrar error, marcamos como completada
        setIsCompleted(true)
        setAssignment(data)
        return
      }

      console.log('Assignment loaded successfully:', data)
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderBottomColor: '#5b4aef'}}></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16">
              <div className="flex items-center gap-3">
                {/* Logo de TalentaPro */}
                <div className="flex items-center gap-2">
                  {/* Nuevo logo profesional */}
                  {/* Logo TalentaPro con cuadrados personalizados */}
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm transform rotate-45" style={{background: '#5b4aef'}}></div>
                    <div className="w-3 h-3 rounded-sm transform rotate-45 -ml-1" style={{background: 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)'}}></div>
                  </div>
                  <div className="flex items-center -ml-0.5">
                    <div className="w-3 h-3 rounded-sm transform rotate-45" style={{background: 'linear-gradient(135deg, #fb33af 0%, #5b4aef 100%)'}}></div>
                    <div className="w-3 h-3 rounded-sm transform rotate-45 -ml-1" style={{background: '#fb33af'}}></div>
                  </div>
                  {/* Texto del logo */}
                  <div className="ml-1">
                    <span className="text-lg font-bold">
                      <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #5b4aef 0%, #fb33af 100%)'}}>Talenta</span>
                      <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #fb33af 0%, #5b4aef 100%)'}}>Pro</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center py-16 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* Estado de procesamiento */}
              <div className="text-center mb-8">
                <div className="relative inline-flex">
                  <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="absolute top-0 right-0 -mt-1 -mr-1">
                    <span className="flex h-6 w-6">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-6 w-6 bg-violet-500"></span>
                    </span>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
                ¡Tu entrevista está siendo procesada!
              </h2>
              
              <p className="text-gray-600 text-center mb-6">
                Hola {assignment?.user.first_name || 'Candidato'}, hemos recibido exitosamente tu entrevista.
              </p>

              {/* Timeline de proceso */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ¿Qué sigue ahora?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-violet-600 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">En proceso</p>
                      <p className="text-sm text-gray-600">Tu entrevista está siendo revisada por nuestro equipo de RRHH</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Próximamente</p>
                      <p className="text-sm text-gray-600">Te contactaremos en los próximos días hábiles</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info adicional */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm">
                    <p className="font-medium text-amber-900">Importante</p>
                    <p className="text-amber-700">Mantén tu información de contacto actualizada. Nos comunicaremos al email proporcionado.</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Si tienes alguna pregunta urgente, puedes contactarnos a través de nuestros canales oficiales.
                </p>
              </div>
            </div>

            {/* Card adicional con stats */}
            <div className="mt-6 bg-white rounded-xl shadow-md p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Resumen de tu entrevista</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-violet-600">✓</p>
                  <p className="text-sm text-gray-600">Completada</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-violet-600">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </p>
                  <p className="text-sm text-gray-600">En revisión</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center">
              {/* Logo de TalentaPro */}
              <div className="flex items-center gap-3">
                {/* Nuevo logo profesional */}
                {/* Logo TalentaPro con cuadrados personalizados */}
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-sm transform rotate-45" style={{background: '#5b4aef'}}></div>
                  <div className="w-5 h-5 rounded-sm transform rotate-45 -ml-2" style={{background: 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)'}}></div>
                </div>
                <div className="flex items-center -ml-1">
                  <div className="w-5 h-5 rounded-sm transform rotate-45" style={{background: 'linear-gradient(135deg, #fb33af 0%, #5b4aef 100%)'}}></div>
                  <div className="w-5 h-5 rounded-sm transform rotate-45 -ml-2" style={{background: '#fb33af'}}></div>
                </div>
                {/* Texto del logo */}
                <div className="ml-1">
                  <span className="text-3xl font-bold">
                    <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #5b4aef 0%, #fb33af 100%)'}}>Talenta</span>
                    <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #fb33af 0%, #5b4aef 100%)'}}>Pro</span>
                  </span>
                </div>
              </div>
            </div>
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