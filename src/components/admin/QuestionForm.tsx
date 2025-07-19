'use client'

import { useState } from 'react'
import { X, Plus, Video, FileText, CheckSquare } from 'lucide-react'
import { Question, QuestionType } from '@/lib/types/database'

interface QuestionFormProps {
  questions: Partial<Question>[]
  onQuestionsChange: (questions: Partial<Question>[]) => void
}

const questionTypeOptions = [
  { value: 'text', label: 'Respuesta de Texto', icon: FileText },
  { value: 'video', label: 'Respuesta en Video', icon: Video },
  { value: 'multiple_choice', label: 'Opción Múltiple', icon: CheckSquare }
] as const

export default function QuestionForm({ questions, onQuestionsChange }: QuestionFormProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false)

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Partial<Question> = {
      question_text: '',
      type,
      order_index: questions.length,
      options: type === 'multiple_choice' ? [] : undefined
    }
    onQuestionsChange([...questions, newQuestion])
    setShowTypeSelector(false)
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updatedQuestions = questions.map((q, i) => 
      i === index ? { ...q, ...updates } : q
    )
    onQuestionsChange(updatedQuestions)
  }

  const removeQuestion = (index: number) => {
    const filteredQuestions = questions.filter((_, i) => i !== index)
    // Reorder indices
    const reorderedQuestions = filteredQuestions.map((q, i) => ({
      ...q,
      order_index: i
    }))
    onQuestionsChange(reorderedQuestions)
  }

  const addOption = (questionIndex: number) => {
    const question = questions[questionIndex]
    const currentOptions = (question.options as any[]) || []
    const newOption = { id: Date.now(), label: '', value: '' }
    updateQuestion(questionIndex, {
      options: [...currentOptions, newOption]
    })
  }

  const updateOption = (questionIndex: number, optionIndex: number, updates: any) => {
    const question = questions[questionIndex]
    const options = [...(question.options as any[])]
    options[optionIndex] = { ...options[optionIndex], ...updates }
    updateQuestion(questionIndex, { options })
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex]
    const options = (question.options as any[]).filter((_, i) => i !== optionIndex)
    updateQuestion(questionIndex, { options })
  }

  const getQuestionIcon = (type: QuestionType) => {
    const option = questionTypeOptions.find(opt => opt.value === type)
    return option?.icon || FileText
  }

  const getQuestionLabel = (type: QuestionType) => {
    const option = questionTypeOptions.find(opt => opt.value === type)
    return option?.label || 'Pregunta'
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const Icon = getQuestionIcon(question.type!)
        return (
          <div key={index} className="border border-gray-200 rounded-lg p-6 bg-white">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Pregunta {index + 1}</h4>
                  <p className="text-sm text-gray-500">{getQuestionLabel(question.type!)}</p>
                </div>
              </div>
              <button
                onClick={() => removeQuestion(index)}
                className="text-gray-400 hover:text-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Texto de la pregunta
                </label>
                <textarea
                  value={question.question_text}
                  onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                  rows={3}
                  placeholder="Escribe aquí la pregunta que verá el candidato..."
                />
              </div>

              {question.type === 'multiple_choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opciones de respuesta
                  </label>
                  <div className="space-y-2">
                    {(question.options as any[])?.map((option, optionIndex) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => updateOption(index, optionIndex, { label: e.target.value, value: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          placeholder={`Opción ${optionIndex + 1}`}
                        />
                        <button
                          onClick={() => removeOption(index, optionIndex)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addOption(index)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Agregar opción
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {!showTypeSelector ? (
        <button
          onClick={() => setShowTypeSelector(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Agregar Pregunta</span>
        </button>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Selecciona el tipo de pregunta</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {questionTypeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => addQuestion(option.value as QuestionType)}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
              >
                <option.icon className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowTypeSelector(false)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
} 