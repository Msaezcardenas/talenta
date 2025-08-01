export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo TalentaPro con íconos de cuadrados personalizados */}
      <div className="flex items-center">
        <div className="w-6 h-6 rounded-sm transform rotate-45" style={{background: '#5b4aef'}}></div>
        <div className="w-6 h-6 rounded-sm transform rotate-45 -ml-3" style={{background: 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)'}}></div>
      </div>
      <div className="flex items-center -ml-1">
        <div className="w-6 h-6 rounded-sm transform rotate-45" style={{background: 'linear-gradient(135deg, #fb33af 0%, #5b4aef 100%)'}}></div>
        <div className="w-6 h-6 rounded-sm transform rotate-45 -ml-3" style={{background: '#fb33af'}}></div>
      </div>
      {/* Texto del logo */}
      <span className="text-2xl font-bold ml-1">
        <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #5b4aef 0%, #fb33af 100%)'}}>Talenta</span>
        <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #fb33af 0%, #5b4aef 100%)'}}>Pro</span>
      </span>
    </div>
  )
} 