'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Circle, CheckCircle, ArrowRight, Send, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import VideoRecorder from '@/components/VideoRecorder'
import { AssignmentWithDetails, Question, QuestionType } from '@/lib/types/database'

export default function InterviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [assignment, setAssignment] = useState<AssignmentWithDetails | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAssignment()
  }, [params.id])

  const fetchAssignment = async () => {
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }

      // Fetch assignment with interview details
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          interview:interviews(*, questions(*)),
          responses(*)
        `)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single()

      if (assignmentData?.responses) {
        // Remove duplicate responses per question
        const uniqueResponses = assignmentData.responses.reduce((acc: any[], response: any) => {
          const existingIndex = acc.findIndex(r => r.question_id === response.question_id)
          if (existingIndex === -1) {
            acc.push(response)
          } else {
            // Keep the most recent response
            if (new Date(response.updated_at) > new Date(acc[existingIndex].updated_at)) {
              acc[existingIndex] = response
            }
          }
          return acc
        }, [])
        assignmentData.responses = uniqueResponses
      }

      if (assignmentError) throw assignmentError

      if (!assignmentData) {
        setError('No se encontró la entrevista')
        return
      }

      // Check if already completed
      if (assignmentData.status === 'completed') {
        setAssignment(assignmentData)
        setLoading(false)
        return
      }

      // Sort questions by order_index
      if (assignmentData.interview?.questions) {
        assignmentData.interview.questions.sort((a: Question, b: Question) => 
          a.order_index - b.order_index
        )
      }

      // Load existing responses
      const existingAnswers: Record<string, any> = {}
      assignmentData.responses?.forEach((response: any) => {
        existingAnswers[response.question_id] = response.data
      })
      setAnswers(existingAnswers)

      // Find first unanswered question
      const firstUnanswered = assignmentData.interview?.questions?.findIndex(
        (q: Question) => !existingAnswers[q.id]
      ) ?? 0
      
      // If all questions are answered, show the last one
      const indexToShow = firstUnanswered === -1 ? 
        (assignmentData.interview?.questions?.length || 1) - 1 : 
        firstUnanswered
      
      setCurrentQuestionIndex(indexToShow)

      // Update status to in_progress if pending
      if (assignmentData.status === 'pending') {
        await supabase
          .from('assignments')
          .update({ status: 'in_progress' })
          .eq('id', params.id)
      }

      setAssignment(assignmentData)
    } catch (err) {
      console.error('Error fetching assignment:', err)
      setError('Error al cargar la entrevista')
    } finally {
      setLoading(false)
    }
  }

  const saveAnswer = async (questionId: string, answer: any) => {
    setSaving(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Check if response already exists
      const { data: existing } = await supabase
        .from('responses')
        .select('id')
        .eq('assignment_id', params.id)
        .eq('question_id', questionId)
        .single()

      if (existing) {
        // Update existing response
        await supabase
          .from('responses')
          .update({ 
            data: answer,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        // Create new response
        await supabase
          .from('responses')
          .insert({
            assignment_id: params.id,
            question_id: questionId,
            data: answer
          })
      }

      setAnswers(prev => ({ ...prev, [questionId]: answer }))
    } catch (err) {
      console.error('Error saving answer:', err)
      setError('Error al guardar la respuesta')
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    if (!assignment?.interview?.questions) return

    const currentQuestion = assignment.interview.questions[currentQuestionIndex]
    const currentAnswer = answers[currentQuestion.id]

    // Validate current answer based on question type
    let isValid = false
    
    if (currentQuestion.type === 'text') {
      isValid = currentAnswer?.text && currentAnswer.text.trim().length > 0
    } else if (currentQuestion.type === 'multiple_choice') {
      isValid = currentAnswer?.selected !== undefined
    } else if (currentQuestion.type === 'video') {
      isValid = currentAnswer?.video_url !== undefined
    }

    if (!isValid) {
      setError('Por favor responde la pregunta antes de continuar')
      return
    }

    setError(null)
    
    // Move to next question
    if (currentQuestionIndex < assignment.interview.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleFinish = async () => {
    if (!assignment || !assignment.interview?.questions) return

    setSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Save the last answer if it's not a video question (videos are saved automatically)
      const currentQuestion = assignment.interview.questions[currentQuestionIndex]
      if (currentQuestion.type !== 'video' && answers[currentQuestion.id]) {
        await saveAnswer(currentQuestion.id, answers[currentQuestion.id])
      }
      
      // Small delay to ensure the answer is saved
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Update assignment status to completed
      const { error: updateError } = await supabase
        .from('assignments')
        .update({ status: 'completed' })
        .eq('id', params.id)

      if (updateError) throw updateError

      // Force a complete refresh
      setAssignment(null)
      await fetchAssignment()
    } catch (err) {
      console.error('Error finishing interview:', err)
      setError('Error al finalizar la entrevista')
    } finally {
      setSaving(false)
    }
  }

  const handleVideoSave = async (blob: Blob) => {
    if (!assignment?.interview?.questions) return
    
    setSaving(true)
    setError(null)
    
    try {
      const currentQuestion = assignment.interview.questions[currentQuestionIndex]
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // Upload video to storage
      const fileName = `${user.id}/${params.id}/${currentQuestion.id}.webm`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, blob, {
          contentType: 'video/webm',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      // Save answer with video URL
      await saveAnswer(currentQuestion.id, { 
        video_url: publicUrl,
        type: 'video' 
      })
      
      // Clear error and advance
      setError(null)
      
      // Auto advance to next question
      if (currentQuestionIndex < assignment.interview.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }
    } catch (err) {
      console.error('Error saving video:', err)
      setError('Error al guardar el video. Por favor intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando entrevista...</p>
        </div>
      </div>
    )
  }

  if (error && !assignment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // Completed interview view
  if (assignment?.status === 'completed') {
    const totalQuestions = assignment.interview?.questions?.length || 0
    const answeredQuestions = assignment.responses?.length || 0
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Entrevista Completada!
              </h2>
              <p className="text-gray-600 mb-4">
                Ya has completado esta entrevista. Muchas gracias por tu participación.
              </p>
              
              {/* Progress Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 mb-2">Resumen de tu entrevista</div>
                <div className="text-lg font-semibold text-gray-900">
                  {totalQuestions} de {totalQuestions} preguntas respondidas
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => router.push('/candidate/dashboard')}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const questions = assignment?.interview?.questions || []
  const currentQuestion = questions[currentQuestionIndex]
  const totalQuestions = questions.length
  const progress = totalQuestions > 0 ? ((currentQuestionIndex + 1) / totalQuestions) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex">
                <Circle className="w-6 h-6 text-pink-500 fill-pink-500" />
                <Circle className="w-6 h-6 text-purple-500 fill-purple-500 -ml-1.5" />
                <Circle className="w-6 h-6 text-blue-500 fill-blue-500 -ml-1.5" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">GetonPro</h1>
            </div>
            <div className="text-sm text-gray-600">
              {assignment?.interview?.name}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Pregunta {currentQuestionIndex + 1} de {totalQuestions}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% completado
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentQuestion && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentQuestion.question_text}
            </h2>

            {/* Question Input based on type */}
            {currentQuestion.type === 'text' && (
              <div className="space-y-4">
                <textarea
                  value={answers[currentQuestion.id]?.text || ''}
                  onChange={(e) => setAnswers(prev => ({
                    ...prev,
                    [currentQuestion.id]: { text: e.target.value, type: 'text' }
                  }))}
                  placeholder="Escribe tu respuesta aquí..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900"
                  rows={6}
                />
              </div>
            )}

            {currentQuestion.type === 'video' && (
              <VideoRecorder
                questionId={currentQuestion.id}
                onSave={handleVideoSave}
              />
            )}

            {currentQuestion.type === 'multiple_choice' && (
              <div className="space-y-3">
                {(currentQuestion.options as any[])?.map((option, index) => (
                  <label
                    key={option.id || index}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option.value}
                      checked={answers[currentQuestion.id]?.selected === option.value}
                      onChange={() => setAnswers(prev => ({
                        ...prev,
                        [currentQuestion.id]: { 
                          selected: option.value, 
                          type: 'multiple_choice' 
                        }
                      }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                    />
                    <span className="ml-3 text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => {
                  setError(null)
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
                }}
                disabled={currentQuestionIndex === 0}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  onClick={async () => {
                    if (currentQuestion.type !== 'video') {
                      await saveAnswer(currentQuestion.id, answers[currentQuestion.id])
                    }
                    await handleNext()
                  }}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                >
                  <span>{saving ? 'Guardando...' : 'Continuar'}</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (currentQuestion.type !== 'video') {
                      await saveAnswer(currentQuestion.id, answers[currentQuestion.id])
                    }
                    await handleFinish()
                  }}
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  <span>{saving ? 'Enviando...' : 'Enviar Entrevista'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 