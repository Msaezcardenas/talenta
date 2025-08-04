import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { testEmail } = body
    
    if (!testEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email de prueba requerido' 
      }, { status: 400 })
    }

    // Datos de prueba
    const mockAssignmentData = {
      assignmentId: 'test-assignment-123',
      candidateEmail: testEmail,
      candidateName: 'Usuario de Prueba',
      interviewTitle: 'Entrevista de Prueba - TalentaPro',
      token: 'test-token-123'
    }

    console.log('🧪 TESTING EMAIL SYSTEM')
    console.log('📧 Enviando email de prueba a:', testEmail)
    console.log('📋 Datos de prueba:', mockAssignmentData)

    // Llamar al API real de envío
    const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/send-interview-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockAssignmentData)
    })

    const emailResult = await emailResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Prueba de email completada',
      testData: mockAssignmentData,
      emailResult: emailResult,
      environment: {
        hasGmailUser: !!process.env.GMAIL_USER,
        hasGmailPass: !!process.env.GMAIL_PASS,
        nodeEnv: process.env.NODE_ENV,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL
      }
    })

  } catch (error) {
    console.error('🚨 Error en prueba de email:', error)
    return NextResponse.json({
      success: false,
      error: 'Error en la prueba de email',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para testing de emails',
    usage: 'POST con { "testEmail": "tu@email.com" }',
    environment: {
      hasGmailCredentials: !!(process.env.GMAIL_USER && process.env.GMAIL_PASS),
      nodeEnv: process.env.NODE_ENV,
      developmentMode: !process.env.GMAIL_USER || !process.env.GMAIL_PASS || process.env.NODE_ENV === 'development'
    }
  })
}