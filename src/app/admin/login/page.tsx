'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  // Verificar si ya está autenticado
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('[Login] Already authenticated, checking role...')
        // Verificar rol admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
        
        if (profile?.role === 'admin') {
          console.log('[Login] User is admin, redirecting...')
          router.push('/admin/dashboard')
          return
        }
      }
    } catch (error) {
      console.error('[Login] Error checking auth:', error)
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validación manual UX
    if (!email) {
      setError('Ingresa tu correo electrónico')
      toast.error('Por favor ingresa tu correo electrónico.')
      setLoading(false)
      return
    }
    if (!password) {
      setError('Ingresa tu contraseña')
      toast.error('Por favor ingresa tu contraseña.')
      setLoading(false)
      return
    }

    try {
      console.log('[Login] Starting login process...')
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('[Login] Sign in error:', signInError)
        throw signInError
      }

      if (data.user) {
        console.log('[Login] Sign in successful, user:', data.user.email)
        
        // Esperar un momento para que la sesión se establezca
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Verificar que la sesión esté establecida
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('No se pudo establecer la sesión')
        }
        
        console.log('[Login] Session established, checking role...')
        
        // Verificar que el usuario sea admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          console.error('[Login] Profile error:', profileError)
          throw new Error('Error al verificar permisos')
        }

        console.log('[Login] User profile:', profile)

        if (profile?.role !== 'admin') {
          await supabase.auth.signOut()
          throw new Error('No tienes permisos de administrador')
        }

        console.log('[Login] User is admin, redirecting to dashboard...')
        
        // Mostrar toast de éxito
        toast.success('¡Bienvenido a TalentaPro!')
        
        // Pequeña espera para que se vea el toast
        setTimeout(() => {
          window.location.href = '/admin/dashboard'
        }, 1000)
      }
    } catch (error: any) {
      console.error('[Login] Error:', error)
      setError(error.message || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            {/* Logo de TalentaPro */}
            <div className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-2xl transform hover:scale-105 transition-transform">
              {/* Logo TalentaPro con cuadrados personalizados */}
              <div className="flex items-center">
                <div className="w-5 h-5 rounded-sm transform rotate-45" style={{background: '#5b4aef'}}></div>
                <div className="w-5 h-5 rounded-sm transform rotate-45 -ml-2" style={{background: 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)'}}></div>
              </div>
              <div className="flex items-center -ml-1">
                <div className="w-5 h-5 rounded-sm transform rotate-45" style={{background: 'linear-gradient(135deg, #fb33af 0%, #5b4aef 100%)'}}></div>
                <div className="w-5 h-5 rounded-sm transform rotate-45 -ml-2" style={{background: '#fb33af'}}></div>
              </div>
              {/* Texto del logo */}
              <div className="ml-1">
                <span className="text-xl font-bold">
                                      <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #5b4aef 0%, #fb33af 100%)'}}>Talenta</span>
                    <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #fb33af 0%, #5b4aef 100%)'}}>Pro</span>
                </span>
              </div>
            </div>
          </div>
          <h2 className="text-xl text-gray-700">Panel de Administración</h2>
          <p className="mt-2 text-gray-600">
            Plataforma profesional de entrevistas
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Iniciar Sesión</h3>
          <p className="text-gray-600 mb-6 text-sm">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-500"
                  placeholder="admin@empresa.com"
                  // required // Quitar required nativo
                  disabled={loading}
                  autoComplete="username"
                />
                <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {error === 'Ingresa tu correo electrónico' && (
                <p className="text-sm text-red-600 mt-1">Por favor ingresa tu correo electrónico.</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent focus:bg-white transition-all text-gray-900 placeholder-gray-500"
                  placeholder="••••••••"
                  // required // Quitar required nativo
                  disabled={loading}
                  autoComplete="current-password"
                />
                <svg className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              {error === 'Ingresa tu contraseña' && (
                <p className="text-sm text-red-600 mt-1">Por favor ingresa tu contraseña.</p>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)',
                focusRingColor: '#5b4aef'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #4a3bd8 0%, #e02a98 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)';
                }
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Iniciar Sesión
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Debug info - Solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs text-gray-600">
            <p>Debug: Revisa la consola del navegador para ver logs detallados</p>
            <p>Si el login funciona pero no redirige, intenta recargar la página con Ctrl+F5</p>
          </div>
        )}
      </div>
    </div>
  )
} 