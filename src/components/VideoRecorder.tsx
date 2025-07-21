'use client'

import { useState, useRef, useEffect } from 'react'
import { Video, StopCircle, PlayCircle, RotateCcw, Upload, Loader2 } from 'lucide-react'

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
  const [permissionError, setPermissionError] = useState<string | null>(null)
  
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
      setPermissionError(null)
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
      setPermissionError('No se pudo acceder a la cámara y micrófono. Por favor, permite el acceso en tu navegador.')
    }
  }

  const startRecording = () => {
    if (!videoRef.current?.srcObject) {
      requestPermissions()
      return
    }

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
    if (!recordedBlob) return
    
    setIsUploading(true)
    try {
      await onSave(recordedBlob)
    } catch (error) {
      console.error('Error saving video:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Video Preview/Recording Area */}
      <div className="relative bg-black rounded-xl overflow-hidden shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!recordedUrl}
          src={recordedUrl || undefined}
          className="w-full h-[400px] object-cover"
        />
        
        {!hasPermission && !recordedUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="text-center text-white p-6">
              <Video className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {permissionError ? (
                <>
                  <p className="text-sm mb-4">{permissionError}</p>
                  <button
                    onClick={requestPermissions}
                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
                  >
                    Reintentar
                  </button>
                </>
              ) : (
                <p className="text-sm">Solicitando acceso a la cámara...</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        {!recordedUrl ? (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!hasPermission || isUploading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white'
            }`}
          >
            {isRecording ? (
              <>
                <StopCircle className="w-5 h-5" />
                Detener Grabación
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Iniciar Grabación
              </>
            )}
          </button>
        ) : (
          <>
            <button
              onClick={resetRecording}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5" />
              Regrabar
            </button>
            <button
              onClick={saveRecording}
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all transform hover:scale-105 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Guardar y Continuar
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
} 