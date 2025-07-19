'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Briefcase, CheckSquare, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Interview, Profile } from '@/lib/types/database'

export default function NewAssignmentPage() {
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [candidates, setCandidates] = useState<Profile[]>([])
  const [selectedInterview, setSelectedInterview] = useState<string>('')
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      
      // Fetch interviews created by the current admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch interviews
      const { data: interviewsData, error: interviewsError } = await supabase
        .from('interviews')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      if (interviewsError) throw interviewsError

      // Fetch candidates (users with role 'candidate')
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'candidate')
        .order('created_at', { ascending: false })

      if (candidatesError) throw candidatesError

      setInterviews(interviewsData || [])
      setCandidates(candidatesData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedInterview) {
      setError('Por favor selecciona un proceso')
      return
    }
    
    if (selectedCandidates.length === 0) {
      setError('Por favor selecciona al menos un candidato')
      return
    }
    
    setSubmitting(true)
    setError(null)
    
    try {
      const supabase = createClient()
      
      // Create assignments for each selected candidate
      const assignments = selectedCandidates.map(candidateId => ({
        interview_id: selectedInterview,
        user_id: candidateId,
        status: 'pending' as const
      }))
      
      const { error: assignError } = await supabase
        .from('assignments')
        .insert(assignments)
      
      if (assignError) throw assignError
      
      // Redirect to assignments list
      router.push('/admin/assignments')
    } catch (err: any) {
      console.error('Error creating assignments:', err)
      setError(err.message || 'Error al asignar el proceso')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCandidate = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  const selectAllCandidates = () => {
    const filteredCandidates = candidates.filter(candidate => 
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${candidate.first_name} ${candidate.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id))
    }
  }

  const filteredCandidates = candidates.filter(candidate => 
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${candidate.first_name} ${candidate.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
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
          GetonPro - Asignar Procesos
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Process Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-gray-700 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Seleccionar Proceso
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Elige el proceso de entrevistas que deseas asignar
            </p>

            <div>
              <label htmlFor="interview" className="block text-sm font-medium text-gray-700 mb-2">
                Proceso de Entrevistas
              </label>
              <select
                id="interview"
                value={selectedInterview}
                onChange={(e) => setSelectedInterview(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
              >
                <option value="">Selecciona un proceso</option>
                {interviews.map((interview) => (
                  <option key={interview.id} value={interview.id}>
                    {interview.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedInterview && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Proceso seleccionado:</strong>{' '}
                  {interviews.find(i => i.id === selectedInterview)?.name}
                </p>
                {interviews.find(i => i.id === selectedInterview)?.description && (
                  <p className="text-sm text-blue-600 mt-2">
                    {interviews.find(i => i.id === selectedInterview)?.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Candidates Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Mail className="w-6 h-6 text-gray-700 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Postulantes
                </h2>
              </div>
              <button
                type="button"
                onClick={selectAllCandidates}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {selectedCandidates.length === filteredCandidates.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Selecciona los postulantes que participarán en el proceso
            </p>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Candidates List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredCandidates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No se encontraron candidatos
                </p>
              ) : (
                filteredCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedCandidates.includes(candidate.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleCandidate(candidate.id)}
                  >
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate.id)}
                          onChange={() => {}}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {candidate.first_name && candidate.last_name
                            ? `${candidate.first_name} ${candidate.last_name}`
                            : 'Sin nombre'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {candidate.email}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Postulado: {new Date(candidate.created_at).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedCandidates.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  {selectedCandidates.length} candidato(s) seleccionado(s)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={submitting || !selectedInterview || selectedCandidates.length === 0}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <CheckSquare className="w-5 h-5" />
            <span>{submitting ? 'Asignando...' : 'Asignar Proceso'}</span>
          </button>
        </div>
      </form>
    </div>
  )
} 