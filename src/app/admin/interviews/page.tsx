'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Edit, Trash2, AlertTriangle, Users, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [interviewToDelete, setInterviewToDelete] = useState<any>(null)
  const [assignmentCount, setAssignmentCount] = useState<number>(0)
  const [showForceDeleteConfirm, setShowForceDeleteConfirm] = useState(false)
  const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({})
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    loadInterviews()
  }, [])

  const loadInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInterviews(data || [])
      
      // Cargar conteo de completadas para cada entrevista
      if (data) {
        const counts: Record<string, number> = {}
        for (const interview of data) {
          const { count } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('interview_id', interview.id)
            .eq('status', 'completed')
          
          counts[interview.id] = count || 0
        }
        setCompletedCounts(counts)
      }
    } catch (error) {
      console.error('Error loading interviews:', error)
      toast.error('Error al cargar las entrevistas')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (interview: any) => {
    // Verificar si hay asignaciones
    const { count } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('interview_id', interview.id)
    
    setAssignmentCount(count || 0)
    setInterviewToDelete(interview)
    setShowDeleteModal(true)
    setShowForceDeleteConfirm(false)
  }

  const handleDeleteConfirm = async () => {
    if (!interviewToDelete) return

    // Si hay asignaciones y no se ha confirmado forzar eliminación
    if (assignmentCount > 0 && !showForceDeleteConfirm) {
      setShowForceDeleteConfirm(true)
      return
    }

    setDeletingId(interviewToDelete.id)
    const loadingToast = toast.loading('Eliminando entrevista...')

    try {
      // Eliminar la entrevista (las preguntas y asignaciones se eliminan en cascada)
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', interviewToDelete.id)

      if (error) throw error

      toast.dismiss(loadingToast)
      toast.success('Entrevista eliminada exitosamente')
      
      // Actualizar la lista
      setInterviews(interviews.filter(i => i.id !== interviewToDelete.id))
      setShowDeleteModal(false)
      setInterviewToDelete(null)
      setAssignmentCount(0)
      setShowForceDeleteConfirm(false)
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error('Error al eliminar la entrevista')
      console.error('Error:', error)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{borderBottomColor: '#5b4aef'}}></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Entrevistas</h1>
          <p className="text-gray-600 mt-2">Gestiona tus plantillas de entrevista</p>
        </div>
        <button
          onClick={() => router.push('/admin/interviews/new')}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg hover:scale-105"
          style={{background: 'linear-gradient(135deg, #5b4aef 0%, #4a3bd8 100%)'}}
          onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #4a3bd8 0%, #3b2db8 100%)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #5b4aef 0%, #4a3bd8 100%)'}
        >
          <Plus className="w-4 h-4" />
          Nueva Entrevista
        </button>
      </div>

      {/* Lista de entrevistas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {interviews.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay entrevistas</h3>
            <p className="text-gray-600 mb-4">Crea tu primera plantilla de entrevista</p>
            <button
              onClick={() => router.push('/admin/interviews/new')}
              className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:scale-105"
            style={{background: '#5b4aef'}}
            onMouseEnter={(e) => e.currentTarget.style.background = '#4a3bd8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#5b4aef'}
            >
              <Plus className="w-4 h-4" />
              Nueva Entrevista
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidatos Completados
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interviews.map((interview) => (
                  <tr key={interview.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{interview.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{interview.description || 'Sin descripción'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {new Date(interview.created_at).toLocaleDateString('es-ES')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{completedCounts[interview.id] || 0}</span>
                        <span className="text-sm text-gray-500">completadas</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/interviews/${interview.id}/results`)}
                        className="p-2 rounded-lg transition-all mr-1"
                style={{color: '#5b4aef'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3b2db8'
                  e.currentTarget.style.backgroundColor = '#f7f5ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#5b4aef'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                        title="Ver resultados"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/interviews/${interview.id}/edit`)}
                        className="p-2 rounded-lg transition-all mr-1"
                style={{color: '#5b4aef'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3b2db8'
                  e.currentTarget.style.backgroundColor = '#f7f5ff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#5b4aef'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(interview)}
                        disabled={deletingId === interview.id}
                        className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
              ¿Eliminar entrevista?
            </h3>
            
            {!showForceDeleteConfirm ? (
              <>
                <p className="text-gray-600 text-center mb-6 px-4">
                  Estás a punto de eliminar <span className="font-semibold text-gray-900">"{interviewToDelete?.name}"</span>. 
                  Esta acción no se puede deshacer.
                </p>
                
                {assignmentCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900">
                          Hay {assignmentCount} candidato{assignmentCount > 1 ? 's' : ''} asignado{assignmentCount > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-amber-700 mt-1">
                          Al eliminar esta entrevista, también se eliminarán todas las asignaciones y respuestas de los candidatos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-red-900 mb-2">
                  ⚠️ Confirmación adicional requerida
                </p>
                <p className="text-sm text-red-700">
                  Esta entrevista tiene {assignmentCount} candidato{assignmentCount > 1 ? 's' : ''} asignado{assignmentCount > 1 ? 's' : ''}.
                  Se eliminarán permanentemente:
                </p>
                <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                  <li>La entrevista y todas sus preguntas</li>
                  <li>Todas las asignaciones de candidatos</li>
                  <li>Todas las respuestas enviadas</li>
                  <li>Videos y transcripciones</li>
                </ul>
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setShowForceDeleteConfirm(false)
                  setAssignmentCount(0)
                }}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId === interviewToDelete?.id}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 
                  ${showForceDeleteConfirm 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {deletingId === interviewToDelete?.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {showForceDeleteConfirm ? 'Sí, eliminar todo' : 'Eliminar'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 