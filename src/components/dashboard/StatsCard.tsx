import { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change: number
  changeText: string
  icon: ReactNode
  iconColor: string
  iconBg: string
}

export function StatsCard({
  title,
  value,
  change,
  changeText,
  icon,
  iconColor,
  iconBg
}: StatsCardProps) {
  const isPositive = change > 0

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1 group-hover:text-violet-600 transition-colors">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconBg} transition-transform group-hover:scale-110`}>
          <div className={`${iconColor} transition-transform group-hover:scale-110`}>{icon}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{change}%
        </span>
        <span className="text-sm text-gray-500">{changeText}</span>
      </div>
    </div>
  )
} 