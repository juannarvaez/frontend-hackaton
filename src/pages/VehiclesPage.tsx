import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { vehiclesApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Car, Search, Filter, Plus, MapPin, Calendar, Gauge, Fuel } from 'lucide-react'
import { toast } from 'sonner'

export default function VehiclesPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', statusFilter],
    queryFn: () => vehiclesApi.getAll(statusFilter || undefined),
  })

  const vehicles = data?.data || []
  
  const getVehicleImages = (vehicle: any) => {
    if (!vehicle.images) return []
    if (Array.isArray(vehicle.images)) return vehicle.images
    try {
      return JSON.parse(vehicle.images)
    } catch {
      return []
    }
  }

  const filteredVehicles = vehicles.filter((v: any) =>
    search ? `${v.make} ${v.model} ${v.year}`.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehículos</h1>
          <p className="text-zinc-500 mt-1">{vehicles.length} vehículos disponibles</p>
        </div>
        <Link to="/vehicles/new" className="inline-flex items-center gap-2 px-5 py-3 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-xl transition-colors">
          <Plus className="w-5 h-5" /> Publicar
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar vehículos..."
            className="w-full pl-12 pr-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:outline-none focus:border-primary-500"
        >
          <option value="">Todos los estados</option>
          <option value="AVAILABLE">Disponibles</option>
          <option value="PENDING">Pendientes</option>
          <option value="SOLD">Vendidos</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[#141416] rounded-2xl border border-[#27272a] h-72 animate-pulse" />
          ))}
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-16">
          <Car className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg">No se encontraron vehículos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle: any) => (
            <Link
              key={vehicle.id}
              to={`/vehicles/${vehicle.id}`}
              className="bg-[#141416] rounded-2xl border border-[#27272a] overflow-hidden hover:border-zinc-600 transition-all group"
            >
              <div className="aspect-video bg-[#1c1c1f] relative overflow-hidden">
                {getVehicleImages(vehicle)[0] ? (
                  <img src={getVehicleImages(vehicle)[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Car className="w-16 h-16 text-zinc-700" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    vehicle.status === 'AVAILABLE' ? 'bg-green-500/90 text-white' :
                    vehicle.status === 'PENDING' ? 'bg-yellow-500/90 text-white' :
                    'bg-zinc-500/90 text-white'
                  }`}>
                    {vehicle.status}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-white mb-1">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                <p className="text-2xl font-bold text-primary-400">${vehicle.price?.toLocaleString()}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-zinc-500">
                  <span className="flex items-center gap-1"><Gauge className="w-4 h-4" /> {vehicle.mileage?.toLocaleString()} km</span>
                  <span className="flex items-center gap-1"><Fuel className="w-4 h-4" /> {vehicle.fuelType}</span>
                </div>
                {vehicle.aiAnalysis && (
                  <div className="mt-4 pt-4 border-t border-[#27272a]">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">Análisis IA</span>
                      <span className={`text-sm font-medium ${
                        vehicle.aiAnalysis.priceScore >= 80 ? 'text-green-400' :
                        vehicle.aiAnalysis.priceScore >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {vehicle.aiAnalysis.priceScore}% precio justo
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}