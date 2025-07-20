'use client'

import { TrendingUp, Users, FileText, Clock, Award, Target } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-8 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Métricas y análisis de tus procesos de selección</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Entrevistas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">24</p>
            </div>
            <div className="p-3 bg-violet-100 rounded-lg">
              <FileText className="w-6 h-6 text-violet-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-3">+12% vs mes anterior</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Candidatos Totales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-3">+8% vs mes anterior</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa Completación</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">85%</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-green-600 mt-3">+5% vs mes anterior</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">18m</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-red-600 mt-3">-5% vs mes anterior</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance by Position */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-violet-600" />
            Rendimiento por Posición
          </h2>
          <div className="space-y-4">
            {[
              { position: 'Desarrollador Frontend', rate: 92, count: 45 },
              { position: 'Desarrollador Backend', rate: 87, count: 38 },
              { position: 'UX Designer', rate: 95, count: 23 },
              { position: 'Project Manager', rate: 78, count: 15 },
            ].map((item) => (
              <div key={item.position}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.position}</span>
                  <span className="text-gray-500">{item.rate}% ({item.count})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-violet-600 to-purple-600 h-2 rounded-full"
                    style={{ width: `${item.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Tendencias Recientes
          </h2>
          <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Gráfico de tendencias próximamente</p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">💡 Insights Clave</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Mejor Día</h3>
            <p className="text-violet-100">Los martes tienen 23% más tasa de completación</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tiempo Óptimo</h3>
            <p className="text-violet-100">Las entrevistas de 15-20 min tienen mejor engagement</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Top Performer</h3>
            <p className="text-violet-100">UX Designer tiene la mayor tasa de completación</p>
          </div>
        </div>
      </div>
    </div>
  )
} 