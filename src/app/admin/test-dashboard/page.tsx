'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function TestDashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/admin/login')
      return
    }
    
    setUser(session.user)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Dashboard de Prueba Funcionando! 🎉
          </h1>
          
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
            <p className="text-green-800">
              ✅ Has iniciado sesión correctamente como: <strong>{user?.email}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-gray-700">
              Esta es una página de dashboard simplificada sin el layout complejo.
            </p>
            
            <p className="text-gray-700">
              Si puedes ver esta página, significa que:
            </p>
            
            <ul className="list-disc list-inside text-gray-700 ml-4">
              <li>El login funciona correctamente</li>
              <li>La sesión se mantiene</li>
              <li>La redirección funciona</li>
              <li>El problema está en el layout o en el dashboard principal</li>
            </ul>

            <div className="pt-6">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-700 mr-4"
              >
                Ir al Dashboard Real
              </button>
              
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded p-4">
          <h3 className="font-semibold text-amber-900 mb-2">🔍 Información de Debug</h3>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>URL: /admin/test-dashboard</li>
            <li>Sin layout complejo</li>
            <li>Verificación simple de sesión</li>
            <li>Mira la consola del navegador para ver los logs</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 