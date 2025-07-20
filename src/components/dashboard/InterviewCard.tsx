import { useRouter } from 'next/navigation'

interface InterviewCardProps {
  id: string
  title: string
  position: string
  candidates: number
  completed: number
  date: string
  status: 'active' | 'completed'
  completionRate: number
}

export function InterviewCard({
  id,
  title,
  position,
  candidates,
  completed,
  date,
  status,
  completionRate
}: InterviewCardProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                status === 'active'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {status === 'active' ? 'Activa' : 'Completada'}
            </span>
          </div>
          <p className="text-gray-600">{position}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span>{candidates} candidatos</span>
            <span>•</span>
            <span>{completed} completadas</span>
            <span>•</span>
            <span>{date}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
          <p className="text-sm text-gray-500">completado</p>
        </div>
      </div>
      <button
        onClick={() => router.push(`/admin/interviews/${id}`)}
        className="w-full mt-4 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-sm text-gray-700 transition-colors"
      >
        Ver detalles
      </button>
    </div>
  )
} 