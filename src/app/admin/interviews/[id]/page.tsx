'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, FileText, Video, CheckSquare, Clock, CheckCircle, AlertCircle, Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Interview, Question, Assignment, Response, Profile, QuestionType } from '@/lib/types/database'

interface InterviewDetailsData {
  interview: Interview & { questions: Question[] }
  assignments: (Assignment & {
    profile: Profile
    responses: (Response & {
      question: Question
    })[]
  })[]
}

export default function InterviewDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [data, setData] = useState<InterviewDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null)
  const [playingVideo, setPlayingVideo] = useState<string | null>(null)

  useEffect(() => {
    fetchInterviewDetails()
  }, [params.id])

  const fetchInterviewDetails = async () => {
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

      // Fetch assignments with responses for this interview
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          profile:profiles(*),
          responses(
            *,
            question:questions(*)
          )
        `)
        .eq('interview_id', params.id)
        .order('assigned_at', { ascending: false })

      if (assignmentsError) throw assignmentsError

      // Sort questions by order_index
      if (interviewData.questions) {
        interviewData.questions.sort((a: Question, b: Question) => a.order_index - b.order_index)
      }

      setData({
        interview: interviewData,
        assignments: assignmentsData || []
      })

      // Select first assignment by default
      if (assignmentsData && assignmentsData.length > 0) {
        setSelectedAssignment(assignmentsData[0].id)
      }
    } catch (error) {
      console.error('Error fetching interview details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        bg: 'bg-yellow-50', 
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: Clock,
        label: 'Pendiente' 
      },
      in_progress: { 
        bg: 'bg-blue-50', 
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: AlertCircle,
        label: 'En Progreso' 
      },
      completed: { 
        bg: 'bg-green-50', 
        text: 'text-green-700',
        border: 'border-green-200',
        icon: CheckCircle,
        label: 'Completado' 
      }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text} ${config.border} border`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const getQuestionIcon = (type: QuestionType) => {
    switch (type) {
      case 'text':
        return FileText
      case 'video':
        return Video
      case 'multiple_choice':
        return CheckSquare
      default:
        return FileText
    }
  } 

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles de la entrevista...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No se encontró la entrevista</p>
        </div>
      </div>
    )
  }

  const selectedAssignmentData = data.assignments.find(a => a.id === selectedAssignment)

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/interviews"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Entrevistas
        </Link>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {data.interview.name}
          </h1>
          {data.interview.description && (
            <p className="text-gray-600 mb-4">{data.interview.description}</p>
          )}
          
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Creado el {new Date(data.interview.created_at).toLocaleDateString('es-ES')}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{data.assignments.length} candidatos asignados</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{data.interview.questions.length} preguntas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Candidates List */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Candidatos</h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {data.assignments.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">
                  No hay candidatos asignados
                </p>
              ) : (
                data.assignments.map((assignment) => {
                  const totalQuestions = data.interview.questions.length
                  const answeredQuestions = assignment.responses?.length || 0
                  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
                  
                  return (
                    <button
                      key={assignment.id}
                      onClick={() => setSelectedAssignment(assignment.id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedAssignment === assignment.id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            {assignment.profile.first_name && assignment.profile.last_name
                              ? `${assignment.profile.first_name} ${assignment.profile.last_name}`
                              : assignment.profile.email}
                          </p>
                          <p className="text-xs text-gray-500">
                            {assignment.profile.email}
                          </p>
                        </div>
                        {getStatusBadge(assignment.status)}
                      </div>
                      
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progreso</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Responses Section */}
        <div className="col-span-12 lg:col-span-9">
          {!selectedAssignmentData ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <p className="text-center text-gray-500">
                Selecciona un candidato para ver sus respuestas
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Candidate Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedAssignmentData.profile.first_name && selectedAssignmentData.profile.last_name
                        ? `${selectedAssignmentData.profile.first_name} ${selectedAssignmentData.profile.last_name}`
                        : selectedAssignmentData.profile.email}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedAssignmentData.profile.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      Asignado el {new Date(selectedAssignmentData.assigned_at).toLocaleDateString('es-ES')}
                    </p>
                    {getStatusBadge(selectedAssignmentData.status)}
                  </div>
                </div>
              </div>

              {/* Questions and Responses */}
              {data.interview.questions.map((question, index) => {
                const response = selectedAssignmentData.responses?.find(r => r.question.id === question.id)
                const Icon = getQuestionIcon(question.type)
                
                return (
                  <div key={question.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100">
                          <Icon className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Pregunta {index + 1}
                          </h3>
                          <p className="text-sm text-gray-600">{question.question_text}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      {!response ? (
                        <p className="text-gray-500 italic">Sin respuesta</p>
                      ) : (
                        <ResponseDisplay 
                          question={question} 
                          response={response}
                          onVideoPlay={(videoId) => setPlayingVideo(videoId)}
                          playingVideo={playingVideo}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Component to display different types of responses
function ResponseDisplay({ 
  question, 
  response, 
  onVideoPlay,
  playingVideo 
}: { 
  question: Question
  response: Response
  onVideoPlay: (videoId: string | null) => void
  playingVideo: string | null
}) {
  if (question.type === 'text') {
    return (
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-700 whitespace-pre-wrap">{response.data.text || 'Sin respuesta'}</p>
      </div>
    )
  }

  if (question.type === 'multiple_choice') {
    const selectedOption = (question.options as any[])?.find(opt => opt.value === response.data.selected)
    return (
      <div className="flex items-center gap-3">
        <CheckSquare className="w-5 h-5 text-green-600" />
        <span className="text-gray-700 font-medium">
          {selectedOption?.label || response.data.selected || 'Sin respuesta'}
        </span>
      </div>
    )
  }

  if (question.type === 'video') {
    const isPlaying = playingVideo === response.id
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Player */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
          {response.data.video_url ? (
            <>
              <video
                id={`video-${response.id}`}
                src={response.data.video_url}
                className="w-full h-full"
                controls
                onPlay={() => onVideoPlay(response.id)}
                onPause={() => onVideoPlay(null)}
                onEnded={() => onVideoPlay(null)}
              />
              <div className="absolute top-4 right-4">
                <button className="p-2 bg-black/50 rounded-lg text-white hover:bg-black/70 transition-colors">
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-white/60">Video no disponible</p>
            </div>
          )}
        </div>

        {/* Transcription */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Transcripción
          </h4>
          
          {response.data.transcript ? (
            <div className="space-y-3">
              {response.processing_status === 'completed' ? (
                <div className="prose prose-sm prose-gray max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {response.data.transcript}
                  </p>
                  
                  {response.data.timestamped_transcript && (
                    <div className="mt-4 space-y-2">
                      <h5 className="font-medium text-gray-700 text-sm">Con marcas de tiempo:</h5>
                      <div className="space-y-1 text-xs">
                        {response.data.timestamped_transcript.map((segment: any, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-gray-500 font-mono">
                              [{formatTime(segment.start)} - {formatTime(segment.end)}]
                            </span>
                            <span className="text-gray-700">{segment.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : response.processing_status === 'processing' ? (
                <div className="flex items-center gap-3 text-blue-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm">Procesando transcripción...</span>
                </div>
              ) : response.processing_status === 'failed' ? (
                <p className="text-red-600 text-sm">Error al procesar la transcripción</p>
              ) : (
                <p className="text-gray-500 text-sm italic">Transcripción pendiente</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm italic">
              La transcripción estará disponible próximamente
            </p>
          )}
        </div>
      </div>
    )
  }

  return null
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}