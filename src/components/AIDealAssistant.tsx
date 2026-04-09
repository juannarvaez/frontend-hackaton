import { useState, useEffect, useMemo, useRef } from 'react'
import { Sparkles, Lightbulb, RefreshCw, ChevronRight, Car, History, FileText, MessageCircle, Zap } from 'lucide-react'

interface Recommendation {
  id: string
  text: string
  category: 'vehicle' | 'history' | 'negotiation' | 'documentation'
  priority: 'high' | 'medium' | 'low'
  triggeredBy?: string[]
}

interface Message {
  id: string
  content: string
  senderId: string
  sender?: { id: string; name: string }
  createdAt: string | Date
}

interface TranscriptMessage {
  id: string
  text: string
  senderName: string
}

interface AIDealAssistantProps {
  chatMessages?: Message[]
  transcripts?: TranscriptMessage[]
  isInCall?: boolean
}

const defaultRecommendations: Recommendation[] = [
  { id: '1', text: '¿Cuál es el VIN del vehículo?', category: 'vehicle', priority: 'high', triggeredBy: ['vin', 'número', 'serie'] },
  { id: '2', text: '¿El vehículo ha tenido algún accidente o choque?', category: 'history', priority: 'high', triggeredBy: ['accidente', 'choque', 'golpe', 'accident'] },
  { id: '3', text: '¿El vehículo tiene servicio completo?', category: 'documentation', priority: 'high', triggeredBy: ['servicio', 'mantenimiento', 'service'] },
  { id: '4', text: '¿Hay algún daño estructural o reparación?', category: 'history', priority: 'high', triggeredBy: ['daño', 'estructural', 'reparación', 'chasis'] },
  { id: '5', text: '¿Los neumáticos tienen mucho desgaste?', category: 'vehicle', priority: 'medium', triggeredBy: ['neumático', 'llanta', 'tire', 'goma'] },
  { id: '6', text: '¿Cuándo fue la última revisión técnica?', category: 'documentation', priority: 'medium', triggeredBy: ['revisión', 'revisado', 'review', 'técnica'] },
  { id: '7', text: '¿El precio es negociable?', category: 'negotiation', priority: 'medium', triggeredBy: ['precio', 'negociar', 'descuento'] },
  { id: '8', text: '¿Incluye garantía del fabricante?', category: 'negotiation', priority: 'medium', triggeredBy: ['garantía', 'warranty', 'cobertura'] },
  { id: '9', text: '¿Puedo hacer una prueba de manejo?', category: 'vehicle', priority: 'low', triggeredBy: ['prueba', 'probar', 'manejar', 'test drive'] },
  { id: '10', text: '¿Por qué vende el vehículo?', category: 'history', priority: 'low', triggeredBy: ['vende', 'razón', 'why'] },
  { id: '11', text: '¿Las luces y sistemas eléctricos funcionan?', category: 'vehicle', priority: 'medium', triggeredBy: ['luz', 'eléctrico', 'faro', 'luces'] },
  { id: '12', text: '¿El aire acondicionado funciona bien?', category: 'vehicle', priority: 'medium', triggeredBy: ['aire', 'ac', 'clima', 'refrigeración'] },
  { id: '13', text: '¿Cuántos dueño ha tenido?', category: 'history', priority: 'medium', triggeredBy: ['dueño', 'dueños', 'propietario', 'owner'] },
  { id: '14', text: '¿El título está limpio?', category: 'documentation', priority: 'high', triggeredBy: ['título', 'documento', 'papeles'] },
  { id: '15', text: '¿Aceptan Trade-in o parte de pago?', category: 'negotiation', priority: 'low', triggeredBy: ['trade', 'intercambio', 'parte'] },
]

export default function AIDealAssistant({ 
  chatMessages = [], 
  transcripts = [],
  isInCall = false 
}: AIDealAssistantProps) {
  const [activeRecommendations, setActiveRecommendations] = useState<Recommendation[]>([])
  const [recentlyTriggered, setRecentlyTriggered] = useState<string[]>([])
  const [conversationPhase, setConversationPhase] = useState<'greeting' | 'vehicle_info' | 'history' | 'negotiation' | 'closing'>('greeting')
  const triggeredRef = useRef<string[]>([])

  const allMessages = useMemo(() => {
    return [...chatMessages, ...transcripts]
  }, [chatMessages, transcripts])

  const allText = useMemo(() => {
    return allMessages.map(m => 'content' in m ? m.content : m.text).join(' ').toLowerCase()
  }, [allMessages])

  useEffect(() => {
    const text = allText
    if (text.length < 20) {
      setConversationPhase('greeting')
    } else if (text.includes('precio') || text.includes('oferta') || text.includes('negociar')) {
      setConversationPhase('negotiation')
    } else if (text.includes('accidente') || text.includes('historial') || text.includes('dueño')) {
      setConversationPhase('history')
    } else if (text.includes('vehículo') || text.includes('modelo') || text.includes('año')) {
      setConversationPhase('vehicle_info')
    } else {
      setConversationPhase('vehicle_info')
    }
  }, [allText])

  useEffect(() => {
    const newTriggered: string[] = []
    
    defaultRecommendations.forEach(rec => {
      if (rec.triggeredBy?.some(keyword => allText.includes(keyword))) {
        newTriggered.push(rec.id)
      }
    })
    
    const allTriggered = [...new Set([...triggeredRef.current, ...newTriggered])]
    triggeredRef.current = allTriggered
    setRecentlyTriggered(allTriggered)

    const newRecommendations = defaultRecommendations
      .filter(rec => !allTriggered.includes(rec.id))
      .sort((a, b) => {
        const phaseOrder: Record<string, string[]> = {
          greeting: ['13', '9', '10'],
          vehicle_info: ['1', '11', '12', '5', '6'],
          history: ['2', '4', '3', '14'],
          negotiation: ['7', '8', '15'],
          closing: ['7', '8']
        }
        const aIndex = phaseOrder[conversationPhase]?.indexOf(a.id) ?? 999
        const bIndex = phaseOrder[conversationPhase]?.indexOf(b.id) ?? 999
        if (aIndex !== 999 && bIndex !== 999) return aIndex - bIndex
        return 0
      })
      .slice(0, 3)
    
    setActiveRecommendations(newRecommendations)
  }, [allText, conversationPhase])

  const handleSuggestionClick = (suggestion: string) => {
    const rec = defaultRecommendations.find(r => r.text === suggestion)
    if (rec && !recentlyTriggered.includes(rec.id)) {
      const newTriggered = [...triggeredRef.current, rec.id]
      triggeredRef.current = newTriggered
      setRecentlyTriggered(newTriggered)
      
      const remaining = defaultRecommendations
        .filter(r => !newTriggered.includes(r.id))
        .sort((a, b) => {
          const phaseOrder: Record<string, string[]> = {
            greeting: ['13', '9', '10'],
            vehicle_info: ['1', '11', '12', '5', '6'],
            history: ['2', '4', '3', '14'],
            negotiation: ['7', '8', '15'],
            closing: ['7', '8']
          }
          const aIndex = phaseOrder[conversationPhase]?.indexOf(a.id) ?? 999
          const bIndex = phaseOrder[conversationPhase]?.indexOf(b.id) ?? 999
          if (aIndex !== 999 && bIndex !== 999) return aIndex - bIndex
          return 0
        })
        .slice(0, 3)
      
      setActiveRecommendations(remaining)
    }
  }

  const getCategoryIcon = (category: Recommendation['category']) => {
    switch (category) {
      case 'vehicle': return <Car className="w-3 h-3" />
      case 'history': return <History className="w-3 h-3" />
      case 'negotiation': return <FileText className="w-3 h-3" />
      case 'documentation': return <FileText className="w-3 h-3" />
    }
  }

  const getPhaseLabel = () => {
    switch (conversationPhase) {
      case 'greeting': return 'Iniciando'
      case 'vehicle_info': return 'Info Vehículo'
      case 'history': return 'Historial'
      case 'negotiation': return 'Negociando'
      case 'closing': return 'Cierre'
    }
  }

  return (
    <div className="relative">
      <style>{`
        @keyframes neonGlow {
          0%, 100% { 
            box-shadow: 
              0 0 5px #a855f7,
              0 0 10px #a855f7,
              0 0 20px #a855f7,
              0 0 40px #ec4899;
          }
          25% { 
            box-shadow: 
              0 0 5px #3b82f6,
              0 0 10px #3b82f6,
              0 0 20px #3b82f6,
              0 0 40px #8b5cf6;
          }
          50% { 
            box-shadow: 
              0 0 5px #ec4899,
              0 0 10px #ec4899,
              0 0 20px #ec4899,
              0 0 40px #d946ef;
          }
          75% { 
            box-shadow: 
              0 0 5px #06b6d4,
              0 0 10px #06b6d4,
              0 0 20px #06b6d4,
              0 0 40px #8b5cf6;
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 10px rgba(168, 85, 247, 0.5); }
          50% { text-shadow: 0 0 20px rgba(236, 72, 153, 0.8), 0 0 30px rgba(139, 92, 246, 0.6); }
        }
        
        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .ai-glow-border {
          position: relative;
          background: linear-gradient(90deg, #a855f7, #ec4899, #3b82f6, #8b5cf6, #d946ef);
          background-size: 300% 100%;
          animation: borderFlow 4s ease infinite;
          padding: 1px;
          border-radius: 12px;
        }
        
        .ai-glow-inner {
          background: #0a0a0b;
          border-radius: 11px;
          padding: 12px;
        }
        
        .neon-text {
          animation: textGlow 3s ease-in-out infinite;
        }
        
        .ai-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="ai-glow-border">
        <div className="ai-glow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Sparkles className="w-5 h-5 text-purple-400 neon-text" />
                <div className="absolute inset-0 w-5 h-5 bg-purple-400 blur-lg opacity-50" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent neon-text">
                Asistente IA
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isInCall && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full ai-pulse">
                  En llamada
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-cyan-400">
                <Zap className="w-3 h-3" />
                <span>{getPhaseLabel()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <MessageCircle className="w-3 h-3 text-purple-400" />
              <span className="text-purple-300/70"> Sugerencias en tiempo real</span>
            </div>

            <div className="space-y-1.5">
              {activeRecommendations.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => handleSuggestionClick(rec.text)}
                  className="w-full text-left p-3 bg-gradient-to-r from-purple-900/20 via-pink-900/20 to-cyan-900/20 hover:from-purple-500/30 hover:via-pink-500/30 hover:to-cyan-500/30 border border-purple-500/20 hover:border-pink-500/40 rounded-lg transition-all duration-300 group"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex-shrink-0 ${
                      rec.priority === 'high' ? 'text-red-400' : 
                      rec.priority === 'medium' ? 'text-yellow-400' : 'text-zinc-500'
                    }`}>
                      {getCategoryIcon(rec.category)}
                    </span>
                    <p className="text-sm text-zinc-200 group-hover:text-white transition-colors leading-tight">
                      {rec.text}
                    </p>
                  </div>
                </button>
              ))}

              {activeRecommendations.length === 0 && (
                <div className="text-center py-4 text-zinc-500 text-sm">
                  <Sparkles className="w-5 h-5 mx-auto mb-2 text-purple-400" />
                  <p>¡Excelente! Has cubierto los puntos importantes.</p>
                </div>
              )}
            </div>
          </div>

          {recentlyTriggered.length > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-500/20">
              <div className="text-xs text-zinc-500 mb-2">Temas cubiertos</div>
              <div className="flex flex-wrap gap-1.5">
                {recentlyTriggered.slice(0, 6).map(id => {
                  const rec = defaultRecommendations.find(r => r.id === id)
                  return rec ? (
                    <span 
                      key={id} 
                      className="px-2 py-1 text-[10px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 rounded-full border border-purple-500/30"
                    >
                      ✓ {rec.text.split('?')[0]}
                    </span>
                  ) : null
                })}
              </div>
            </div>
          )}

          {transcripts.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-cyan-400">
              <div className="w-2 h-2 bg-cyan-400 rounded-full ai-pulse" />
              <span>Transcribiendo voz en tiempo real...</span>
              <span className="text-zinc-600">({transcripts.length})</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}