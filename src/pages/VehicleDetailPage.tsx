import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { vehiclesApi, dealsApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { 
  Car, Gauge, Fuel, Settings,
  MessageCircle, User, Phone, ChevronLeft, Sparkles,
  TrendingUp, AlertTriangle, ThumbsUp
} from 'lucide-react'

export default function VehicleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.getById(id!),
    enabled: !!id,
  })

const createDealMutation = useMutation({
    mutationFn: (data: { vehicleId: string; sellerId: string }) => dealsApi.create(data),
    onSuccess: (res) => {
      toast.success('Negociación iniciada')
      navigate(`/deals/${res.data.id}`)
    },
    onError: () => {
      toast.error('Error al iniciar negociación')
    },
  })

  const handleEnterDealRoom = async () => {
    if (!vehicle?.id) return
    
    try {
      const res = await dealsApi.getAll()
      const existingDeal = res.data?.find((d: any) => d.vehicle?.id === vehicle.id)
      if (existingDeal) {
        navigate(`/deals/${existingDeal.id}`)
      } else if (user && vehicle.seller?.id) {
        const newDeal = await dealsApi.create({ 
          vehicleId: vehicle.id, 
          sellerId: vehicle.seller.id 
        })
        navigate(`/deals/${newDeal.data.id}`)
      } else {
        toast.error('Debes iniciar sesión para entrar al Deal Room')
        navigate('/login')
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        toast.error('Sesión expirada')
        navigate('/login')
      } else {
        toast.error('Error al entrar al Deal Room')
      }
    }
  }

  const vehicle = data?.data
  const transmission = vehicle?.transmission || 'AUTOMATIC'
  const isOwner = user && vehicle?.seller?.id === user.id

  const handleStartDeal = () => {
    if (!user) {
      toast.error('Debes iniciar sesión')
      navigate('/login')
      return
    }
    createDealMutation.mutate({ vehicleId: vehicle.id, sellerId: vehicle.seller.id })
  }

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse h-96 bg-[#141416] rounded-2xl" /></div>
  }

  if (!vehicle) {
    return <div className="p-8 text-center"><p className="text-zinc-500">Vehículo no encontrado</p></div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6">
        <ChevronLeft className="w-5 h-5" /> Volver
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-[#141416] rounded-2xl border border-[#27272a] overflow-hidden">
            <div className="aspect-video bg-[#1c1c1f]">
              {vehicle.images?.[0] ? (
                <img src={vehicle.images[0]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Car className="w-24 h-24 text-zinc-700" />
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white">{vehicle.year} {vehicle.make} {vehicle.model}</h1>
                  <p className="text-zinc-500 mt-1">VIN: {vehicle.vin}</p>
                </div>
                <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  vehicle.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400' :
                  vehicle.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' :
                  'bg-zinc-500/10 text-zinc-400'
                }`}>
                  {vehicle.status}
                </span>
              </div>

              <p className="text-4xl font-bold text-primary-400 mb-6">${vehicle.price?.toLocaleString()}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-[#1c1c1f] rounded-xl">
                  <Gauge className="w-5 h-5 text-zinc-500 mb-2" />
                  <p className="text-lg font-semibold text-white">{vehicle.mileage?.toLocaleString()}</p>
                  <p className="text-xs text-zinc-500">Kilometraje</p>
                </div>
                <div className="p-4 bg-[#1c1c1f] rounded-xl">
                  <Fuel className="w-5 h-5 text-zinc-500 mb-2" />
                  <p className="text-lg font-semibold text-white">{vehicle.fuelType}</p>
                  <p className="text-xs text-zinc-500">Combustible</p>
                </div>
                <div className="p-4 bg-[#1c1c1f] rounded-xl">
                  <Settings className="w-5 h-5 text-zinc-500 mb-2" />
                  <p className="text-lg font-semibold text-white">{transmission}</p>
                  <p className="text-xs text-zinc-500">Transmisión</p>
                </div>
                <div className="p-4 bg-[#1c1c1f] rounded-xl">
                  <Car className="w-5 h-5 text-zinc-500 mb-2" />
                  <p className="text-lg font-semibold text-white">{vehicle.condition}</p>
                  <p className="text-xs text-zinc-500">Condición</p>
                </div>
              </div>

              {vehicle.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Descripción</h3>
                  <p className="text-zinc-400">{vehicle.description}</p>
                </div>
              )}

              {vehicle.features?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-white mb-3">Características</h3>
                  <div className="flex flex-wrap gap-2">
                    {vehicle.features.map((feature: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-[#1c1c1f] rounded-full text-sm text-zinc-400">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {vehicle.aiAnalysis && (
            <div className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-2xl border border-primary-500/20 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary-400" />
                <h2 className="text-lg font-semibold text-white">Análisis IA</h2>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-zinc-500 mb-1">Valor de mercado estimado</p>
                <p className="text-2xl font-bold text-white">${vehicle.aiAnalysis.marketValue?.toLocaleString()}</p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-zinc-500 mb-2">Puntuación de precio</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#1c1c1f] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        vehicle.aiAnalysis.priceScore >= 80 ? 'bg-green-500' :
                        vehicle.aiAnalysis.priceScore >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${vehicle.aiAnalysis.priceScore}%` }}
                    />
                  </div>
                  <span className={`text-lg font-bold ${
                    vehicle.aiAnalysis.priceScore >= 80 ? 'text-green-400' :
                    vehicle.aiAnalysis.priceScore >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {vehicle.aiAnalysis.priceScore}%
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <p className="text-zinc-400 flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                  {vehicle.aiAnalysis.insights}
                </p>
                <p className="text-zinc-400 flex items-start gap-2">
                  <ThumbsUp className="w-4 h-4 text-accent-400 mt-0.5 flex-shrink-0" />
                  {vehicle.aiAnalysis.recommendations}
                </p>
              </div>
            </div>
          )}

          <div className="bg-[#141416] rounded-2xl border border-[#27272a] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Vendedor</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#1c1c1f] flex items-center justify-center">
                <User className="w-6 h-6 text-zinc-500" />
              </div>
              <div>
                <p className="font-medium text-white">{vehicle.seller?.name}</p>
                <p className="text-sm text-zinc-500">{vehicle.seller?.email}</p>
              </div>
            </div>
            {vehicle.seller?.phone && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Phone className="w-4 h-4" /> {vehicle.seller.phone}
              </div>
            )}
          </div>

          {vehicle.status === 'AVAILABLE' && (
            <div className="bg-[#141416] rounded-2xl border border-[#27272a] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                {isOwner ? 'Tu Vehículo' : 'Iniciar Negociación'}
              </h2>
              <p className="text-zinc-500 text-sm mb-4">
                {isOwner 
                  ? 'Entra a la Deal Room para atender a potenciales compradores.' 
                  : 'Comienza una negociación en tiempo real con videollamada y asistente de IA.'}
              </p>
              <button
                onClick={handleEnterDealRoom}
                disabled={createDealMutation.isPending || !user}
                className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-400 hover:to-accent-400 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <MessageCircle className="w-5 h-5" />
                {createDealMutation.isPending ? 'Entrando...' : 'Entrar al Deal Room'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}