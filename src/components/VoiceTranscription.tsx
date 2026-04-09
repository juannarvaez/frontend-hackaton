import { useState, useEffect, useRef } from 'react'

interface TranscriptMessage {
  id: string
  speaker: 'host' | 'invited'
  text: string
  timestamp: Date
}

interface VoiceTranscriptionProps {
  isInCall: boolean
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  currentUserId: string
  otherUserName: string
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export default function VoiceTranscription({ 
  isInCall, 
  localStream, 
  remoteStream,
  currentUserId,
  otherUserName 
}: VoiceTranscriptionProps) {
  const [messages, setMessages] = useState<TranscriptMessage[]>([])
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'es-ES'
    
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('')
      
      if (transcript.trim() && event.results[event.results.length - 1].isFinal) {
        const newMessage: TranscriptMessage = {
          id: Date.now().toString(),
          speaker: 'host',
          text: transcript.trim(),
          timestamp: new Date()
        }
        setMessages(prev => [...prev, newMessage])
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error !== 'aborted') {
        setIsListening(false)
      }
    }

    recognition.onend = () => {
      if (isInCall && isListening) {
        try {
          recognition.start()
        } catch (e) {
          console.log('Recognition already started')
        }
      }
    }

    recognitionRef.current = recognition

    return () => {
      try {
        recognition.stop()
      } catch (e) {
        console.log('Recognition already stopped')
      }
    }
  }, [isInCall])

  useEffect(() => {
    if (!recognitionRef.current) return
    
    if (isInCall && !isListening) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.log('Recognition already started:', e)
      }
    } else if (!isInCall && isListening) {
      try {
        recognitionRef.current.stop()
        setIsListening(false)
      } catch (e) {
        console.log('Recognition already stopped:', e)
      }
    }
  }, [isInCall])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-full flex flex-col bg-[#0a0a0b]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#27272a]">
        <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-zinc-500'}`} />
        <Mic className="w-4 h-4 text-zinc-500" />
        <span className="text-sm font-medium text-white">Transcripción de Voz</span>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-8">
            <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Escuchando...</p>
            <p className="text-xs mt-1">Las palabras reconocidas aparecerán aquí</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.speaker === 'host' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl ${
                msg.speaker === 'host' 
                  ? 'bg-primary-500/20 border border-primary-500/30 text-white' 
                  : 'bg-[#1c1c1f] text-white'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary-400">
                    {msg.speaker === 'host' ? 'Tú' : otherUserName}
                  </span>
                  <span className="text-xs text-zinc-500">{formatTime(msg.timestamp)}</span>
                </div>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-[#27272a]">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{isListening ? 'Escuchando...' : 'Inactivo'}</span>
          <span>{messages.length} mensajes</span>
        </div>
      </div>
    </div>
  )
}

function Mic({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  )
}