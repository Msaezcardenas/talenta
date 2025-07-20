'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
          <h1 className="text-5xl font-bold text-gray-900 ml-3">GetonPro</h1>
        </div>
        
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">
          Sistema de Entrevistas Automatizadas
        </h2>
        
        <p className="text-lg text-gray-600 mb-12">
          Optimiza tu proceso de selección con entrevistas en video y evaluaciones automatizadas.
        </p>

        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            ¿Recibiste una invitación para entrevista?
          </h3>
          <p className="text-gray-600 mb-6">
            Utiliza el enlace único que recibiste en tu correo electrónico para acceder a tu entrevista.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> No necesitas crear una cuenta. Solo haz clic en el enlace de tu invitación.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">¿Eres administrador de RRHH?</p>
            <Link
              href="/admin/login"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
            >
              Ingresar como Admin
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
