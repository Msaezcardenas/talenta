'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Circle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      
      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/candidate/dashboard`,
        }
      })

      if (error) throw error

      setMessage({
        type: 'success',
        text: '¡Magic link enviado! Revisa tu correo electrónico.'
      })
      setEmail('')
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Error al enviar el magic link'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex">
              <Circle className="w-8 h-8 text-pink-500 fill-pink-500" />
              <Circle className="w-8 h-8 text-purple-500 fill-purple-500 -ml-2" />
              <Circle className="w-8 h-8 text-blue-500 fill-blue-500 -ml-2" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">GetonPro</h1>
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Portal de Postulantes
              </h2>
              <p className="text-gray-600">
                Ingresa tu correo para acceder a tus procesos de entrevista.
              </p>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  Iniciar Sesión
                </h3>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Ingresa tu correo electrónico para recibir un magic link.
                </p>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-lg text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Mail className="w-5 h-5" />
                <span>{loading ? 'Enviando...' : 'Enviar Magic Link'}</span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                ¿Eres administrador de RRHH?{' '}
                <Link 
                  href="/admin/login" 
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Ingresar como Admin
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
