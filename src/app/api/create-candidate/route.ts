import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name } = body
    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, error: 'Email inválido' }, { status: 400 })
    }
    // Crear usuario en auth.users usando la service role key
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        email,
        email_confirm: true,
        user_metadata: name ? { name } : {}
      })
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ success: false, error: data.msg || data.error || 'Error creando usuario' }, { status: 500 })
    }
    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Error inesperado' }, { status: 500 })
  }
} 