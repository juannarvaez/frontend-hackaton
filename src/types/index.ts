export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'DEALER' | 'ADMIN'
  phone?: string
  createdAt: string
}

export interface Vehicle {
  id: string
  vin: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  color: string
  fuelType: 'GASOLINE' | 'DIESEL' | 'ELECTRIC' | 'HYBRID'
  transmission: 'MANUAL' | 'AUTOMATIC' | 'CVT'
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR'
  description?: string
  images: string[]
  features: string[]
  status: 'AVAILABLE' | 'PENDING' | 'SOLD'
  seller: Pick<User, 'id' | 'name' | 'email'>
  aiAnalysis?: AIAnalysis
  createdAt: string
  updatedAt: string
}

export interface AIAnalysis {
  id: string
  marketValue: number
  priceScore: number
  recommendations: string
  insights: string
  createdAt: string
}

export interface Deal {
  id: string
  status: 'PENDING' | 'NEGOTIATING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  offeredPrice?: number
  finalPrice?: number
  notes?: string
  buyer: Pick<User, 'id' | 'name' | 'email'>
  seller: Pick<User, 'id' | 'name' | 'email'>
  vehicle: Vehicle
  room?: Room
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface Room {
  id: string
  name: string
  type: 'DEAL' | 'GENERAL'
  status: 'WAITING' | 'ACTIVE' | 'ENDED'
  dealId: string
  participants: RoomParticipant[]
  createdAt: string
}

export interface RoomParticipant {
  id: string
  userId: string
  user: Pick<User, 'id' | 'name' | 'email'>
  joinedAt: string
  isHost: boolean
}

export interface Message {
  id: string
  content: string
  type?: 'TEXT' | 'OFFER' | 'ACCEPT' | 'REJECT'
  senderId: string
  sender: Pick<User, 'id' | 'name'>
  createdAt: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}