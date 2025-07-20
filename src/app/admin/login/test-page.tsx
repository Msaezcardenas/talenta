'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function TestLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('Iniciando sesión...')

    try {
      // 1. Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setMessage(`Error de login: ${error.message}`)
        return
      }

      setMessage('Login exitoso! Verificando rol...')

      // 2. Verificar rol
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user!.id)
        .single()

      if (profileError) {
        setMessage(`Error al obtener perfil: ${profileError.message}`)
        return
      }

      if (profile?.role !== 'admin') {
        setMessage('No tienes permisos de admin')
        await supabase.auth.signOut()
        return
      }

      setMessage('Eres admin! Redirigiendo en 2 segundos...')
      
      // 3. Redirigir
      setTimeout(() => {
        window.location.href = '/admin/dashboard'
      }, 2000)

    } catch (error: any) {
      setMessage(`Error inesperado: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Test Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            {message}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-500">
          <p>Esta página muestra el proceso paso a paso del login.</p>
          <p>Después del login exitoso, deberías ser redirigido a /admin/dashboard</p>
        </div>
      </div>
    </div>
  )
} 