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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-gray-900 group-hover:transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = '#5b4aef'} onMouseLeave={(e) => e.currentTarget.style.color = '#111827'}>{title}</h3>
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
          <div className="text-2xl font-bold text-gray-900 group-hover:transition-colors" onMouseEnter={(e) => e.currentTarget.style.color = '#5b4aef'} onMouseLeave={(e) => e.currentTarget.style.color = '#111827'}>{completionRate}%</div>
          <p className="text-sm text-gray-500">completado</p>
        </div>
      </div>
      <button
        onClick={() => router.push(`/admin/interviews/${id}`)}
                  className="w-full mt-4 py-2.5 px-4 bg-gray-50 rounded-lg font-medium text-sm text-gray-700 transition-all cursor-pointer hover:scale-[1.02]"
          style={{}}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f7f5ff'
            e.currentTarget.style.color = '#5b4aef'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb'
            e.currentTarget.style.color = '#374151'
          }}
      >
        Ver detalles
      </button>
    </div>
  )
} 