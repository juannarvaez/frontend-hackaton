import VoiceTranscription from '@/components/VoiceTranscription'
import { useAuthStore } from '@/store/auth'

export default function VoiceTranscriptionPage() {
  const { user } = useAuthStore()
  
  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Voice Transcription</h1>
      <div className="h-[600px]">
        <VoiceTranscription
          isInCall={true}
          localStream={null}
          remoteStream={null}
          currentUserId={user?.id || ''}
          otherUserName="Usuario"
        />
      </div>
    </div>
  )
}