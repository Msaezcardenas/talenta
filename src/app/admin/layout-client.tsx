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
  UserPlus,
  CheckCircle,
  Clock,
  UserCheck,
  MessageSquare,
  AlertTriangle
} from 'lucide-react'

interface Notification {
  id: string
  type: 'response' | 'assignment_completed' | 'assignment_pending' | 'new_candidate'
  title: string
  message: string
  time: string
  read: boolean
  actionUrl?: string
}

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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
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

  // Cargar notificaciones cuando el usuario esté autenticado
  useEffect(() => {
    if (user && profile?.role === 'admin') {
      loadNotifications()
      
      // Recargar notificaciones cada 5 minutos
      const interval = setInterval(loadNotifications, 5 * 60 * 1000)
      
      return () => clearInterval(interval)
    }
  }, [user, profile])

  const checkUser = async () => {
    try {
      // Usar getSession en lugar de getUser
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('AdminLayout: Error al obtener sesión:', sessionError)
        router.push('/admin/login')
        return
      }
      
      if (!session) {
        router.push('/admin/login')
        return
      }

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
        router.push('/')
        return
      }

      setProfile(profile)
      
    } catch (error) {
      console.error('AdminLayout: Error inesperado:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    if (!user) return
    
    setLoadingNotifications(true)
    try {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      // Obtener datos por separado para evitar errores de join
      const [responsesResult, assignmentsResult, candidatesResult, interviewsResult, profilesResult] = await Promise.all([
        // Respuestas recientes (últimas 24h)
        supabase
          .from('responses')
          .select('id, created_at, assignment_id')
          .gte('created_at', yesterday.toISOString())
          .order('created_at', { ascending: false }),
          
        // Todas las asignaciones
        supabase
          .from('assignments')
          .select('id, status, assigned_at, user_id, interview_id')
          .order('assigned_at', { ascending: false }),
          
        // Candidatos nuevos (última semana)
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email, created_at')
          .eq('role', 'candidate')
          .gte('created_at', weekAgo.toISOString())
          .order('created_at', { ascending: false }),

        // Entrevistas
        supabase
          .from('interviews')
          .select('id, name'),

        // Perfiles de usuarios
        supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
      ])

      const newNotifications: Notification[] = []

      // Crear mapas para búsqueda rápida
      const assignmentsMap = new Map(assignmentsResult.data?.map(a => [a.id, a]) || [])
      const interviewsMap = new Map(interviewsResult.data?.map(i => [i.id, i]) || [])
      const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p]) || [])

      // Procesar respuestas nuevas
      if (responsesResult.data) {
        responsesResult.data.forEach(response => {
          const assignment = assignmentsMap.get(response.assignment_id)
          if (!assignment) return
          
          const profile = profilesMap.get(assignment.user_id)
          const interview = interviewsMap.get(assignment.interview_id)
          
          newNotifications.push({
            id: `response_${response.id}`,
            type: 'response',
            title: 'Nueva Respuesta',
            message: `${profile?.first_name || 'Candidato'} ${profile?.last_name || ''} respondió a "${interview?.name || 'entrevista'}"`,
            time: formatTime(response.created_at),
            read: false,
            actionUrl: `/admin/interviews/${assignment.interview_id}/results`
          })
        })
      }

      // Procesar asignaciones completadas (últimas 24h)
      if (assignmentsResult.data) {
        const completedRecently = assignmentsResult.data.filter(a => 
          a.status === 'completed' && 
          new Date(a.assigned_at) >= yesterday
        )
        
        completedRecently.forEach(assignment => {
          const profile = profilesMap.get(assignment.user_id)
          const interview = interviewsMap.get(assignment.interview_id)
          
          newNotifications.push({
            id: `completed_${assignment.id}`,
            type: 'assignment_completed',
            title: 'Entrevista Completada',
            message: `${profile?.first_name || 'Candidato'} completó "${interview?.name || 'entrevista'}"`,
            time: formatTime(assignment.assigned_at),
            read: false,
            actionUrl: `/admin/interviews/${assignment.interview_id}/results`
          })
        })

        // Procesar asignaciones pendientes (más de 2 días)
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
        const pendingOld = assignmentsResult.data.filter(a => 
          a.status === 'pending' && 
          new Date(a.assigned_at) <= twoDaysAgo
        ).slice(0, 3) // Solo las 3 más antiguas
        
        pendingOld.forEach(assignment => {
          const profile = profilesMap.get(assignment.user_id)
          const interview = interviewsMap.get(assignment.interview_id)
          
          newNotifications.push({
            id: `pending_${assignment.id}`,
            type: 'assignment_pending',
            title: 'Asignación Pendiente',
            message: `${profile?.first_name || 'Candidato'} tiene "${interview?.name || 'entrevista'}" pendiente hace ${getDaysAgo(assignment.assigned_at)} días`,
            time: formatTime(assignment.assigned_at),
            read: false,
            actionUrl: `/admin/candidates`
          })
        })
      }

      // Procesar candidatos nuevos
      if (candidatesResult.data) {
        candidatesResult.data.slice(0, 3).forEach(candidate => {
          newNotifications.push({
            id: `candidate_${candidate.id}`,
            type: 'new_candidate',
            title: 'Nuevo Candidato',
            message: `${candidate.first_name || 'Candidato'} ${candidate.last_name || ''} se registró`,
            time: formatTime(candidate.created_at),
            read: false,
            actionUrl: `/admin/candidates`
          })
        })
      }

      // Ordenar por tiempo y limitar a 10
      newNotifications.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      
      // Aplicar estado de lectura desde localStorage
      const readIds = getReadNotifications()
      const notificationsWithReadStatus = newNotifications.slice(0, 10).map(notification => ({
        ...notification,
        read: readIds.has(notification.id)
      }))
      
      setNotifications(notificationsWithReadStatus)
      
      // Limpiar notificaciones antiguas del localStorage ocasionalmente
      // Solo ejecutar limpieza 1 de cada 10 veces para evitar eliminar notificaciones activas
      if (Math.random() < 0.1) {
        setTimeout(() => cleanupOldReadNotifications(), 100)
      }
      
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Ahora'
    if (diffMinutes < 60) return `${diffMinutes}m`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`
    return `${Math.floor(diffMinutes / 1440)}d`
  }

  const getDaysAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  }

  // Funciones para manejar localStorage de notificaciones leídas
  const getReadNotifications = (): Set<string> => {
    if (typeof window === 'undefined') return new Set()
    try {
      const stored = localStorage.getItem('readNotifications')
      if (!stored) return new Set()
      
      const data = JSON.parse(stored)
      // Compatibilidad con formato anterior (array directo) y nuevo formato (objeto con timestamp)
      if (Array.isArray(data)) {
        return new Set(data)
      } else if (data.ids && Array.isArray(data.ids)) {
        return new Set(data.ids)
      }
      return new Set()
    } catch {
      return new Set()
    }
  }

  const saveReadNotifications = (readIds: Set<string>) => {
    if (typeof window === 'undefined') return
    try {
      // Guardar con timestamp para poder hacer limpieza basada en tiempo
      const readData = {
        ids: [...readIds],
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('readNotifications', JSON.stringify(readData))
    } catch (error) {
      console.error('Error saving read notifications:', error)
    }
  }

  const cleanupOldReadNotifications = () => {
    if (typeof window === 'undefined') return
    try {
      // Limpiar solo notificaciones muy antiguas (más de 30 días)
      // En lugar de limpiar basado en notificaciones actuales
      const readIds = getReadNotifications()
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      // Filtrar solo las IDs que son relativamente recientes
      // Las IDs tienen formato como "response_123", "assignment_456", "candidate_789"
      // Solo limpiamos si tenemos demasiadas (más de 100)
      if (readIds.size > 100) {
        // Mantener solo las últimas 50 para evitar que crezca indefinidamente
        const readArray = [...readIds]
        const recentReadIds = new Set(readArray.slice(-50))
        saveReadNotifications(recentReadIds)
      }
    } catch (error) {
      console.error('Error cleaning up read notifications:', error)
    }
  }

  const markNotificationAsRead = (notificationId: string) => {
    // Actualizar estado local
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
    
    // Persistir en localStorage
    const readIds = getReadNotifications()
    readIds.add(notificationId)
    saveReadNotifications(readIds)
  }

  const markAllNotificationsAsRead = () => {
    // Actualizar estado local
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    
    // Persistir en localStorage
    const allIds = new Set(notifications.map(n => n.id))
    saveReadNotifications(allIds)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'response':
        return <MessageSquare className="w-4 h-4 text-blue-600" />
      case 'assignment_completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'assignment_pending':
        return <Clock className="w-4 h-4 text-amber-600" />
      case 'new_candidate':
        return <UserCheck className="w-4 h-4 text-purple-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const getNotificationIconBg = (type: string) => {
    switch (type) {
      case 'response':
        return 'bg-blue-100'
      case 'assignment_completed':
        return 'bg-green-100'
      case 'assignment_pending':
        return 'bg-amber-100'
      case 'new_candidate':
        return 'bg-purple-100'
      default:
        return 'bg-gray-100'
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
              {/* Logo de TalentaPro */}
              <div className="flex items-center gap-2">
                {/* Logo TalentaPro con cuadrados personalizados */}
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded-sm transform rotate-45" style={{background: '#5b4aef'}}></div>
                  <div className="w-4 h-4 rounded-sm transform rotate-45 -ml-2" style={{background: 'linear-gradient(135deg, #5b4aef 0%, #fb33af 100%)'}}></div>
                </div>
                <div className="flex items-center -ml-1">
                  <div className="w-4 h-4 rounded-sm transform rotate-45" style={{background: 'linear-gradient(135deg, #fb33af 0%, #5b4aef 100%)'}}></div>
                  <div className="w-4 h-4 rounded-sm transform rotate-45 -ml-2" style={{background: '#fb33af'}}></div>
                </div>
                {/* Texto del logo */}
                <div className="ml-1">
                  <span className="text-lg font-bold">
                    <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #5b4aef 0%, #fb33af 100%)'}}>Talenta</span>
                    <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(90deg, #fb33af 0%, #5b4aef 100%)'}}>Pro</span>
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
            <div className="relative">
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-105"
              >
                <Bell className="w-5 h-5 text-gray-600 hover:text-gray-900 transition-colors" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {notifications.filter(n => !n.read).length > 9 ? '9+' : notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              
              {/* Dropdown de notificaciones */}
              {notificationsOpen && (
                <>
                  {/* Overlay para cerrar al hacer click afuera */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationsOpen(false)}
                  />
                  
                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                        {loadingNotifications && (
                          <div className="w-4 h-4 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin"></div>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p>No hay notificaciones</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                              !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                            }`}
                            onClick={() => {
                              // Marcar como leída al hacer click
                              markNotificationAsRead(notification.id)
                              
                              if (notification.actionUrl) {
                                router.push(notification.actionUrl)
                              }
                              
                              // Cerrar dropdown después de hacer click
                              setNotificationsOpen(false)
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${getNotificationIconBg(notification.type)}`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm text-gray-900 truncate">
                                    {notification.title}
                                  </p>
                                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                    {notification.time}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-sm text-violet-600 hover:text-violet-700 font-medium"
                        >
                          Marcar todas como leídas
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
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