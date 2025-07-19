'use client'

import { useState, useRef, useEffect } from 'react'
import { Video, StopCircle, PlayCircle, RotateCcw, Upload } from 'lucide-react'

interface VideoRecorderProps {
  onSave: (blob: Blob) => void
  questionId: string
}

export default function VideoRecorder({ onSave, questionId }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    requestPermissions()
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
      // Stop all media tracks
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      setHasPermission(true)
    } catch (err) {
      console.error('Error accessing media devices:', err)
      setHasPermission(false)
    }
  }

  const startRecording = () => {
    if (!videoRef.current?.srcObject) return

    chunksRef.current = []
    const stream = videoRef.current.srcObject as MediaStream
    
    const options = { mimeType: 'video/webm;codecs=vp8,opus' }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'video/webm'
    }
    
    const mediaRecorder = new MediaRecorder(stream, options)
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      setRecordedBlob(blob)
      setRecordedUrl(URL.createObjectURL(blob))
    }
    
    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start(1000) // Collect data every second
    setIsRecording(true)
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const resetRecording = () => {
    setRecordedBlob(null)
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
      setRecordedUrl(null)
    }
    requestPermissions()
  }

  const saveRecording = async () => {
    if (recordedBlob) {
      setIsUploading(true)
      try {
        await onSave(recordedBlob)
      } finally {
        setIsUploading(false)
      }
    }
  }

  if (!hasPermission) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <Video className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <p className="text-red-700 font-medium">
          No se pudo acceder a la cámara y micrófono
        </p>
        <p className="text-red-600 text-sm mt-2">
          Por favor, permite el acceso en tu navegador y recarga la página
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
        {recordedUrl ? (
          <video
            src={recordedUrl}
            controls
            className="w-full h-full"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full"
          />
        )}
        
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-sm font-medium">Grabando</span>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-4">
        {!recordedUrl && !isRecording && (
          <button
            onClick={startRecording}
            className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <PlayCircle className="w-5 h-5" />
            <span>Iniciar Grabación</span>
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <StopCircle className="w-5 h-5" />
            <span>Detener</span>
          </button>
        )}

        {recordedUrl && (
          <>
            <button
              onClick={resetRecording}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Repetir</span>
            </button>
            
            <button
              onClick={saveRecording}
              disabled={isUploading}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-5 h-5" />
              <span>{isUploading ? 'Guardando...' : 'Guardar y Continuar'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
} 