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
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const { data: dealData, isLoading } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => dealsApi.getById(id!),
    enabled: !!id,
  })

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => roomsApi.sendMessage(deal?.room?.id!, { content }),
  })

  const deal = dealData?.data
  const isSeller = user && deal?.seller?.id === user.id
  const otherUser = isSeller ? deal?.buyer : deal?.seller
  const vehicle = deal?.vehicle

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

    return () => {
      socketService.leaveRoom(deal.room.id, user.id)
      socketService.removeAllListeners()
    }
  }, [deal?.room?.id, user?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const startCall = async () => {
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
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = e.streams[0]
        }
      }

      peerConnectionRef.current = pc

      socketService.callUser(deal.room.id, otherUser.id)
      
      setIsInCall(true)

      socketService.onCallAccepted(() => {
        toast.success('Llamada aceptada')
      })

    } catch (err) {
      toast.error('Error al iniciar video')
    }
  }

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    peerConnectionRef.current?.close()
    if (otherUser?.id) {
      socketService.endCall(deal.room.id, otherUser.id)
    }
    setIsInCall(false)
  }

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
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden border-2 border-zinc-700">
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
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