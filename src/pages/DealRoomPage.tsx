import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dealsApi, roomsApi } from '@/lib/api'
import { socketService } from '@/lib/socket'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { 
  Car, ChevronLeft, MessageCircle, Video, VideoOff, Phone, Mic, MicOff,
  Send, Sparkles, DollarSign, X, Minimize2, Maximize2, FileText,
  TrendingUp, AlertCircle, CheckCircle, Clock, User
} from 'lucide-react'
import type { Message } from '@/types'

export default function DealRoomPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isAudioOn, setIsAudioOn] = useState(true)
  const [isInCall, setIsInCall] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [hasRemoteStream, setHasRemoteStream] = useState(false)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const isAudioOnRef = useRef(true)

  const handleAcceptCallRef = useRef<any>(null)
  const handleRemoteAnswerRef = useRef<any>(null)
  const handleIceCandidateRef = useRef<any>(null)

  const { data: dealData, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => dealsApi.getById(id!),
    enabled: !!id,
  })

  const deal = dealData?.data
  const isSeller = user && deal?.seller?.id === user.id
  const otherUser = isSeller ? deal?.buyer : deal?.seller
  const vehicle = deal?.vehicle

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => roomsApi.sendMessage(deal?.room?.id!, { content }),
  })

  useEffect(() => {
    if (!deal?.room?.id || !user) return

    socketService.connect()
    socketService.authenticate(user.id)
    socketService.joinRoom(deal.room.id, user.id)

    const loadMessages = async () => {
      try {
        const res = await roomsApi.getMessages(deal.room.id)
        setMessages(res.data || [])
      } catch (e) { console.error(e) }
    }
    loadMessages()

    socketService.onChatMessage((msg) => {
      setMessages((prev) => [...prev, msg])
    })

    socketService.onUserJoined(({ userId }) => {
      toast.info(`Usuario joined`)
    })

    socketService.onOffer((data: any) => handleAcceptCallRef.current?.(data))
    socketService.onAnswer((data: any) => handleRemoteAnswerRef.current?.(data))
    socketService.onIceCandidate((data: any) => handleIceCandidateRef.current?.(data))

    return () => {
      socketService.leaveRoom(deal.room.id, user.id)
      socketService.removeAllListeners()
    }
  }, [deal?.room?.id, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startCall = async () => {
    if (!otherUser?.id) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)
      analyser.fftSize = 256

      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      let animationId: number
      const checkAudioLevel = () => {
        if (!localStreamRef.current) {
          setIsSpeaking(false)
          return
        }
        
        if (!isAudioOnRef.current) {
          setIsSpeaking(false)
          animationId = requestAnimationFrame(checkAudioLevel)
          return
        }
        
        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        const speaking = average > 30
        setIsSpeaking(speaking)
        animationId = requestAnimationFrame(checkAudioLevel)
      }
      checkAudioLevel()

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
      
      pc.onicecandidate = (e) => {
        if (e.candidate && otherUser?.id) {
          socketService.sendIceCandidate(deal.room.id, otherUser.id, e.candidate)
        }
      }

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0]
          setHasRemoteStream(true)
        }
      }

      peerConnectionRef.current = pc

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socketService.sendOffer(deal.room.id, otherUser.id, offer)
      
      setIsInCall(true)

    } catch (err) {
      console.error('Error al iniciar video:', err)
      toast.error('Error al iniciar video')
    }
  }

  const handleAcceptCall = useCallback(async (data: { offer: RTCSessionDescriptionInit; from: string }) => {
    if (!otherUser?.id) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })
      
      stream.getTracks().forEach(track => pc.addTrack(track, stream))
      
      pc.onicecandidate = (e) => {
        if (e.candidate && otherUser?.id) {
          socketService.sendIceCandidate(deal.room.id, otherUser.id, e.candidate)
        }
      }

      pc.ontrack = (e) => {
        if (remoteVideoRef.current && e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0]
          setHasRemoteStream(true)
        }
      }

      peerConnectionRef.current = pc

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      socketService.sendAnswer(data.from, answer)

      setIsInCall(true)
    } catch (err) {
      console.error('Error al aceptar llamada:', err)
    }
  }, [otherUser?.id, deal?.room?.id])

  const handleRemoteAnswer = useCallback(async (data: { answer: RTCSessionDescriptionInit }) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
    }
  }, [])

  const handleIceCandidate = useCallback(async (data: { candidate: RTCIceCandidateInit }) => {
    if (peerConnectionRef.current) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
    }
  }, [])

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    peerConnectionRef.current?.close()
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    setIsSpeaking(false)
    setHasRemoteStream(false)
    if (otherUser?.id) {
      socketService.endCall(deal.room.id, otherUser.id)
    }
    setIsInCall(false)
  }

  useEffect(() => {
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
  }, [localStreamRef.current])

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoOn
      })
    }
  }, [isVideoOn])

  useEffect(() => {
    isAudioOnRef.current = isAudioOn
    if (!isAudioOn) {
      setIsSpeaking(false)
    }
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isAudioOn
      })
    }
  }, [isAudioOn])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await sendMessageMutation.mutateAsync(newMessage)
    if (user) socketService.sendChatMessage(deal.room.id!, user.id, newMessage)
    setNewMessage('')

    if (newMessage.toLowerCase().includes('precio') || newMessage.toLowerCase().includes('precio')) {
      setAiTyping(true)
      setTimeout(() => {
        const aiMsg: Message = {
          id: Date.now().toString(),
          content: generateAIResponse(newMessage, vehicle, deal),
          senderId: 'ai',
          sender: { id: 'ai', name: 'Asistente IA' },
          createdAt: new Date().toISOString(),
        }
        setMessages(prev => [...prev, aiMsg])
        setAiTyping(false)
      }, 1500)
    }
  }

  const generateAIResponse = (query: string, vehicle: any, deal: any) => {
    const price = vehicle?.price
    const marketValue = vehicle?.aiAnalysis?.marketValue || price
    
    if (query.toLowerCase().includes('precio')) {
      return `El precio actual es $${price?.toLocaleString()}. El análisis IA indica un valor de mercado de $${marketValue?.toLocaleString()} (puntuación: ${vehicle?.aiAnalysis?.priceScore}%). ${vehicle?.aiAnalysis?.recommendations}`
    }
    if (query.toLowerCase().includes('vehiculo') || query.toLowerCase().includes('caracteristica')) {
      return `Vehículo: ${vehicle?.year} ${vehicle?.make} ${vehicle?.model}. Kilometraje: ${vehicle?.mileage?.toLocaleString()} km. Condición: ${vehicle?.condition}. Transmission: ${vehicle?.transmission}.`
    }
    return 'Estoy aquí para ayudarte. Pregúntame sobre el vehículo, el precio, o cualquier aspecto de la negociación.'
  }

  handleAcceptCallRef.current = handleAcceptCall
  handleRemoteAnswerRef.current = handleRemoteAnswer
  handleIceCandidateRef.current = handleIceCandidate

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-[#141416] rounded-2xl" /></div>
  }

  if (!deal) {
    return <div className="p-8 text-center"><p className="text-zinc-500">Deal no encontrado</p></div>
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0b]">
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#27272a]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 text-zinc-500 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">{vehicle?.year} {vehicle?.make} {vehicle?.model}</h1>
            <p className="text-sm text-zinc-500">{deal.status} • {otherUser?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            deal.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-400' :
            deal.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
            'bg-yellow-500/10 text-yellow-400'
          }`}>
            {deal.status}
          </span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-[#141416]">
            <div className="absolute inset-0 flex items-center justify-center">
              {!isInCall ? (
                <div className="text-center">
                  <Video className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500 mb-4">Inicia una videollamada para cerrar el deal más rápido</p>
                  <button
                    onClick={startCall}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-xl flex items-center gap-2 mx-auto"
                  >
                    <Video className="w-5 h-5" /> Iniciar Videollamada
                  </button>
                </div>
              ) : (
                <>
                  {hasRemoteStream ? (
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#1c1c1f]">
                      <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-3xl font-semibold text-zinc-400 mb-4">
                        <User className="w-12 h-12" />
                      </div>
                      <p className="text-white font-medium">Esperando a que se una el otro participante...</p>
                      <p className="text-zinc-500 text-sm">Inicia la llamada para que reciban la invitación</p>
                    </div>
                  )}
                  <div className={`absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 transition-all duration-150 ${isSpeaking ? 'border-green-400 shadow-lg shadow-green-400/50' : 'border-zinc-700'}`}>
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                    {!isVideoOn && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1c1c1f]">
                        <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-lg font-semibold text-white">
                          {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{user?.name || 'Tú'}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {isInCall && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={() => setIsAudioOn(!isAudioOn)}
                  className={`p-4 rounded-full ${isAudioOn ? 'bg-zinc-700' : 'bg-red-500'} text-white`}
                >
                  {isAudioOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-4 rounded-full ${isVideoOn ? 'bg-zinc-700' : 'bg-red-500'} text-white`}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={endCall}
                  className="p-4 rounded-full bg-red-500 text-white"
                >
                  <Phone className="w-5 h-5 rotate-[135deg]" />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-4 rounded-full bg-zinc-700 text-white"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>

          <div className="h-64 border-t border-[#27272a] flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#27272a]">
              <MessageCircle className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-white">Chat en Tiempo Real</span>
            </div>
            
            <div ref={chatContainerRef} className="flex-1 overflow-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                    msg.senderId === 'ai' 
                      ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/20' 
                      : msg.senderId === user?.id 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-[#1c1c1f] text-white'
                  }`}>
                    {msg.senderId !== 'ai' && msg.senderId !== user?.id && (
                      <p className="text-xs text-zinc-500 mb-1">{msg.sender?.name}</p>
                    )}
                    {msg.senderId === 'ai' && (
                      <div className="flex items-center gap-1 text-xs text-primary-400 mb-1">
                        <Sparkles className="w-3 h-3" /> Asistente IA
                      </div>
                    )}
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {aiTyping && (
                <div className="flex justify-start">
                  <div className="bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/20 px-4 py-2 rounded-2xl">
                    <div className="flex items-center gap-1 text-xs text-primary-400">
                      <Sparkles className="w-3 h-3" /> 
                      <span className="animate-pulse">Escribiendo...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-[#27272a]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-3 bg-[#1c1c1f] border border-[#27272a] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="px-4 py-3 bg-primary-500 hover:bg-primary-400 text-white rounded-xl"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="w-80 border-l border-[#27272a] overflow-auto">
          <div className="p-4 border-b border-[#27272a]">
            <h2 className="font-semibold text-white mb-3">Información del Vehículo</h2>
            <div className="aspect-video bg-[#1c1c1f] rounded-xl mb-3 overflow-hidden">
              {vehicle?.images?.[0] ? (
                <img src={vehicle.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-12 h-12 text-zinc-700" />
                </div>
              )}
            </div>
            <p className="text-xl font-bold text-primary-400">${vehicle?.price?.toLocaleString()}</p>
            {vehicle?.aiAnalysis && (
              <div className="mt-3 p-3 bg-[#1c1c1f] rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-primary-400" />
                  <span className="text-sm text-white">Análisis IA</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Valor mercado</span>
                  <span className="text-white">${vehicle.aiAnalysis.marketValue?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Score</span>
                  <span className={vehicle.aiAnalysis.priceScore >= 80 ? 'text-green-400' : 'text-yellow-400'}>
                    {vehicle.aiAnalysis.priceScore}%
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-b border-[#27272a]">
            <h2 className="font-semibold text-white mb-3">Contraparte</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1c1c1f] flex items-center justify-center">
                <User className="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{otherUser?.name}</p>
                <p className="text-xs text-zinc-500">{otherUser?.email}</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h2 className="font-semibold text-white mb-3">Opciones</h2>
            <div className="space-y-2">
              {deal.status === 'NEGOTIATING' && (
                <>
                  <button className="w-full px-4 py-3 bg-green-500/10 text-green-400 rounded-xl flex items-center justify-center gap-2 hover:bg-green-500/20">
                    <CheckCircle className="w-4 h-4" /> Aceptar Deal
                  </button>
                  <button className="w-full px-4 py-3 bg-red-500/10 text-red-400 rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20">
                    <X className="w-4 h-4" /> Rechazar
                  </button>
                </>
              )}
              {deal.status === 'PENDING' && (
                <button className="w-full px-4 py-3 bg-accent-500/10 text-accent-400 rounded-xl flex items-center justify-center gap-2 hover:bg-accent-500/20">
                  <DollarSign className="w-4 h-4" /> Hacer Oferta
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}