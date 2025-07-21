'use client'

export default function TestInterviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Página de Prueba</h1>
        <p className="text-gray-600 mb-6">Si ves esta página, el servidor está funcionando correctamente.</p>
        <div className="space-y-2 text-left">
          <p className="text-sm"><strong>Puerto actual:</strong> 3007</p>
          <p className="text-sm"><strong>URL base:</strong> http://localhost:3007</p>
          <p className="text-sm"><strong>Ejemplo de link de entrevista:</strong></p>
          <code className="block text-xs bg-gray-100 p-2 rounded mt-1">
            http://localhost:3007/interview/[assignment-id]
          </code>
        </div>
      </div>
    </div>
  )
} 