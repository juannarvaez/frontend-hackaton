import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class SocketService {
  private socket: Socket | null = null

  connect() {
    if (this.socket?.connected) return

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    })

    this.socket.on('connect', () => {
      console.log('Socket connected')
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }

  authenticate(userId: string) {
    this.socket?.emit('authenticate', { userId })
  }

  joinRoom(roomId: string, userId: string) {
    this.socket?.emit('join-room', { roomId, userId })
  }

  leaveRoom(roomId: string, userId: string) {
    this.socket?.emit('leave-room', { roomId, userId })
  }

  sendChatMessage(roomId: string, userId: string, content: string) {
    this.socket?.emit('chat-message', { roomId, userId, content })
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

  removeAllListeners() {
    this.socket?.removeAllListeners()
  }
}

export const socketService = new SocketService()