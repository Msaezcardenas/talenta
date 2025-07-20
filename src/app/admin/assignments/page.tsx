'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { UserPlus, Send, Users, FileText, Check, Mail, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AssignmentsPage() {
  const [interviews, setInterviews] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [selectedInterview, setSelectedInterview] = useState('')
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [showLinksModal, setShowLinksModal] = useState(false)
  const [generatedLinks, setGeneratedLinks] = useState<any[]>([])
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Cargar entrevistas activas
      const { data: interviewsData } = await supabase
        .from('interviews')
        .select('*')
        .order('created_at', { ascending: false })

      // Cargar candidatos
      const { data: candidatesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'candidate')
        .order('created_at', { ascending: false })

      setInterviews(interviewsData || [])
      setCandidates(candidatesData || [])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedInterview || selectedCandidates.length === 0) {
      toast.error('Por favor selecciona una entrevista y al menos un candidato')
      return
    }

    setAssigning(true)
    const loadingToast = toast.loading('Asignando candidatos...')

    try {
      // Obtener información de la entrevista
      const interview = interviews.find(i => i.id === selectedInterview)
      
      // Crear asignaciones (usando el esquema original sin access_token)
      const assignments = selectedCandidates.map(candidateId => ({
        interview_id: selectedInterview,
        user_id: candidateId,
        status: 'pending'
      }))

      const { data: assignmentData, error } = await supabase
        .from('assignments')
        .insert(assignments)
        .select()

      if (error) throw error

      // Preparar los links generados usando el ID de assignment como token
      const links = []
      
      // Enviar emails a cada candidato
      for (let i = 0; i < assignmentData.length; i++) {
        const assignment = assignmentData[i]
        const candidate = candidates.find(c => c.id === assignment.user_id)
        
        if (candidate) {
          // Enviar email usando el ID de assignment como token
          const response = await fetch('/api/send-interview-invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assignmentId: assignment.id,
              candidateEmail: candidate.email,
              candidateName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim(),
              interviewTitle: interview?.name || 'Entrevista',
              token: assignment.id // Usar el ID como token
            })
          })

          const result = await response.json()
          
          links.push({
            candidateName: `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim() || candidate.email,
            candidateEmail: candidate.email,
            link: result.invitationLink
          })
        }
      }

      toast.dismiss(loadingToast)
      toast.success(`✅ ${selectedCandidates.length} candidatos asignados exitosamente`)
      
      // Mostrar modal con los links generados
      setGeneratedLinks(links)
      setShowLinksModal(true)
      
      // Limpiar selección
      setSelectedInterview('')
      setSelectedCandidates([])
    } catch (error: any) {
      console.error('Error assigning candidates:', error)
      toast.dismiss(loadingToast)
      toast.error(error.message || 'Error al asignar candidatos')
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

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success('Link copiado al portapapeles')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8 py-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asignar Candidatos</h1>
          <p className="text-gray-600 mt-2">Asigna candidatos a procesos de entrevista</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Selección de Entrevista */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-600" />
              Selecciona una Entrevista
            </h2>
            
            {interviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay entrevistas disponibles</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {interviews.map((interview) => (
                  <label
                    key={interview.id}
                    className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedInterview === interview.id
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interview"
                      value={interview.id}
                      checked={selectedInterview === interview.id}
                      onChange={(e) => setSelectedInterview(e.target.value)}
                      className="text-violet-600 focus:ring-violet-500"
                    />
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{interview.name}</p>
                      {interview.description && (
                        <p className="text-sm text-gray-600">{interview.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Selección de Candidatos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Selecciona Candidatos ({selectedCandidates.length})
            </h2>
            
            {candidates.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay candidatos disponibles</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {candidates.map((candidate) => (
                  <label
                    key={candidate.id}
                    className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedCandidates.includes(candidate.id)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      value={candidate.id}
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={() => toggleCandidate(candidate.id)}
                      className="text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <p className="font-medium text-gray-900">
                        {candidate.first_name && candidate.last_name
                          ? `${candidate.first_name} ${candidate.last_name}`
                          : candidate.email}
                      </p>
                      <p className="text-sm text-gray-600">{candidate.email}</p>
                    </div>
                    {selectedCandidates.includes(candidate.id) && (
                      <Check className="w-5 h-5 text-emerald-600" />
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resumen y Acción */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Resumen de Asignación</h3>
              <p className="text-violet-100">
                {selectedInterview ? '1 entrevista' : 'Sin entrevista'} • {selectedCandidates.length} candidato{selectedCandidates.length !== 1 ? 's' : ''} seleccionado{selectedCandidates.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleAssign}
              disabled={!selectedInterview || selectedCandidates.length === 0 || assigning}
              className="flex items-center gap-2 px-6 py-3 bg-white text-violet-600 rounded-lg font-medium hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {assigning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-violet-600"></div>
                  Asignando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Asignar y Enviar Invitaciones
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Nota:</strong> Los candidatos recibirán un enlace único por correo electrónico para acceder a su entrevista. 
            El enlace utiliza el ID de asignación como identificador único.
          </p>
        </div>
      </div>

      {/* Modal de Links Generados */}
      {showLinksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                ✅ Invitaciones Enviadas
              </h3>
              <p className="text-gray-600 mt-1">
                Se han enviado las invitaciones por email. Aquí están los enlaces generados:
              </p>
            </div>
            
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <div className="space-y-4">
                {generatedLinks.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.candidateName}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Mail className="w-4 h-4" />
                          {item.candidateEmail}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            value={item.link}
                            readOnly
                            className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded bg-gray-50"
                          />
                          <button
                            onClick={() => copyLink(item.link)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Copiar link"
                          >
                            <Copy className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Modo Desarrollo:</strong> Los emails se muestran en la consola del servidor. 
                    En producción, se enviarán emails reales.
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowLinksModal(false)}
                className="w-full px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 