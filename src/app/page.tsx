'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3 p-6 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              {/* Logo TalentaPro con íconos de cuadrados */}
              <div className="flex items-center">
                <div className="w-7 h-7 rounded-sm transform rotate-45" style={{background: '#5b4aef'}}></div>
                <div className="w-7 h-7 rounded-sm transform rotate-45 -ml-3" style={{background: 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)'}}></div>
              </div>
              <div className="flex items-center -ml-1">
                <div className="w-7 h-7 rounded-sm transform rotate-45" style={{background: 'linear-gradient(135deg, #fb33af 0%, #5b4aef 100%)'}}></div>
                <div className="w-7 h-7 rounded-sm transform rotate-45 -ml-3" style={{background: '#fb33af'}}></div>
              </div>
              {/* Texto del logo */}
              <div className="ml-2">
                <span className="text-3xl font-bold">
                  <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #5b4aef 0%, #fb33af 100%)'}}>Talenta</span>
                  <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #fb33af 0%, #5b4aef 100%)'}}>Pro</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Título principal */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            TalentaPro
          </h1>
          
          {/* Subtítulo */}
          <p className="text-lg md:text-xl text-gray-700 mb-4 flex items-center justify-center gap-2 flex-wrap">
            Plataforma Profesional de Entrevistas <Sparkles className="w-5 h-5 text-blue-600" />
          </p>
          
          {/* Descripción */}
          <p className="text-base md:text-lg text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Optimiza tu proceso de selección con tecnología avanzada. 
            Entrevistas automatizadas, análisis inteligente y experiencia superior para candidatos.
          </p>

          {/* Sección de acciones */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Candidatos */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background: 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)'}}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">¿Recibiste una invitación?</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Accede directamente a tu entrevista usando el enlace único que recibiste por correo.
                </p>
                <div className="rounded-lg p-3" style={{backgroundColor: 'rgba(91, 74, 239, 0.1)'}}>
                  <p className="font-medium text-xs" style={{color: '#5b4aef'}}>
                    <span className="font-bold" style={{color: '#5b4aef'}}>Sin registros, sin contraseñas.</span> Solo haz clic en el enlace de tu invitación.
                  </p>
                </div>
              </div>
            </div>

            {/* Administradores */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">¿Eres parte del equipo de RRHH?</h3>
                <p className="text-gray-600 mb-5 text-sm">
                  Gestiona entrevistas, revisa candidatos y analiza resultados desde nuestro panel administrativo.
                </p>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)',
                    boxShadow: '0 10px 25px rgba(91, 74, 239, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #4a3bd8 0%, #e02a98 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)';
                  }}
                >
                  Acceso Administrativo
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-sm text-gray-500">
            <p>© 2024 TalentaPro. Transformando la selección de talento.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
