import { AssignmentWithDetails, InterviewWithQuestions } from '@/lib/types/database'

interface RecentActivityTableProps {
  assignments: AssignmentWithDetails[]
}

export default function RecentActivityTable({ assignments }: RecentActivityTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Pendiente' },
      in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'En Progreso' },
      completed: { bg: 'bg-green-50', text: 'text-green-700', label: 'Completado' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Candidato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Entrevista
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Progreso
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {assignments.map((assignment) => {
              const totalQuestions = assignment.interview?.questions?.length || 0
              const answeredQuestions = assignment.responses?.length || 0
              const progress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
              
              return (
                <tr key={assignment.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {assignment.profile?.first_name && assignment.profile?.last_name
                          ? `${assignment.profile.first_name} ${assignment.profile.last_name}`
                          : assignment.profile?.email || 'Usuario sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500">{assignment.profile?.email}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">{assignment.interview?.name || 'Sin título'}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {getStatusBadge(assignment.status)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(assignment.assigned_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{progress}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
} 