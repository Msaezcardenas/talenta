export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Iconos cuadrados del logo */}
      <div className="flex items-center">
        <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-sm transform rotate-45"></div>
        <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-700 rounded-sm transform rotate-45 -ml-3"></div>
      </div>
      <div className="flex items-center -ml-1">
        <div className="w-6 h-6 bg-gradient-to-br from-purple-600 to-purple-700 rounded-sm transform rotate-45"></div>
        <div className="w-6 h-6 bg-gradient-to-br from-pink-500 to-pink-600 rounded-sm transform rotate-45 -ml-3"></div>
      </div>
      {/* Texto del logo */}
      <span className="text-2xl font-bold ml-2">
        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Skillza</span>
        <span className="bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">Pro</span>
      </span>
    </div>
  )
} 