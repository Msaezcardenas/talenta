'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Plus,
  Bell,
  LogOut,
  Menu,
  X,
  UserPlus
} from 'lucide-react'

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Si estamos en la página de login, no verificar autenticación
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }
    
    // Pequeño delay para asegurar que las cookies estén sincronizadas
    const timer = setTimeout(() => {
      checkUser()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [pathname])

  const checkUser = async () => {
    try {
      console.log('AdminLayout: Verificando sesión...')
      
      // Usar getSession en lugar de getUser
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('AdminLayout: Error al obtener sesión:', sessionError)
        router.push('/admin/login')
        return
      }
      
      if (!session) {
        console.log('AdminLayout: No hay sesión activa, redirigiendo a login')
        router.push('/admin/login')
        return
      }

      console.log('AdminLayout: Sesión encontrada para:', session.user.email)
      setUser(session.user)

      // Verificar perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('AdminLayout: Error al obtener perfil:', profileError)
        router.push('/admin/login')
        return
      }

      if (!profile || profile.role !== 'admin') {
        console.log('AdminLayout: Usuario no es admin, role:', profile?.role)
        router.push('/')
        return
      }

      console.log('AdminLayout: Usuario verificado como admin')
      setProfile(profile)
      
    } catch (error) {
      console.error('AdminLayout: Error inesperado:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Entrevistas', href: '/admin/interviews', icon: FileText },
    { name: 'Candidatos', href: '/admin/candidates', icon: Users },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  ]

  const isActive = (href: string) => pathname === href

  // Si estamos en login, renderizar solo el contenido sin layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario después de verificar, no renderizar nada (ya se redirigió)
  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-105"
            >
              {sidebarOpen ? <X className="w-5 h-5 text-gray-600 hover:text-gray-900" /> : <Menu className="w-5 h-5 text-gray-600 hover:text-gray-900" />}
            </button>
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              {/* Logo de SkillzaPro */}
              <div className="flex items-center gap-2">
                {/* Iconos cuadrados del logo */}
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-sm transform rotate-45"></div>
                  <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-sm transform rotate-45 -ml-2"></div>
                </div>
                <div className="flex items-center -ml-1">
                  <div className="w-4 h-4 bg-gradient-to-br from-purple-600 to-purple-700 rounded-sm transform rotate-45"></div>
                  <div className="w-4 h-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-sm transform rotate-45 -ml-2"></div>
                </div>
                {/* Texto del logo */}
                <div className="ml-2">
                  <span className="text-lg font-bold">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Skillza</span>
                    <span className="bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">Pro</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'text-violet-600 bg-violet-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/interviews/new"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-lg font-medium text-sm transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Entrevista</span>
            </Link>
            <Link
              href="/admin/assign-interviews"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium text-sm transition-all shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Asignar Entrevistas</span>
            </Link>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-105">
              <Bell className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                {profile?.first_name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 rounded-lg transition-all hover:scale-105 group"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <nav className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'text-violet-600 bg-violet-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-20 px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
} 