export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center">
        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-400 rounded-lg transform rotate-45"></div>
        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg transform rotate-45 -ml-4"></div>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
        SkillzaPro
      </span>
    </div>
  )
} 