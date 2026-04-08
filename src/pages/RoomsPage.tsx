import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { dealsApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Video, Users, Calendar, ArrowRight, Car } from 'lucide-react'

export default function RoomsPage() {
  const { user } = useAuthStore()
  
  const { data, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => dealsApi.getAll(),
  })

  const deals = data?.data || []
  
  const rooms = deals
    .filter((deal: any) => deal.room?.id)
    .map((deal: any) => ({
      id: deal.room.id,
      dealId: deal.id,
      vehicle: deal.vehicle,
      otherUser: deal.buyer?.id === user?.id ? deal.seller : deal.buyer,
      status: deal.status,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    }))

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#141416] rounded-2xl border border-[#27272a] h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Mis Rooms</h1>
        <p className="text-zinc-500 mt-1">{rooms.length} videollamadas realizadas</p>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16">
          <Video className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-lg mb-2">No hay rooms todavía</p>
          <p className="text-zinc-600 text-sm">
            Inicia una negociación desde algún vehículo para crear un room
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map((room: any) => (
            <Link
              key={room.id}
              to={`/deals/${room.dealId}`}
              className="flex items-center gap-4 p-4 bg-[#141416] rounded-2xl border border-[#27272a] hover:border-primary-500 transition-all group"
            >
              <div className="w-14 h-14 rounded-xl bg-[#1c1c1f] flex items-center justify-center">
                <Video className="w-6 h-6 text-primary-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">
                  {room.vehicle?.year} {room.vehicle?.make} {room.vehicle?.model}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {room.otherUser?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(room.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  room.status === 'ACCEPTED' ? 'bg-green-500/10 text-green-400' :
                  room.status === 'NEGOTIATING' ? 'bg-accent-500/10 text-accent-400' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {room.status}
                </span>
                <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}