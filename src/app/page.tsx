'use client'

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          SkillzaPro
        </h1>
        
        <p className="text-xl text-gray-700 mb-4 flex items-center justify-center gap-2">
          Sistema Inteligente de Entrevistas <Sparkles className="w-6 h-6 text-violet-600" />
        </p>
        
        <p className="text-lg text-gray-600 mb-12 max-w-xl mx-auto">
          Optimiza tu proceso de selección con tecnología avanzada. 
          Entrevistas automatizadas, análisis inteligente y experiencia superior para candidatos.
        </p>

        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto backdrop-blur-sm bg-opacity-95">
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              ¿Recibiste una invitación?
            </h3>
            <p className="text-gray-600 mb-6">
              Accede directamente a tu entrevista usando el enlace único que recibiste por correo.
            </p>
            
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
              <p className="text-sm text-violet-800">
                <strong>Sin registros, sin contraseñas.</strong> Solo haz clic en el enlace de tu invitación y comienza tu entrevista.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">¿Eres parte del equipo de RRHH?</p>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all shadow-md group"
            >
              Acceso Administrativo
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>© 2024 SkillzaPro. Transformando la selección de talento.</p>
        </div>
      </div>
    </div>
  )
}
