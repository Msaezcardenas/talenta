import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📧 Send invitation API called with:', body)
    
    const { assignmentId, candidateEmail, candidateName, interviewTitle, token } = body
    
    // Usar NEXT_PUBLIC_SITE_URL o NEXT_PUBLIC_APP_URL o localhost como fallback
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${appUrl}/interview/${token}`
    const interviewDuration = '45-60 min'
    const supportEmail = 'soporte@skillzapro.com'
    const expirationDays = 7
    
    // Para desarrollo, simularemos el envío de email si no hay credenciales de Gmail
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || process.env.NODE_ENV === 'development') {
      console.log('📧 Running in development mode or no Gmail credentials')
      console.log('=== EMAIL SIMULADO ===')
      console.log(`Para: ${candidateEmail}`)
      console.log(`Asunto: Invitación a Entrevista - ${interviewTitle}`)
      console.log(`\nHola${candidateName && candidateName.trim() ? ` ${candidateName}` : ''},\n\nHas sido seleccionado para participar en el proceso de entrevista para: ${interviewTitle}\n\nPara acceder a tu entrevista, haz clic en el siguiente enlace:\n${invitationLink}\n\nEste enlace es único y personal. No lo compartas con nadie más.\n\nSaludos,\nEquipo de SkillzaPro\n      `)
      console.log('=== FIN EMAIL ===')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Invitación enviada (modo desarrollo)',
        invitationLink, // En desarrollo, devolvemos el link para testing
        debug: {
          mode: 'development',
          hasGmail: !!process.env.GMAIL_USER,
          email: candidateEmail
        }
      })
    }

    // Envío real con nodemailer (Gmail)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    })

    const mailOptions = {
      from: `SkillzaPro <${process.env.GMAIL_USER}>`,
      to: candidateEmail,
      subject: `Invitación a Entrevista - ${interviewTitle}`,
      html: `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invitación a Entrevista - SkillzaPro</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f7fb;font-family:'Segoe UI',Arial,sans-serif;color:#222;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:0;margin:0;">
      <tr>
        <td>
          <table width="600" align="center" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(80,0,120,0.07);margin:40px auto 24px auto;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(90deg,#7c3aed 0%,#a855f7 100%);padding:36px 0;text-align:center;">
                <a href="https://skillzapro.vercel.app/" style="text-decoration:none;">
                  <div style="font-size:2rem;font-weight:700;color:#fff;letter-spacing:1px;display:inline-block;">SkillzaPro</div>
                </a>
                <div style="color:#e0d7fa;font-size:1rem;margin-top:8px;">Plataforma de Entrevistas Inteligentes</div>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px 24px 32px;">
                <div style="font-size:1.4rem;font-weight:600;margin-bottom:8px;">¡Hola${candidateName && candidateName.trim() ? ` ${candidateName}` : ''}! <span style="font-size:1.2rem;">👋</span></div>
                <div style="font-size:1.1rem;color:#555;margin-bottom:32px;">Te invitamos a participar en nuestro proceso de selección.</div>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1ff;border:1.5px solid #a855f7;border-radius:12px;margin-bottom:32px;">
                  <tr>
                    <td style="padding:24px 20px;">
                      <div>
                        <div style="font-weight:600;font-size:1.08rem;color:#3b0764;margin-bottom:2px;">Posición: ${interviewTitle}</div>
                        <div style="color:#6b7280;font-size:0.98rem;margin-bottom:8px;">Te invitamos a completar la siguiente etapa de nuestro proceso de selección a través de nuestra plataforma de entrevistas.</div>
                        <div style="color:#7c3aed;font-size:0.97rem;margin-top:8px;">
                          <span style="font-weight:500;">⏱️ Duración: ${interviewDuration}</span> &nbsp; <span style="font-weight:500;">🔒 Enlace seguro</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="text-align:center;margin-bottom:32px;">
                  <a href="${invitationLink}" style="display:inline-block;padding:18px 38px;background:linear-gradient(90deg,#a855f7 0%,#7c3aed 100%);color:#fff;font-weight:600;font-size:1.15rem;border-radius:12px;text-decoration:none;box-shadow:0 2px 8px rgba(124,58,237,0.10);transition:background 0.2s;">Comenzar Entrevista</a>
                </div>
                <div style="text-align:center;color:#6b7280;font-size:1rem;margin-bottom:32px;">
                  Haz clic en el botón para acceder directamente a tu entrevista
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;border-radius:10px;margin-bottom:32px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="font-weight:600;color:#111827;margin-bottom:6px;">¿Problemas con el botón?</div>
                      <div style="color:#6b7280;font-size:0.98rem;margin-bottom:8px;">También puedes copiar y pegar este enlace en tu navegador:</div>
                      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:7px;padding:10px 12px;font-size:0.97rem;word-break:break-all;color:#7c3aed;">${invitationLink}</div>
                    </td>
                  </tr>
                </table>
                <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9c3;border:1.5px solid #fde68a;border-radius:10px;margin-bottom:32px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:1.2rem;">⚠️</span>
                        <div style="color:#b45309;font-weight:600;font-size:1rem;">Información importante</div>
                      </div>
                      <div style="color:#92400e;font-size:0.98rem;margin-top:4px;">Este enlace es único y personal. Por favor, no lo compartas con terceros. El enlace expirará en ${expirationDays} días desde la fecha de envío.</div>
                    </td>
                  </tr>
                </table>
                <div style="text-align:center;color:#6b7280;font-size:0.97rem;margin-bottom:0;">
                  ¿Tienes alguna pregunta? Contáctanos en <a href="mailto:${supportEmail}" style="color:#7c3aed;text-decoration:underline;">${supportEmail}</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background:#f6f7fb;text-align:center;padding:24px 0 18px 0;color:#a1a1aa;font-size:0.98rem;border-radius:0 0 16px 16px;">
                © 2024 SkillzaPro. Todos los derechos reservados.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `,
    }

    const emailResponse = await transporter.sendMail(mailOptions)
    console.log('📧 Respuesta de nodemailer:', emailResponse)

    return NextResponse.json({ 
      success: true, 
      message: 'Invitación enviada correctamente',
      emailId: emailResponse.messageId, // ID del email para rastrear
      debug: {
        to: candidateEmail,
        from: process.env.GMAIL_USER,
        messageId: emailResponse.messageId
      }
    })

  } catch (error) {
    console.error('Error sending invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Error al enviar invitación' },
      { status: 500 }
    )
  }
} 