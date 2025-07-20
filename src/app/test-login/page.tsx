'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function TestLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [log, setLog] = useState<string[]>([])
  const supabase = createClientComponentClient()

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLog([]) // Clear previous logs
    addLog('Iniciando proceso de login...')

    try {
      // 1. Intentar login
      addLog('Llamando a signInWithPassword...')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        addLog(`❌ Error de login: ${error.message}`)
        return
      }

      addLog(`✅ Login exitoso! Usuario ID: ${data.user?.id}`)

      // 2. Verificar sesión
      addLog('Verificando sesión...')
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        addLog('❌ No hay sesión activa')
        return
      }
      
      addLog('✅ Sesión activa confirmada')

      // 3. Verificar rol
      addLog('Consultando rol del usuario...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user!.id)
        .single()

      if (profileError) {
        addLog(`❌ Error al obtener perfil: ${profileError.message}`)
        addLog(`Detalles: ${JSON.stringify(profileError)}`)
        return
      }

      addLog(`✅ Perfil obtenido: ${JSON.stringify(profile)}`)

      if (profile?.role !== 'admin') {
        addLog(`❌ Rol incorrecto: ${profile?.role} (necesita ser 'admin')`)
        await supabase.auth.signOut()
        return
      }

      addLog('✅ Usuario es admin!')
      addLog('🚀 Redirigiendo al dashboard en 3 segundos...')
      
      // 4. Redirigir
      setTimeout(() => {
        addLog('Ejecutando redirección...')
        // Redirigir al dashboard de prueba primero
        window.location.href = '/admin/test-dashboard'
      }, 3000)

    } catch (error: any) {
      addLog(`❌ Error inesperado: ${error.message}`)
      console.error('Error completo:', error)
    }
  }

  const handleCheckSession = async () => {
    addLog('Verificando sesión actual...')
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      addLog(`✅ Sesión activa: ${session.user.email}`)
      
      // Verificar rol
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        
      addLog(`Perfil: ${JSON.stringify(profile)}`)
    } else {
      addLog('❌ No hay sesión activa')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    addLog('✅ Sesión cerrada')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test de Login - Talium</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Formulario */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Login</h2>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="admin@ejemplo.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="••••••••"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-violet-600 text-white p-2 rounded hover:bg-violet-700"
              >
                Iniciar Sesión
              </button>
            </form>

            <div className="mt-4 space-y-2">
              <button
                onClick={handleCheckSession}
                className="w-full bg-gray-200 p-2 rounded hover:bg-gray-300 text-sm"
              >
                Verificar Sesión Actual
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full bg-red-100 p-2 rounded hover:bg-red-200 text-sm"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Logs del Proceso</h2>
            
            <div className="bg-gray-50 p-4 rounded h-96 overflow-y-auto">
              {log.length === 0 ? (
                <p className="text-gray-500 text-sm">Los logs aparecerán aquí...</p>
              ) : (
                <div className="space-y-1 text-sm font-mono">
                  {log.map((entry, i) => (
                    <div key={i} className={
                      entry.includes('❌') ? 'text-red-600' :
                      entry.includes('✅') ? 'text-green-600' :
                      entry.includes('🚀') ? 'text-blue-600' :
                      'text-gray-700'
                    }>
                      {entry}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-2">📝 Notas importantes:</h3>
          <ul className="list-disc list-inside text-sm text-amber-800 space-y-1">
            <li>Esta página está en /test-login (fuera del admin)</li>
            <li>Los logs muestran cada paso del proceso</li>
            <li>Si el login es exitoso, serás redirigido a /admin/dashboard</li>
            <li>Verifica que el usuario tenga role = 'admin' en la tabla profiles</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 