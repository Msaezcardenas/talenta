import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // TEMPORAL: Skip middleware para todas las rutas admin excepto login
  // Esto permite que la navegación funcione mientras solucionamos el problema de cookies
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    console.log(`[Middleware] SKIPPING auth check for ${pathname} - TEMPORAL`)
    return NextResponse.next()
  }
  
  // No procesar archivos estáticos
  if (pathname.includes('_next') || pathname.includes('.')) {
    return NextResponse.next()
  }

  console.log(`[Middleware] Processing: ${pathname}`)

  // Para la página de login, permitir siempre
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Solo verificar autenticación para rutas admin (excepto login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        console.log('[Middleware] No session, redirecting to login')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      
      console.log('[Middleware] Session valid for:', session.user.email)
      
      // Verificación de rol se hace en el layout, no aquí
      // Esto evita problemas de timing
    } catch (e) {
      console.error('[Middleware] Error:', e)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 