import { useState, useEffect, useRef, useCallback } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { roomsApi } from '@/lib/api'
import { socketService } from '@/lib/socket'

interface TranscriptMessage {
  id: string
  text: string
  timestamp: Date
  senderName: string
}

interface VoiceTranscriptionProps {
  roomId?: string
}

export default function VoiceTranscription({ roomId }: VoiceTranscriptionProps) {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<TranscriptMessage[]>([])
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [micPermission, setMicPermission] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [loading, setLoading] = useState(false)
  const recognitionRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const userName = user?.name || 'Usuario'

  useEffect(() => {
    if (!roomId) return
    
    const load = async () => {
      try {
        setLoading(true)
        const res = await roomsApi.getVoiceTranscripts(roomId)
        const data = res.data || res
        setMessages(data.map((t: any) => ({
          id: t.id,
          text: t.content,
          timestamp: new Date(t.createdAt),
          senderName: t.sender?.name || 'Usuario'
        })))
      } catch (err) {
        console.error('Error loading transcripts:', err)
      } finally {
        setLoading(false)
      }
    }
    
    load()
  }, [roomId])

  const userRef = useRef(user)
  userRef.current = user

  const saveTranscript = useCallback((text: string) => {
    if (!roomId || !user) return
    
    const timestamp = Date.now()
    setMessages(prev => [...prev, {
      id: `temp-${timestamp}`,
      text,
      timestamp: new Date(),
      senderName: user.name || 'Usuario'
    }])
    
    socketService.sendVoiceTranscript(roomId, user.id, text)
  }, [roomId, user])

  useEffect(() => {
    if (!roomId) return

    socketService.onVoiceTranscript((transcript: any) => {
      setMessages(prev => {
        const tempMatch = prev.find(m => 
          m.id.startsWith('temp-') && 
          m.text === transcript.content &&
          m.senderName === (transcript.sender?.name || 'Usuario')
        )
        
        if (tempMatch) {
          return prev.map(m => 
            m.id === tempMatch.id 
              ? { ...m, id: transcript.id }
              : m
          )
        }
        
        if (prev.some(m => m.id === transcript.id)) return prev
        
        return [...prev, {
          id: transcript.id,
          text: transcript.content,
          timestamp: new Date(transcript.createdAt),
          senderName: transcript.sender?.name || 'Usuario'
        }]
      })
    })

    return () => {
      socketService.offVoiceTranscript()
    }
  }, [roomId])

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'es-ES'

    recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (interimTranscript.trim()) {
        setCurrentTranscript(interimTranscript.trim())
      }

      if (finalTranscript.trim()) {
        const text = finalTranscript.trim()
        setCurrentTranscript('')
        if (roomId) {
          saveTranscript(text)
        }
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'not-allowed') {
        setMicPermission('denied')
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start()
        } catch (e) {
          console.log('Recognition restart error:', e)
        }
      }
    }

    recognitionRef.current = recognition

    const startRecognition = async () => {
      try {
        await recognition.start()
        setIsListening(true)
        setMicPermission('granted')
      } catch (e: any) {
        console.log('Start error:', e.message)
        if (e.message?.includes('permission')) {
          setMicPermission('denied')
        }
      }
    }

    startRecognition()

    return () => {
      setIsListening(false)
      try {
        recognition.stop()
      } catch (e) {}
    }
  }, [roomId, userName, saveTranscript])

  const clearMessages = () => {
    setMessages([])
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentTranscript])

  if (!isSupported) {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0b] p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-zinc-500">
            <p>Tu navegador no soporta reconocimiento de voz</p>
            <p className="text-xs mt-2">Prueba con Chrome o Edge</p>
          </div>
        </div>
      </div>
    )
  }

  if (micPermission === 'denied') {
    return (
      <div className="h-full flex flex-col bg-[#0a0a0b] p-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-zinc-500">
            <p>Permiso de micrófono denegado</p>
            <p className="text-xs mt-2">Por favor permite el acceso al micrófono en tu navegador</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-sm font-medium text-white">Transcripción de Voz</span>
          {roomId && <span className="text-xs text-zinc-500">(Guardado)</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearMessages}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
            title="Limpiar mensajes"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
          </div>
        ) : messages.length === 0 && !currentTranscript ? (
          <div className="text-center text-zinc-500 text-sm py-8">
            <p>{isListening ? 'Escuchando...' : 'Iniciando...'}</p>
            <p className="text-xs mt-1">Tu voz será convertida a texto automáticamente</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-[90%] px-4 py-3 rounded-2xl bg-primary-500/20 border border-primary-500/30">
                  <p className="text-xs font-medium text-primary-400 mb-1">{msg.senderName}:</p>
                  <p className="text-sm text-white">{msg.text}</p>
                  <p className="text-xs text-zinc-500 mt-1">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            ))}
            {currentTranscript && (
              <div className="flex justify-start">
                <div className="max-w-[90%] px-4 py-3 rounded-2xl bg-zinc-700/50 border border-zinc-600">
                  <p className="text-xs font-medium text-zinc-400 mb-1">{userName}:</p>
                  <p className="text-sm text-zinc-300 italic">{currentTranscript}...</p>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-[#27272a]">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{isListening ? '🔴 Escuchando' : 'Iniciando...'}</span>
          <span>{messages.length} transcript{messages.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}