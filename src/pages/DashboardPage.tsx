import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { dealsApi, vehiclesApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Car, DollarSign, TrendingUp, Clock, ArrowRight, Plus } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuthStore()
  
  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => vehiclesApi.getAll(),
  })

  const { data: deals } = useQuery({
    queryKey: ['deals'],
    queryFn: () => dealsApi.getAll(),
  })

  const myVehicles = vehicles?.data?.filter((v: any) => v.seller?.id === user?.id) || []
  const activeDeals = deals?.data?.filter((d: any) => d.status === 'PENDING' || d.status === 'NEGOTIATING') || []
  const completedDeals = deals?.data?.filter((d: any) => d.status === 'ACCEPTED') || []

  const stats = [
    { label: 'Mis Vehículos', value: myVehicles.length, icon: Car, color: 'text-primary-400' },
    { label: 'Negociaciones Activas', value: activeDeals.length, icon: TrendingUp, color: 'text-accent-400' },
    { label: 'Ventas Completadas', value: completedDeals.length, icon: DollarSign, color: 'text-green-400' },
    { label: 'En Espera', value: deals?.data?.filter((d: any) => d.status === 'PENDING').length || 0, icon: Clock, color: 'text-yellow-400' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Bienvenido de nuevo, {user?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 bg-[#141416] rounded-2xl border border-[#27272a]">
            <div className={`w-12 h-12 rounded-xl bg-[#1c1c1f] flex items-center justify-center mb-4 ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-zinc-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#141416] rounded-2xl border border-[#27272a] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Mis Vehículos</h2>
            <Link to="/vehicles" className="text-primary-400 text-sm hover:text-primary-300 flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {myVehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No tienes vehículos publicados</p>
              <Link to="/vehicles/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg hover:bg-primary-500/20 transition-colors">
                <Plus className="w-4 h-4" /> Publicar Vehículo
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myVehicles.slice(0, 3).map((vehicle: any) => (
                <Link key={vehicle.id} to={`/vehicles/${vehicle.id}`} className="flex items-center gap-4 p-4 bg-[#1c1c1f] rounded-xl hover:bg-[#27272a] transition-colors">
                  <div className="w-16 h-16 rounded-lg bg-zinc-800 overflow-hidden">
                    {vehicle.images?.[0] ? (
                      <img src={vehicle.images[0]} alt={vehicle.model} className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-full h-full p-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                    <p className="text-sm text-zinc-500">${vehicle.price?.toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    vehicle.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400' :
                    vehicle.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {vehicle.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#141416] rounded-2xl border border-[#27272a] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Negociaciones</h2>
          </div>
          
          {activeDeals.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">No hay negociaciones activas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeDeals.slice(0, 3).map((deal: any) => (
                <Link key={deal.id} to={`/deals/${deal.id}`} className="flex items-center gap-4 p-4 bg-[#1c1c1f] rounded-xl hover:bg-[#27272a] transition-colors">
                  <div className="w-16 h-16 rounded-lg bg-zinc-800 overflow-hidden">
                    {deal.vehicle?.images?.[0] ? (
                      <img src={deal.vehicle.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Car className="w-full h-full p-4 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{deal.vehicle?.year} {deal.vehicle?.make} {deal.vehicle?.model}</p>
                    <p className="text-sm text-zinc-500">
                      {deal.buyer?.id === user?.id ? `Vendedor: ${deal.seller?.name}` : `Comprador: ${deal.buyer?.name}`}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    deal.status === 'NEGOTIATING' ? 'bg-accent-500/10 text-accent-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {deal.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}