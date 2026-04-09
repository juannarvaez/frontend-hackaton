import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { vehiclesApi } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from 'lucide-react'

export default function CreateVehiclePage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
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

  const [images, setImages] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)

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
      images: JSON.stringify(images),
      year: parseInt(form.year),
      price: parseFloat(form.price),
      mileage: parseInt(form.mileage),
    })
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const newImages: string[] = []
    const remainingSlots = 10 - images.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    
    filesToProcess.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          if (result) {
            setImages(prev => [...prev, result])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
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
        <div>
          <label className="block text-sm text-zinc-400 mb-2">Imágenes del vehículo</label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-primary-500 bg-primary-500/10' 
                : 'border-[#27272a] hover:border-zinc-600'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-primary-400' : 'text-zinc-500'}`} />
            <p className="text-sm text-zinc-400">
              Arrastra imágenes aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Máximo 10 imágenes ({images.length}/10)
            </p>
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {images.map((img, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-[#141416]">
                  <img 
                    src={img} 
                    alt={`Imagen ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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