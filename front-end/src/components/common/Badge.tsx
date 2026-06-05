import { 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Shield,
  Wifi,
  WifiOff,
  Loader2,
  type LucideIcon 
} from 'lucide-react'

interface BadgeProps {
  tone?: 'info' | 'warning' | 'success' | 'ok' | 'danger' | 'neutral' | 'primary'
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md'
}

const toneConfig: Record<string, { bg: string; text: string; icon: LucideIcon; border: string }> = {
  info:    { bg: 'bg-info-100',    text: 'text-info-800',    icon: Info,         border: 'border-info-200' },
  warning: { bg: 'bg-amber-100',   text: 'text-amber-800',   icon: AlertTriangle, border: 'border-amber-200' },
  success: { bg: 'bg-uride-100',   text: 'text-uride-800',   icon: CheckCircle2,  border: 'border-uride-200' },
  ok:      { bg: 'bg-uride-100',   text: 'text-uride-800',   icon: Wifi,          border: 'border-uride-200' },
  danger:  { bg: 'bg-red-100',     text: 'text-red-800',     icon: WifiOff,       border: 'border-red-200' },
  neutral: { bg: 'bg-night-100',   text: 'text-night-700',   icon: Clock,         border: 'border-night-200' },
  primary: { bg: 'bg-uride-100',   text: 'text-uride-800',   icon: Shield,        border: 'border-uride-200' },
}

const sizeConfig = {
  sm: 'px-2.5 py-0.5 text-[10px]',
  md: 'px-3 py-1 text-xs',
}

export function Badge({ tone = 'neutral', children, className = '', size = 'md' }: BadgeProps) {
  const config = toneConfig[tone] ?? toneConfig.neutral
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeConfig[size]} ${config.bg} ${config.text} ${config.border} border font-bold uppercase tracking-wider rounded-full ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {children}
    </span>
  )
}

// Spinner badge for loading states
export function LoadingBadge({ children, className = '', size = 'md' }: { children: React.ReactNode; className?: string; size?: 'sm' | 'md' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeConfig[size]} bg-night-100 text-night-600 border border-night-200 font-bold uppercase tracking-wider rounded-full ${className}`}>
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      {children}
    </span>
  )
}