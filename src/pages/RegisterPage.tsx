import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { Car, Mail, Lock, User, ArrowRight } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register(email, password, name)
      toast.success('Cuenta creada exitosamente')
      navigate('/dashboard')
    } catch {
      toast.error('Error al crear la cuenta')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-900/20 via-[#0a0a0b] to-[#0a0a0b]" />
      
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-500 to-primary-500 mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Crear Cuenta</h1>
          <p className="text-zinc-500 mt-2">Únete a Deal Room</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Nombre</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#141416] border border-[#27272a] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-accent-500 transition-colors"
                placeholder="Tu nombre completo"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#141416] border border-[#27272a] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-accent-500 transition-colors"
                placeholder="tu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-[#141416] border border-[#27272a] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-accent-500 transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-400 hover:to-accent-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              'Creando cuenta...'
            ) : (
              <>
                Crear Cuenta
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-zinc-500 mt-8">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-accent-400 hover:text-accent-300">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}