import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { vehiclesApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { Car, ArrowLeft, Save } from 'lucide-react'

export default function CreateVehiclePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [form, setForm] = useState({
    vin: '',
    make: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    color: '',
    fuelType: 'GASOLINE',
    transmission: 'AUTOMATIC',
    condition: 'GOOD',
    description: '',
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => vehiclesApi.create({ ...data, sellerId: user?.id }),
    onSuccess: () => {
      toast.success('Vehículo publicado')
      navigate('/vehicles')
    },
    onError: () => {
      toast.error('Error al publicar vehículo')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate({
      ...form,
      year: parseInt(form.year),
      price: parseFloat(form.price),
      mileage: parseInt(form.mileage),
    })
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-zinc-500 hover:text-white mb-6"
      >
        <ArrowLeft className="w-5 h-5" /> Volver
      </button>

      <h1 className="text-2xl font-bold text-white mb-6">Publicar Vehículo</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Marca *</label>
            <input
              type="text"
              required
              value={form.make}
              onChange={(e) => setForm({ ...form, make: e.target.value })}
              className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none"
              placeholder="Toyota"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Modelo *</label>
            <input
              type="text"
              required
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none"
              placeholder="Corolla"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Año *</label>
            <input
              type="number"
              required
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none"
              placeholder="2024"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Precio ($) *</label>
            <input
              type="number"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none"
              placeholder="25000"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Kilometraje *</label>
            <input
              type="number"
              required
              value={form.mileage}
              onChange={(e) => setForm({ ...form, mileage: e.target.value })}
              className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">VIN *</label>
            <input
              type="text"
              required
              value={form.vin}
              onChange={(e) => setForm({ ...form, vin: e.target.value })}
              className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none"
              placeholder="1HGBH41JXMN"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Color</label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none"
              placeholder="Negro"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Combustible</label>
            <select
              value={form.fuelType}
              onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
              className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="GASOLINE">Gasolina</option>
              <option value="DIESEL">Diésel</option>
              <option value="ELECTRIC">Eléctrico</option>
              <option value="HYBRID">Híbrido</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Transmisión</label>
            <select
              value={form.transmission}
              onChange={(e) => setForm({ ...form, transmission: e.target.value })}
              className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="AUTOMATIC">Automática</option>
              <option value="MANUAL">Manual</option>
              <option value="CVT">CVT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-2">Condición</label>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="EXCELLENT">Excelente</option>
              <option value="GOOD">Buena</option>
              <option value="FAIR">Regular</option>
              <option value="POOR">Mala</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-zinc-400 mb-2">Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 bg-[#141416] border border-[#27272a] rounded-xl text-white focus:border-primary-500 focus:outline-none resize-none"
            placeholder="Descripción del vehículo..."
          />
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {createMutation.isPending ? 'Publicando...' : 'Publicar Vehículo'}
        </button>
      </form>
    </div>
  )
}