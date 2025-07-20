'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Question {
  id: string
  question_text: string
  type: 'video' | 'text' | 'multiple_choice'
  options?: { label: string; value: string }[]
  order_index: number
}

export default function NewInterviewPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        toast.error('No hay sesión activa. Redirigiendo al login...')
        router.push('/admin/login')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
      toast.error('Error al verificar la sesión')
      router.push('/admin/login')
    }
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      question_text: '',
      type: 'text',
      order_index: questions.length,
      options: []
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = [...questions]
    updatedQuestions[index] = { ...updatedQuestions[index], ...updates }
    
    // Si cambia a multiple_choice, inicializar opciones
    if (updates.type === 'multiple_choice' && !updatedQuestions[index].options?.length) {
      updatedQuestions[index].options = [
        { label: 'Opción 1', value: 'option1' },
        { label: 'Opción 2', value: 'option2' }
      ]
    }
    
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    const filtered = questions.filter((_, i) => i !== index)
    // Reajustar order_index
    const reordered = filtered.map((q, i) => ({ ...q, order_index: i }))
    setQuestions(reordered)
  }

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex]
    if (!question.options) return
    
    const newOption = {
      label: `Opción ${question.options.length + 1}`,
      value: `option${question.options.length + 1}`
    }
    
    updateQuestion(questionIndex, {
      options: [...question.options, newOption]
    })
  }

  const updateOption = (questionIndex: number, optionIndex: number, label: string) => {
    const question = questions[questionIndex]
    if (!question.options) return
    
    const updatedOptions = [...question.options]
    updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], label }
    
    updateQuestion(questionIndex, { options: updatedOptions })
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex]
    if (!question.options || question.options.length <= 2) return
    
    const updatedOptions = question.options.filter((_, i) => i !== optionIndex)
    updateQuestion(questionIndex, { options: updatedOptions })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('El nombre de la entrevista es requerido')
      return
    }
    
    if (questions.length === 0) {
      toast.error('Debes agregar al menos una pregunta')
      return
    }
    
    if (questions.some(q => !q.question_text.trim())) {
      toast.error('Todas las preguntas deben tener texto')
      return
    }

    if (!user) {
      toast.error('No hay usuario autenticado')
      router.push('/admin/login')
      return
    }
    
    setSaving(true)
    const loadingToast = toast.loading('Creando entrevista...')
    
    try {
      // Crear la entrevista
      const { data: interview, error: interviewError } = await supabase
        .from('interviews')
        .insert({
          name: name.trim(),
          description: description.trim(),
          created_by: user.id
        })
        .select()
        .single()
      
      if (interviewError) throw interviewError
      
      // Crear las preguntas
      const questionsToInsert = questions.map(q => ({
        interview_id: interview.id,
        question_text: q.question_text.trim(),
        type: q.type,
        options: q.type === 'multiple_choice' ? q.options : null,
        order_index: q.order_index
      }))
      
      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)
      
      if (questionsError) throw questionsError
      
      toast.dismiss(loadingToast)
      toast.success('Entrevista creada exitosamente')
      router.push('/admin/interviews')
    } catch (error: any) {
      console.error('Error creating interview:', error)
      toast.dismiss(loadingToast)
      toast.error(error.message || 'Error al crear la entrevista')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Nueva Entrevista</h1>
        <p className="text-gray-600 mt-2">Crea una nueva plantilla de entrevista</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Información básica */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la entrevista *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder="Ej: Entrevista para Desarrollador Frontend"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder="Describe el propósito y contexto de esta entrevista..."
              />
            </div>
          </div>
        </div>

        {/* Preguntas */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Preguntas</h2>
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar Pregunta
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No hay preguntas agregadas</p>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar primera pregunta
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-500">
                      Pregunta {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Texto de la pregunta *
                      </label>
                      <textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        placeholder="Escribe tu pregunta aquí..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de respuesta
                      </label>
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, { type: e.target.value as Question['type'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      >
                        <option value="text">Texto</option>
                        <option value="video">Video</option>
                        <option value="multiple_choice">Opción múltiple</option>
                      </select>
                    </div>

                    {question.type === 'multiple_choice' && question.options && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Opciones
                        </label>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                                placeholder={`Opción ${optionIndex + 1}`}
                              />
                              {question.options!.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(index, optionIndex)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addOption(index)}
                            className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                          >
                            + Agregar opción
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Creando...' : 'Crear Entrevista'}
          </button>
        </div>
      </form>
    </div>
  )
} 