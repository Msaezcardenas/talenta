import { ReactNode } from 'react'

interface ActionCardProps {
  icon: ReactNode
  iconBg: string
  iconColor: string
  title: string
  description: string
  onClick?: () => void
}

export function ActionCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  onClick
}: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-100 transition-all text-left group"
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${iconBg} group-hover:scale-110 transition-transform`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
    </button>
  )
} 