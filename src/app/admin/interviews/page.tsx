'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { InterviewWithQuestions } from '@/lib/types/database'

interface InterviewWithCount extends InterviewWithQuestions {
  assignmentsCount: number
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchInterviews()
  }, [])

  const fetchInterviews = async () => {
    try {
      const supabase = createClient()
      
      const { data: interviewsData, error } = await supabase
        .from('interviews')
        .select(`
          *,
          questions(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Count assignments for each interview
      const interviewsWithCounts = await Promise.all(
        interviewsData.map(async (interview) => {
          const { count } = await supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('interview_id', interview.id)
          
          return {
            ...interview,
            assignmentsCount: count || 0
          }
        })
      )

      setInterviews(interviewsWithCounts)
    } catch (error) {
      console.error('Error fetching interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (interviewId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta entrevista?')) return
    
    setDeleting(interviewId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('interviews')
        .delete()
        .eq('id', interviewId)
      
      if (error) throw error
      
      // Refresh interviews
      await fetchInterviews()
    } catch (error) {
      console.error('Error deleting interview:', error)
      alert('Error al eliminar la entrevista')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando entrevistas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Entrevistas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestiona las pruebas y procesos de selección
          </p>
        </div>
        <Link
          href="/admin/interviews/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Crear Nueva Entrevista
        </Link>
      </div>

      {/* Interviews Grid */}
      {interviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron entrevistas</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {interviews.map((interview: InterviewWithCount) => (
            <div
              key={interview.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                  {interview.name}
                </h3>
                <div className="flex space-x-2">
                  <Link 
                    href={`/admin/interviews/${interview.id}/edit`}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => handleDelete(interview.id)}
                    disabled={deleting === interview.id}
                    className="text-gray-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {interview.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {interview.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {interview.questions?.length || 0} preguntas
                </span>
                <div className="flex items-center text-gray-500">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{interview.assignmentsCount} candidatos</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href={`/admin/interviews/${interview.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Ver detalles →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 