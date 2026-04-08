import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

export const vehiclesApi = {
  getAll: (status?: string) => api.get(`/vehicles${status ? `?status=${status}` : ''}`),
  getById: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
}

export const dealsApi = {
  getAll: () => api.get('/deals'),
  getById: (id: string) => api.get(`/deals/${id}`),
  getById: (id: string) => api.get(`/deals/${id}`),
  create: (data: { vehicleId: string; sellerId: string }) => api.post('/deals', data),
  updateStatus: (id: string, data: { status: string; offeredPrice?: number }) =>
    api.put(`/deals/${id}/status`, data),
  addMessage: (id: string, data: { content: string; type?: string }) =>
    api.post(`/deals/${id}/messages`, data),
}

export const roomsApi = {
  join: (id: string) => api.post(`/rooms/${id}/join`),
  leave: (id: string) => api.delete(`/rooms/${id}/leave`),
  getMessages: (id: string) => api.get(`/rooms/${id}/messages`),
  sendMessage: (id: string, data: { content: string; type?: string }) =>
    api.post(`/rooms/${id}/messages`, data),
  getParticipants: (id: string) => api.get(`/rooms/${id}/participants`),
}