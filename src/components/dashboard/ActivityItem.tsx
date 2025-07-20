interface ActivityItemProps {
  type: 'response' | 'assigned' | 'completed'
  title: string
  subtitle: string
  time: string
}

export function ActivityItem({ type, title, subtitle, time }: ActivityItemProps) {
  const getIndicatorColor = () => {
    switch (type) {
      case 'response':
        return 'bg-green-500'
      case 'assigned':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-orange-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-1">
        <div className={`w-2 h-2 rounded-full ${getIndicatorColor()}`}></div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{subtitle}</p>
        <p className="text-xs text-gray-500 mt-1">{time}</p>
      </div>
    </div>
  )
} 