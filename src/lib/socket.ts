import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class SocketService {
  private socket: Socket | null = null
  private connectionPromise: Promise<void> | null = null
  private resolveConnection: (() => void) | null = null

  connect(): Promise<void> {
    if (this.socket?.connected) return Promise.resolve()
    
    if (this.connectionPromise) return this.connectionPromise

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    })

    console.log('Socket created, id:', this.socket.id)

    this.connectionPromise = new Promise((resolve) => {
      this.resolveConnection = resolve
      this.socket?.on('connect', () => {
        console.log('Socket connected, id:', this.socket?.id)
        resolve()
      })
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
      this.connectionPromise = null
      this.resolveConnection = null
    })

    return this.connectionPromise
  }

  async ensureConnectedAndReady(): Promise<Socket | null> {
    await this.connect()
    await new Promise(resolve => setTimeout(resolve, 100))
    return this.socket
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  authenticate(userId: string) {
    this.ensureConnectedAndReady().then(socket => {
      socket?.emit('authenticate', { userId })
    })
  }

  joinRoom(roomId: string, userId: string) {
    this.ensureConnectedAndReady().then(socket => {
      socket?.emit('join-room', { roomId, userId })
    })
  }

  leaveRoom(roomId: string, userId: string) {
    this.socket?.emit('leave-room', { roomId, userId })
  }

  sendChatMessage(roomId: string, userId: string, content: string) {
    this.ensureConnectedAndReady().then(socket => {
      console.log('Sending chat-message - socket id:', socket?.id, 'roomId:', roomId)
      socket?.emit('chat-message', { roomId, userId, content })
    })
  }

  onChatMessage(callback: (message: any) => void) {
    this.socket?.on('chat-message', callback)
  }

  onUserJoined(callback: (data: any) => void) {
    this.socket?.on('user-joined', callback)
  }

  onUserLeft(callback: (data: any) => void) {
    this.socket?.on('user-left', callback)
  }

  onIncomingCall(callback: (data: any) => void) {
    this.socket?.on('incoming-call', callback)
  }

  onCallAccepted(callback: (data: any) => void) {
    this.socket?.on('call-accepted', callback)
  }

  onCallEnded(callback: () => void) {
    this.socket?.on('call-ended', callback)
  }

  callUser(roomId: string, targetUserId: string) {
    this.socket?.emit('call-user', { roomId, targetUserId })
  }

  acceptCall(roomId: string, targetSocketId: string) {
    this.socket?.emit('accept-call', { roomId, targetSocketId })
  }

  endCall(roomId: string, targetUserId: string) {
    this.socket?.emit('end-call', { roomId, targetUserId })
  }

  sendOffer(roomId: string, targetUserId: string, offer: RTCSessionDescriptionInit) {
    this.socket?.emit('webrtc-offer', { roomId, targetUserId, offer })
  }

  onOffer(callback: (data: any) => void) {
    this.socket?.on('webrtc-offer', callback)
  }

  sendAnswer(targetSocketId: string, answer: RTCSessionDescriptionInit) {
    this.socket?.emit('webrtc-answer', { targetSocketId, answer })
  }

  onAnswer(callback: (data: any) => void) {
    this.socket?.on('webrtc-answer', callback)
  }

  sendIceCandidate(roomId: string, targetUserId: string, candidate: RTCIceCandidateInit) {
    this.socket?.emit('webrtc-ice-candidate', { roomId, targetUserId, candidate })
  }

  onIceCandidate(callback: (data: any) => void) {
    this.socket?.on('webrtc-ice-candidate', callback)
  }

  sendVoiceTranscript(roomId: string, userId: string, content: string) {
    this.socket?.emit('voice-transcript', { roomId, userId, content })
  }

  onVoiceTranscript(callback: (transcript: any) => void) {
    this.socket?.on('voice-transcript', callback)
  }

  offVoiceTranscript() {
    this.socket?.off('voice-transcript')
  }

  sendVehicleTabChange(roomId: string, tab: string) {
    this.ensureConnectedAndReady().then(socket => {
      console.log('Socket sendVehicleTabChange - socket connected:', socket?.connected, 'roomId:', roomId, 'tab:', tab)
      socket?.emit('vehicle-tab-change', { roomId, tab })
    })
  }

  onVehicleTabChange(callback: (data: { tab: string }) => void) {
    this.socket?.on('vehicle-tab-change', callback)
  }

  offVehicleTabChange() {
    this.socket?.off('vehicle-tab-change')
  }


  sendVehicleImageSelectedChange(roomId: string, imageIndex: number) {
    this.ensureConnectedAndReady().then(socket => {
      console.log('Socket sendVehicleTabChange - socket connected:', socket?.connected, 'roomId:', roomId, 'imageIndex:', imageIndex)
      socket?.emit('vehicle-image-selected-change', { roomId, imageIndex })
    })
  }

  onVehicleImageSelectedChange(callback: (data: { imageIndex: number }) => void) {
    this.socket?.on('vehicle-image-selected-change', callback)
  }

  offVehicleImageSelectedChange() {
    this.socket?.off('vehicle-image-selected-change')
  }


  removeAllListeners() {
    this.socket?.removeAllListeners()
  }
}

export const socketService = new SocketService()