'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, LogIn, Circle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('No tienes permisos de administrador')
      }

      router.push('/admin/dashboard')
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
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
                Acceso de Administradores
              </h2>
              <p className="text-gray-600">
                Ingresa tu correo electrónico para acceder al panel de RRHH.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  Iniciar Sesión
                </h3>
                <p className="text-sm text-gray-600 text-center mb-6">
                  Ingresa tu correo electrónico para acceder al sistema
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="admin@empresa.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>{loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}</span>
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                ¿Eres postulante?{' '}
                <Link 
                  href="/" 
                  className="font-medium text-purple-600 hover:text-purple-500"
                >
                  Ingresar como Postulante
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 