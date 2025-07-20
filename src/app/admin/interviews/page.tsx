'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [interviewToDelete, setInterviewToDelete] = useState<any>(null)
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
    } catch (error) {
      console.error('Error loading interviews:', error)
      toast.error('Error al cargar las entrevistas')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (interview: any) => {
    setInterviewToDelete(interview)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!interviewToDelete) return

    setDeletingId(interviewToDelete.id)
    const loadingToast = toast.loading('Eliminando entrevista...')

    try {
      // Primero verificar si hay asignaciones
      const { count } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('interview_id', interviewToDelete.id)

      if (count && count > 0) {
        toast.dismiss(loadingToast)
        toast.error('No se puede eliminar: hay candidatos asignados a esta entrevista')
        return
      }

      // Eliminar la entrevista (las preguntas se eliminan en cascada)
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', interviewToDelete.id)

      if (error) throw error

      toast.dismiss(loadingToast)
      toast.success('Entrevista eliminada exitosamente')
      
      // Actualizar la lista
      setInterviews(interviews.filter(i => i.id !== interviewToDelete.id))
    } catch (error: any) {
      console.error('Error deleting interview:', error)
      toast.dismiss(loadingToast)
      toast.error(error.message || 'Error al eliminar la entrevista')
    } finally {
      setDeletingId(null)
      setShowDeleteModal(false)
      setInterviewToDelete(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
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
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg hover:scale-105"
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:scale-105"
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/interviews/${interview.id}`)}
                        className="text-violet-600 hover:text-violet-900 hover:bg-violet-50 p-2 rounded-lg transition-all mr-1"
                        title="Ver detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/admin/interviews/${interview.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900 hover:bg-blue-50 p-2 rounded-lg transition-all mr-1"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(interview)}
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
            
            <p className="text-gray-600 text-center mb-8 px-4">
              Estás a punto de eliminar <span className="font-semibold text-gray-900">"{interviewToDelete?.name}"</span>. 
              Esta acción no se puede deshacer y eliminará todas las preguntas asociadas.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingId !== null}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {deletingId ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Importar FileText que faltaba
import { FileText } from 'lucide-react' 