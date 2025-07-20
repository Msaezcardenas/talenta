'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Video, FileText, CheckSquare, MessageSquare, List, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface Question {
  id: string
  question_text: string
  type: 'video' | 'text' | 'multiple_choice'
  options?: { label: string; value: string }[]
  order_index: number
}

const questionTypes = [
  { value: 'text', label: 'Texto', icon: MessageSquare, color: 'blue' },
  { value: 'video', label: 'Video', icon: Video, color: 'purple' },
  { value: 'multiple_choice', label: 'Selección Múltiple', icon: List, color: 'green' }
]

export default function EditInterviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deletedQuestions, setDeletedQuestions] = useState<string[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadInterview()
  }, [id])

  const loadInterview = async () => {
    try {
      const { data: interview, error } = await supabase
        .from('interviews')
        .select(`
          *,
          questions (*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      setName(interview.name)
      setDescription(interview.description || '')
      
      // Ordenar preguntas por order_index
      if (interview.questions) {
        interview.questions.sort((a: Question, b: Question) => a.order_index - b.order_index)
        setQuestions(interview.questions)
      }
    } catch (error) {
      console.error('Error loading interview:', error)
      toast.error('Error al cargar la entrevista')
      router.push('/admin/interviews')
    } finally {
      setLoading(false)
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
    
    if (updates.type === 'multiple_choice' && !updatedQuestions[index].options?.length) {
      updatedQuestions[index].options = [
        { label: '', value: 'option1' },
        { label: '', value: 'option2' }
      ]
    }
    
    setQuestions(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    const questionToRemove = questions[index]
    
    // Si es una pregunta existente (no temporal), agregarla a la lista de eliminadas
    if (!questionToRemove.id.startsWith('temp-')) {
      setDeletedQuestions([...deletedQuestions, questionToRemove.id])
    }
    
    const filtered = questions.filter((_, i) => i !== index)
    const reordered = filtered.map((q, i) => ({ ...q, order_index: i }))
    setQuestions(reordered)
  }

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex]
    if (!question.options) return
    
    const newOption = {
      label: '',
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
      toast.error('El nombre del proceso es requerido')
      return
    }
    
    if (questions.length === 0) {
      toast.error('Debes tener al menos una pregunta')
      return
    }
    
    if (questions.some(q => !q.question_text.trim())) {
      toast.error('Todas las preguntas deben tener texto')
      return
    }

    // Validar opciones múltiples
    for (const question of questions) {
      if (question.type === 'multiple_choice' && question.options) {
        const validOptions = question.options.filter(opt => opt.label.trim())
        if (validOptions.length < 2) {
          toast.error('Las preguntas de selección múltiple deben tener al menos 2 opciones')
          return
        }
      }
    }
    
    setSaving(true)
    const loadingToast = toast.loading('Actualizando entrevista...')
    
    try {
      // Actualizar información de la entrevista
      const { error: updateError } = await supabase
        .from('interviews')
        .update({
          name: name.trim(),
          description: description.trim()
        })
        .eq('id', id)
      
      if (updateError) throw updateError
      
      // Eliminar preguntas marcadas para eliminar
      if (deletedQuestions.length > 0) {
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .in('id', deletedQuestions)
        
        if (deleteError) throw deleteError
      }
      
      // Separar preguntas existentes y nuevas
      const existingQuestions = questions.filter(q => !q.id.startsWith('temp-'))
      const newQuestions = questions.filter(q => q.id.startsWith('temp-'))
      
      // Actualizar preguntas existentes
      for (const question of existingQuestions) {
        const { error } = await supabase
          .from('questions')
          .update({
            question_text: question.question_text.trim(),
            type: question.type,
            options: question.type === 'multiple_choice' && question.options 
              ? question.options.filter(opt => opt.label.trim()).map(opt => ({ ...opt, label: opt.label.trim() }))
              : null,
            order_index: question.order_index
          })
          .eq('id', question.id)
        
        if (error) throw error
      }
      
      // Insertar nuevas preguntas
      if (newQuestions.length > 0) {
        const questionsToInsert = newQuestions.map(q => ({
          interview_id: id,
          question_text: q.question_text.trim(),
          type: q.type,
          options: q.type === 'multiple_choice' && q.options 
            ? q.options.filter(opt => opt.label.trim()).map(opt => ({ ...opt, label: opt.label.trim() }))
            : null,
          order_index: q.order_index
        }))
        
        const { error: insertError } = await supabase
          .from('questions')
          .insert(questionsToInsert)
        
        if (insertError) throw insertError
      }
      
      toast.dismiss(loadingToast)
      toast.success('Entrevista actualizada exitosamente')
      router.push(`/admin/interviews/${id}`)
    } catch (error: any) {
      console.error('Error updating interview:', error)
      toast.dismiss(loadingToast)
      toast.error(error.message || 'Error al actualizar la entrevista')
    } finally {
      setSaving(false)
    }
  }

  const getQuestionTypeInfo = (type: string) => {
    return questionTypes.find(t => t.value === type) || questionTypes[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
          
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Editar Proceso
            </h1>
            <p className="text-gray-600">Modifica las características del puesto y las preguntas de evaluación</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-violet-600" />
              Información del Proceso
            </h2>
            
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Cargo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-gray-900 placeholder-gray-400"
                  placeholder="Ej: Desarrollador Full Stack"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all resize-none text-gray-900 placeholder-gray-400"
                  placeholder="Describe las responsabilidades, requisitos y lo que ofreces..."
                />
              </div>
            </div>
          </div>

          {/* Preguntas */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <CheckSquare className="w-6 h-6 mr-2 text-violet-600" />
                Preguntas de Evaluación
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Pregunta
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 rounded-full mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-gray-600 mb-4">No hay preguntas agregadas aún</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Crear Primera Pregunta
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const typeInfo = getQuestionTypeInfo(question.type)
                  const Icon = typeInfo.icon
                  
                  return (
                    <div key={question.id} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg bg-${typeInfo.color}-100 flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 text-${typeInfo.color}-600`} />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Pregunta {index + 1}</h3>
                            <p className="text-sm text-gray-500">{typeInfo.label}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <textarea
                          value={question.question_text}
                          onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-gray-900 placeholder-gray-400"
                          placeholder="Escribe tu pregunta aquí..."
                        />

                        <div className="flex gap-2">
                          {questionTypes.map((type) => {
                            const TypeIcon = type.icon
                            return (
                              <button
                                key={type.value}
                                type="button"
                                onClick={() => updateQuestion(index, { type: type.value as Question['type'] })}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                                  question.type === type.value
                                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                                }`}
                              >
                                <TypeIcon className="w-4 h-4" />
                                <span className="text-sm font-medium">{type.label}</span>
                              </button>
                            )
                          })}
                        </div>

                        {question.type === 'multiple_choice' && question.options && (
                          <div className="mt-4 space-y-2">
                            <label className="text-sm font-medium text-gray-700">Opciones de respuesta</label>
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-medium text-violet-600">{String.fromCharCode(65 + optionIndex)}</span>
                                </div>
                                <input
                                  type="text"
                                  value={option.label}
                                  onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-gray-900 placeholder-gray-400"
                                  placeholder={`Opción ${optionIndex + 1}`}
                                />
                                {question.options!.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => removeOption(index, optionIndex)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-all hover:scale-110"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addOption(index)}
                              className="mt-2 text-sm text-violet-600 hover:text-violet-700 font-medium"
                            >
                              + Agregar opción
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                
                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-violet-400 hover:text-violet-600 transition-all bg-white"
                >
                  <Plus className="w-5 h-5 mx-auto mb-1" />
                  Agregar otra pregunta
                </button>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium rounded-xl hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 