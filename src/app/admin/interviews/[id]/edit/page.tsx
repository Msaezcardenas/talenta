'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import QuestionForm from '@/components/admin/QuestionForm'
import { createClient } from '@/lib/supabase/client'
import { Interview, Question } from '@/lib/types/database'

export default function EditInterviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [interview, setInterview] = useState<Interview | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInterview()
  }, [params.id])

  const fetchInterview = async () => {
    try {
      const supabase = createClient()
      
      // Fetch interview with questions
      const { data: interviewData, error: interviewError } = await supabase
        .from('interviews')
        .select(`
          *,
          questions(*)
        `)
        .eq('id', params.id)
        .single()
      
      if (interviewError) throw interviewError
      
      setInterview(interviewData)
      setFormData({
        name: interviewData.name,
        description: interviewData.description || ''
      })
      
      // Sort questions by order_index
      const sortedQuestions = (interviewData.questions || []).sort(
        (a: Question, b: Question) => a.order_index - b.order_index
      )
      setQuestions(sortedQuestions)
    } catch (err) {
      console.error('Error fetching interview:', err)
      setError('Error al cargar la entrevista')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('El nombre del cargo es requerido')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No hay usuario autenticado. Por favor inicia sesión primero.')
        setSaving(false)
        return
      }
      
      // Update interview
      const { error: updateError } = await supabase
        .from('interviews')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim()
        })
        .eq('id', params.id)
      
      if (updateError) throw updateError
      
      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('interview_id', params.id)
      
      if (deleteError) throw deleteError
      
      // Insert updated questions
      if (questions.length > 0) {
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
            interview_id: params.id,
            question_text: q.question_text,
            type: q.type,
            options: cleanOptions,
            order_index: index
          }
        })
        
        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert)
        
        if (questionsError) {
          console.error('Error al actualizar preguntas:', questionsError)
          throw questionsError
        }
      }
      
      router.push('/admin/interviews')
    } catch (err: any) {
      console.error('Error updating interview:', err)
      
      // Provide more specific error messages
      if (err.message?.includes('debe tener al menos 2 opciones')) {
        setError(err.message)
      } else if (err.code === 'PGRST301') {
        setError('Error de autenticación. Por favor inicia sesión nuevamente.')
      } else if (err.code === '23505') {
        setError('Ya existe una entrevista con ese nombre.')
      } else {
        setError(`Error al actualizar la entrevista: ${err.message || 'Por favor intenta nuevamente.'}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando entrevista...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <Link 
          href="/admin/interviews"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Entrevistas
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Editar Entrevista
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Información del Cargo
            </h2>
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900"
                rows={6}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Preguntas del Proceso
            </h2>
          </div>

          <QuestionForm 
            questions={questions}
            onQuestionsChange={(updatedQuestions) => setQuestions(updatedQuestions as Question[])}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <Link
            href="/admin/interviews"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  )
} 