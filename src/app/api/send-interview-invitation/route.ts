import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  try {
    const { assignmentId, candidateEmail, candidateName, interviewTitle, token } = await request.json()
    
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview/${token}`
    
    // Para desarrollo, simularemos el envío de email si no hay API key de Resend
    if (!process.env.RESEND_API_KEY || process.env.NODE_ENV === 'development') {
      console.log('=== EMAIL SIMULADO ===')
      console.log(`Para: ${candidateEmail}`)
      console.log(`Asunto: Invitación a Entrevista - ${interviewTitle}`)
      console.log(`
Hola ${candidateName || 'Candidato'},

Has sido seleccionado para participar en el proceso de entrevista para: ${interviewTitle}

Para acceder a tu entrevista, haz clic en el siguiente enlace:
${invitationLink}

Este enlace es único y personal. No lo compartas con nadie más.

Saludos,
Equipo de Talium
      `)
      console.log('=== FIN EMAIL ===')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Invitación enviada (modo desarrollo)',
        invitationLink // En desarrollo, devolvemos el link para testing
      })
    }

    // Envío real con Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    await resend.emails.send({
      from: 'Talium <onboarding@resend.dev>', // Cambiar a tu dominio verificado
      to: candidateEmail,
      subject: `Invitación a Entrevista - ${interviewTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(to right, #7c3aed, #a855f7); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Talium</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <h2 style="color: #111827;">Hola ${candidateName || 'Candidato'},</h2>
            <p style="color: #6b7280; line-height: 1.6;">
              Has sido seleccionado para participar en el proceso de entrevista para:
            </p>
            <h3 style="color: #7c3aed;">${interviewTitle}</h3>
            <p style="color: #6b7280; line-height: 1.6;">
              Para acceder a tu entrevista, haz clic en el siguiente botón:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="display: inline-block; padding: 12px 30px; background: linear-gradient(to right, #7c3aed, #a855f7); 
                        color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Comenzar Entrevista
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              O copia y pega este enlace en tu navegador:<br>
              <code style="background: #e5e7eb; padding: 5px; border-radius: 4px;">${invitationLink}</code>
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
              Este enlace es único y personal. No lo compartas con nadie más.
            </p>
          </div>
        </div>
      `
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Invitación enviada correctamente'
    })

  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Error al enviar invitación' },
      { status: 500 }
    )
  }
} 