'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Send, CheckCircle, XCircle, AlertTriangle, Settings } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TestEmailPage() {
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testEmailSystem = async () => {
    if (!testEmail) {
      toast.error('Por favor ingresa un email')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail })
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast.success('Prueba completada - Revisa el resultado')
      } else {
        toast.error('Error en la prueba')
      }
    } catch (error) {
      toast.error('Error al probar el sistema')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkEnvironment = async () => {
    try {
      const response = await fetch('/api/test-email')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error checking environment:', error)
    }
  }

  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 rounded-2xl p-8 mb-8 shadow-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        
        <div className="relative">
          <h1 className="text-4xl font-bold text-white mb-2">Testing de Emails</h1>
          <p className="text-blue-100 text-lg">Prueba el sistema de envío de invitaciones antes del deploy</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Testing Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-white text-xl">
              <div className="p-2 bg-white/20 rounded-lg">
                <Mail className="w-6 h-6" />
              </div>
              Probar Envío de Email
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de prueba
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Este email recibirá la invitación de prueba
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={testEmailSystem}
                  disabled={loading || !testEmail}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {loading ? 'Probando...' : 'Probar Email'}
                </button>

                <button
                  onClick={checkEnvironment}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                  title="Verificar configuración"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                Resultado de la Prueba
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status */}
                <div className={`p-4 rounded-lg ${
                  result.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message || result.error}
                  </p>
                </div>

                {/* Environment Info */}
                {result.environment && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Configuración:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Gmail configurado:</span>
                        <span className={result.environment.hasGmailCredentials ? 'text-green-600' : 'text-red-600'}>
                          {result.environment.hasGmailCredentials ? '✅ Sí' : '❌ No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Modo desarrollo:</span>
                        <span className={result.environment.developmentMode ? 'text-amber-600' : 'text-green-600'}>
                          {result.environment.developmentMode ? '⚠️ Sí' : '✅ No'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>NODE_ENV:</span>
                        <span className="font-mono text-gray-700">
                          {result.environment.nodeEnv || 'undefined'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email Result */}
                {result.emailResult && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">Resultado del Email:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Enviado:</span>
                        <span className={result.emailResult.success ? 'text-green-600' : 'text-red-600'}>
                          {result.emailResult.success ? '✅ Sí' : '❌ No'}
                        </span>
                      </div>
                      {result.emailResult.debug && (
                        <div className="mt-2">
                          <span className="text-gray-600">Modo:</span>
                          <span className="ml-2 font-mono text-blue-700">
                            {result.emailResult.debug.mode}
                          </span>
                        </div>
                      )}
                      {result.emailResult.invitationLink && (
                        <div className="mt-2">
                          <span className="text-gray-600">Link generado:</span>
                          <div className="mt-1 p-2 bg-white border rounded text-blue-600 text-xs break-all">
                            {result.emailResult.invitationLink}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Raw Response */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                    Ver respuesta completa
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instructions */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-amber-800">
            <AlertTriangle className="w-6 h-6" />
            Instrucciones para Testing
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700">
          <div className="space-y-3 text-sm">
            <div>
              <strong>1. Modo Desarrollo:</strong> Si no tienes credenciales de Gmail configuradas, el sistema simulará el envío y mostrará el email en los logs de la consola.
            </div>
            <div>
              <strong>2. Modo Producción:</strong> Con credenciales de Gmail configuradas, se enviará un email real al destinatario.
            </div>
            <div>
              <strong>3. Variables requeridas:</strong> GMAIL_USER, GMAIL_PASS, NEXT_PUBLIC_SITE_URL
            </div>
            <div>
              <strong>4. Testing en Vercel:</strong> Agrega las variables de entorno en el panel de Vercel antes del deploy.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}