'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Briefcase } from 'lucide-react'
import QuestionForm from '@/components/admin/QuestionForm'
import { createClient } from '@/lib/supabase/client'
import { Question } from '@/lib/types/database'

export default function NewInterviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [questions, setQuestions] = useState<Partial<Question>[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name.trim()) {
      setError('El nombre del cargo es requerido')
      return
    }
    
    if (questions.length === 0) {
      setError('Debes agregar al menos una pregunta')
      return
    }
    
    const invalidQuestions = questions.some(q => !q.question_text?.trim())
    if (invalidQuestions) {
      setError('Todas las preguntas deben tener texto')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // For testing purposes, if no user is authenticated, show a specific error
      if (!user) {
        setError('No hay usuario autenticado. Por favor inicia sesión primero.')
        setLoading(false)
        return
      }
      
      // Create interview
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          created_by: user.id
        })
        .select()
        .single()
      
      if (interviewError) throw interviewError
      
      // Create questions
      const questionsToInsert = questions.map((q, index) => {
        // Clean up options for multiple choice questions
        let cleanOptions = null
        if (q.type === 'multiple_choice' && q.options) {
          cleanOptions = (q.options as any[])
            .filter(opt => opt.label && opt.label.trim()) // Only include options with labels
            .map(opt => ({
              label: opt.label.trim(),
              value: opt.value?.trim() || opt.label.trim()
            }))
          
          // Validate that we have at least 2 options
          if (cleanOptions.length < 2) {
            throw new Error(`La pregunta "${q.question_text}" debe tener al menos 2 opciones`)
          }
        }
        
        return {
          interview_id: interview.id,
          question_text: q.question_text!.trim(),
          type: q.type!,
          options: cleanOptions,
          order_index: index
        }
      })
      
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)
      
      if (questionsError) {
        console.error('Error al crear preguntas:', questionsError)
        throw questionsError
      }
      
      // Redirect to interviews list
      router.push('/admin/interviews')
    } catch (err: any) {
      console.error('Error creating interview:', err)
      
      // Provide more specific error messages
      if (err.message?.includes('debe tener al menos 2 opciones')) {
        setError(err.message)
      } else if (err.code === 'PGRST301') {
        setError('Error de autenticación. Por favor inicia sesión nuevamente.')
      } else if (err.code === '23505') {
        setError('Ya existe una entrevista con ese nombre.')
      } else {
        setError(`Error al crear el proceso: ${err.message || 'Por favor intenta nuevamente.'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          GetonPro - Crear Nuevo Proceso
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Job Information Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Información del Cargo
            </h2>
            <p className="text-gray-600">
              Define los detalles básicos del puesto de trabajo
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Cargo
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Ej: Desarrollador Frontend Senior"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Cargo
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                rows={6}
                placeholder="Describe las responsabilidades, requisitos y beneficios del puesto..."
              />
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Preguntas del Proceso
            </h2>
            <p className="text-gray-600">
              Agrega las preguntas que los postulantes deberán responder
            </p>
          </div>

          <QuestionForm 
            questions={questions}
            onQuestionsChange={setQuestions}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Briefcase className="w-5 h-5" />
            <span>{loading ? 'Creando...' : 'Crear Proceso'}</span>
          </button>
        </div>
      </form>
    </div>
  )
} 