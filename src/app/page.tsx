'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-3 p-6 bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-shadow duration-300">
              {/* Iconos cuadrados del logo */}
              <div className="flex items-center">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-sm transform rotate-45"></div>
                <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-purple-700 rounded-sm transform rotate-45 -ml-3"></div>
              </div>
              <div className="flex items-center -ml-1">
                <div className="w-7 h-7 bg-gradient-to-br from-purple-600 to-purple-700 rounded-sm transform rotate-45"></div>
                <div className="w-7 h-7 bg-gradient-to-br from-pink-500 to-pink-600 rounded-sm transform rotate-45 -ml-3"></div>
              </div>
              {/* Texto del logo */}
              <div className="ml-3">
                <span className="text-2xl font-bold">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Skillza</span>
                  <span className="bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">Pro</span>
                </span>
              </div>
            </div>
          </div>
          
          {/* Título principal */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            SkillzaPro
          </h1>
          
          {/* Subtítulo */}
          <p className="text-lg md:text-xl text-gray-700 mb-4 flex items-center justify-center gap-2 flex-wrap">
            Sistema Inteligente de Entrevistas <Sparkles className="w-5 h-5 text-violet-600" />
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
                <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">¿Recibiste una invitación?</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Accede directamente a tu entrevista usando el enlace único que recibiste por correo.
                </p>
                <div className="bg-violet-50 rounded-lg p-3">
                  <p className="text-violet-700 font-medium text-xs">
                    <span className="text-violet-600 font-bold">Sin registros, sin contraseñas.</span> Solo haz clic en el enlace de tu invitación.
                  </p>
                </div>
              </div>
            </div>

            {/* Administradores */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">¿Eres parte del equipo de RRHH?</h3>
                <p className="text-gray-600 mb-5 text-sm">
                  Gestiona entrevistas, revisa candidatos y analiza resultados desde nuestro panel administrativo.
                </p>
                <Link
                  href="/admin/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Acceso Administrativo
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-sm text-gray-500">
            <p>© 2024 SkillzaPro. Transformando la selección de talento.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
