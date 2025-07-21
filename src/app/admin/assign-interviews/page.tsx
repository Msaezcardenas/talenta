'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, Users, FileText, Send, Check, X, Search, UserPlus, Mail, Copy, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Interview {
  id: string
  name: string
  description?: string
  questions?: any[]
}

interface Candidate {
  id: string
  email: string
  first_name?: string
  last_name?: string
  assignments?: any[]
}

export default function AssignInterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selectedInterview, setSelectedInterview] = useState<string>('')
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showLinksModal, setShowLinksModal] = useState(false)
  const [assignmentLinks, setAssignmentLinks] = useState<Array<{
    candidateName: string
    candidateEmail: string
    link: string
  }>>([])
  const supabase = createClientComponentClient()
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar el dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Cargar entrevistas
      const { data: interviewsData, error: interviewsError } = await supabase
        .from('interviews')
        .select('*, questions(*)')
        .order('created_at', { ascending: false })

      if (interviewsError) throw interviewsError
      setInterviews(interviewsData || [])

      // Cargar candidatos con sus asignaciones
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('profiles')
        .select('*, assignments(*)')
        .eq('role', 'candidate')
        .order('created_at', { ascending: false })

      if (candidatesError) throw candidatesError
      setCandidates(candidatesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedInterview) {
      toast.error('Por favor selecciona una entrevista')
      return
    }

    if (selectedCandidates.length === 0) {
      toast.error('Por favor selecciona al menos un candidato')
      return
    }

    setAssigning(true)

    try {
      // Obtener información de la entrevista seleccionada
      const selectedInterviewData = interviews.find(i => i.id === selectedInterview)
      
      // Crear asignaciones para cada candidato seleccionado
      const assignments = selectedCandidates.map(candidateId => ({
        interview_id: selectedInterview,
        user_id: candidateId,
        status: 'pending'
      }))

      const { data: createdAssignments, error } = await supabase
        .from('assignments')
        .insert(assignments)
        .select()

      if (error) throw error

      // Preparar datos para envío de emails
      const candidatesData = candidates.filter(c => selectedCandidates.includes(c.id))
      let emailsSent = 0
      const failedEmails: string[] = []

      // Enviar emails usando la API existente
      for (let i = 0; i < createdAssignments.length; i++) {
        const assignment = createdAssignments[i]
        const candidate = candidatesData.find(c => c.id === assignment.user_id)
        
        if (candidate) {
          try {
            console.log(`📧 Enviando email ${i + 1}/${createdAssignments.length} a:`, candidate.email)
            
            const response = await fetch('/api/send-interview-invitation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                assignmentId: assignment.id,
                candidateEmail: candidate.email,
                candidateName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
                interviewTitle: selectedInterviewData?.name || 'Entrevista',
                token: assignment.id // Usar el ID del assignment como token
              })
            })

            const result = await response.json()
            const candidateFullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
            console.log(`📧 Respuesta del servidor:`, {
              ...result,
              sentTo: candidateFullName || 'Sin nombre (solo Hola)'
            })
            
            if (result.success) {
              emailsSent++
            } else {
              console.error('❌ Email falló:', result)
              failedEmails.push(candidate.email)
            }
          } catch (err) {
            console.error(`❌ Error enviando email a ${candidate.email}:`, err)
            failedEmails.push(candidate.email)
          }
        }
      }

      console.log(`📧 Resumen: ${emailsSent}/${createdAssignments.length} emails enviados`)

      // Mostrar resultado
      if (emailsSent === createdAssignments.length) {
        toast.success(`✅ ${selectedCandidates.length} candidatos asignados y emails enviados exitosamente`)
      } else if (emailsSent > 0) {
        toast.success(`${selectedCandidates.length} candidatos asignados. ${emailsSent} emails enviados, ${failedEmails.length} fallaron.`)
        
        // Si algunos emails fallaron, mostrar los enlaces
        if (failedEmails.length > 0) {
          const links = createdAssignments
            .filter(assignment => {
              const candidate = candidatesData.find(c => c.id === assignment.user_id)
              return candidate && failedEmails.includes(candidate.email)
            })
            .map(assignment => {
              const candidate = candidatesData.find(c => c.id === assignment.user_id)!
              return {
                candidateName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || candidate.email,
                candidateEmail: candidate.email,
                link: `${window.location.origin}/interview/${assignment.id}`
              }
            })
          setAssignmentLinks(links)
          setShowLinksModal(true)
        }
      } else {
        // Si no se enviaron emails, mostrar todos los enlaces
        const links = createdAssignments.map(assignment => {
          const candidate = candidatesData.find(c => c.id === assignment.user_id)!
          return {
            candidateName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || candidate.email,
            candidateEmail: candidate.email,
            link: `${window.location.origin}/interview/${assignment.id}`
          }
        })
        setAssignmentLinks(links)
        setShowLinksModal(true)
        toast.error('Los emails no se pudieron enviar. Comparte los enlaces manualmente.')
      }
      
      // Limpiar selección
      setSelectedCandidates([])
      setSelectedInterview('')
      
      // Recargar datos
      await loadData()
    } catch (error: any) {
      console.error('Error assigning interviews:', error)
      if (error.code === '23505') {
        toast.error('Algunos candidatos ya tienen esta entrevista asignada')
      } else {
        toast.error('Error al asignar las entrevistas')
      }
    } finally {
      setAssigning(false)
    }
  }

  const toggleCandidate = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    )
  }

  const toggleAllCandidates = () => {
    const filteredCandidates = getFilteredCandidates()
    if (selectedCandidates.length === filteredCandidates.length) {
      setSelectedCandidates([])
    } else {
      setSelectedCandidates(filteredCandidates.map(c => c.id))
    }
  }

  const getFilteredCandidates = () => {
    return candidates.filter(candidate => {
      const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''} ${candidate.email}`.toLowerCase()
      return fullName.includes(searchTerm.toLowerCase())
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  const filteredCandidates = getFilteredCandidates()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-blue-600" />
          Asignar Entrevistas
        </h1>
        <p className="text-gray-600 mt-2">Asigna entrevistas a múltiples candidatos de forma masiva</p>
      </div>

      <div className="space-y-8">
        {/* Selección de Entrevista */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            Seleccionar Entrevista
          </h2>
          
          {interviews.length > 0 ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className={`w-full flex items-center justify-between px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-gray-900 font-medium transition-all hover:border-violet-400 focus:ring-2 focus:ring-violet-600 focus:border-violet-600 outline-none ${dropdownOpen ? 'ring-2 ring-violet-600 border-violet-600' : ''}`}
                onClick={() => setDropdownOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                <span>
                  {selectedInterview
                    ? `${interviews.find(i => i.id === selectedInterview)?.name} (${interviews.find(i => i.id === selectedInterview)?.questions?.length || 0} preguntas)`
                    : 'Selecciona una entrevista'}
                </span>
                <ChevronDown className={`w-5 h-5 ml-2 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dropdownOpen && (
                <ul
                  className="absolute z-10 mt-2 w-full bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in"
                  tabIndex={-1}
                  role="listbox"
                >
                  <li
                    className={`px-4 py-2 cursor-pointer hover:bg-violet-50 text-gray-700 rounded-t-lg ${!selectedInterview ? 'bg-violet-50 font-semibold' : ''}`}
                    onClick={() => { setSelectedInterview(''); setDropdownOpen(false); }}
                    role="option"
                    aria-selected={!selectedInterview}
                  >
                    Selecciona una entrevista
                  </li>
                  {interviews.map(interview => (
                    <li
                      key={interview.id}
                      className={`px-4 py-2 cursor-pointer hover:bg-violet-50 text-gray-700 ${selectedInterview === interview.id ? 'bg-violet-100 font-semibold' : ''}`}
                      onClick={() => { setSelectedInterview(interview.id); setDropdownOpen(false); }}
                      role="option"
                      aria-selected={selectedInterview === interview.id}
                    >
                      {interview.name} ({interview.questions?.length || 0} preguntas)
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-200">
              <FileText className="w-12 h-12 text-violet-400 mx-auto mb-3" />
              <p className="text-gray-700 font-medium mb-2">
                No hay entrevistas disponibles
              </p>
              <p className="text-sm text-gray-600">
                Crea una entrevista primero para poder asignarla
              </p>
            </div>
          )}
        </div>

        {/* Selección de Candidatos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Seleccionar Candidatos
              </h2>
              <span className="text-sm text-gray-600">
                {selectedCandidates.length} de {filteredCandidates.length} seleccionados
              </span>
            </div>

            {/* Barra de búsqueda */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-600 focus:border-transparent"
              />
            </div>

            {/* Seleccionar todos */}
            <label className="flex items-center gap-3 p-3 mb-2 rounded-lg hover:bg-gray-50 cursor-pointer border-b">
              <input
                type="checkbox"
                checked={selectedCandidates.length === filteredCandidates.length && filteredCandidates.length > 0}
                onChange={toggleAllCandidates}
                className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500"
              />
              <span className="font-medium text-gray-700">Seleccionar todos</span>
            </label>

            {/* Lista de candidatos */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredCandidates.map(candidate => {
                const isAssigned = candidate.assignments?.some(
                  a => a.interview_id === selectedInterview
                )
                
                return (
                  <label
                    key={candidate.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isAssigned 
                        ? 'bg-gray-100 opacity-60 cursor-not-allowed' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={() => !isAssigned && toggleCandidate(candidate.id)}
                      disabled={isAssigned}
                      className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500 disabled:cursor-not-allowed"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {candidate.first_name || candidate.last_name
                          ? `${candidate.first_name || ''} ${candidate.last_name || ''}`
                          : 'Sin nombre'}
                      </p>
                      <p className="text-sm text-gray-600">{candidate.email}</p>
                    </div>
                    {isAssigned && (
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        Ya asignado
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            {filteredCandidates.length === 0 && (
              <div className="text-center py-12 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                <Users className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-2">
                  {searchTerm ? 'No se encontraron candidatos' : 'No hay candidatos disponibles'}
                </p>
                <p className="text-sm text-gray-600">
                  {searchTerm 
                    ? 'Intenta con otro término de búsqueda' 
                    : 'Registra candidatos para poder asignarles entrevistas'}
                </p>
              </div>
            )}
          </div>
      </div>

      {/* Botón de acción */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleAssign}
          disabled={!selectedInterview || selectedCandidates.length === 0 || assigning}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {assigning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Asignando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Asignar Entrevistas
            </>
          )}
        </button>
      </div>

      {/* Modal de Enlaces */}
      {showLinksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-6 h-6 text-blue-600" />
                  Enlaces de Invitación
                </h3>
                <button
                  onClick={() => setShowLinksModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                El servicio de email no está configurado. Comparte estos enlaces manualmente con los candidatos:
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {assignmentLinks.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.candidateName}</p>
                        <p className="text-sm text-gray-600">{item.candidateEmail}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={item.link}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.link)
                              toast.success('Enlace copiado')
                            }}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="Copiar enlace"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Nota:</strong> Para habilitar el envío automático de emails, configura un servicio de email 
                  (como Supabase Edge Functions, SendGrid, o Resend) en tu proyecto.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowLinksModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 