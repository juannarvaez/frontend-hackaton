import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { 
  LayoutDashboard, 
  Car, 
  LogOut, 
  MessageCircle,
  Users,
  Plus,
  Video
} from 'lucide-react'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vehicles', label: 'Vehículos', icon: Car },
    { path: '/rooms', label: 'Rooms', icon: Video },
  ]

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-[#0a0a0b]">
      <aside className="w-64 border-r border-[#27272a] flex flex-col">
        <div className="p-6 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Deal Room</h1>
              <p className="text-xs text-zinc-500">AI-Assisted</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.path)
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-zinc-400 hover:text-white hover:bg-[#1c1c1f]'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          <div className="pt-4 mt-4 border-t border-[#27272a]">
            <Link
              to="/vehicles/new"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-[#1c1c1f] transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Publicar Vehículo</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-[#27272a]">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-[#1c1c1f] flex items-center justify-center">
              <Users className="w-5 h-5 text-zinc-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}