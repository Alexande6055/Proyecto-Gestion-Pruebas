import { useState } from 'react'
import { Star, X, MessageSquare } from 'lucide-react'

interface RatingModalProps {
  open: boolean
  title: string
  subtitle?: string
  confirmLabel?: string
  loading?: boolean
  onClose: () => void
  onConfirm: (score: number, comment: string) => void
}

export function RatingModal({
  open,
  title,
  subtitle,
  confirmLabel = 'Enviar Calificación',
  loading = false,
  onClose,
  onConfirm,
}: RatingModalProps) {
  const [score, setScore] = useState(5)
  const [comment, setComment] = useState('')
  const [hover, setHover] = useState(0)

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(score, comment)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-night-900/60 backdrop-blur-md">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="relative p-6 text-center border-b border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
          </div>
          
          <h2 className="text-xl font-extrabold text-gray-900 leading-tight">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>

        {/* Body */}
        <div className="p-8 space-y-8">
          {/* Star Selection */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setScore(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="group focus:outline-none transition-transform active:scale-90"
                >
                  <Star
                    className={`w-10 h-10 transition-all duration-200 ${
                      star <= (hover || score)
                        ? 'text-amber-400 fill-amber-400 scale-110'
                        : 'text-gray-200 fill-transparent'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">
              {score === 1 && 'Pésimo'}
              {score === 2 && 'Regular'}
              {score === 3 && 'Bueno'}
              {score === 4 && 'Muy Bueno'}
              {score === 5 && '¡Excelente!'}
            </span>
          </div>

          {/* Comment Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5 px-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Tu comentario (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué tal fue el viaje?"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 focus:bg-white transition-all outline-none resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
          >
            Ahora no
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-[2] bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
)

export default RatingModal
