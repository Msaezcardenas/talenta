'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function EditInterviewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    toast('La edición de entrevistas estará disponible próximamente', {
      icon: '🔨',
      duration: 3000
    })
    router.push(`/admin/interviews/${id}`)
  }, [id, router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
    </div>
  )
} 