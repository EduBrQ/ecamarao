import { useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastProps {
  messages: ToastMessage[]
  onRemove: (id: string) => void
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

function Toast({ messages, onRemove }: ToastProps) {
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.duration !== 0) {
        const timer = setTimeout(() => onRemove(msg.id), msg.duration || 5000)
        return () => clearTimeout(timer)
      }
    })
  }, [messages, onRemove])

  if (messages.length === 0) return null

  return (
    <div className="toast-container">
      {messages.map((msg) => {
        const Icon = ICONS[msg.type]
        return (
          <div key={msg.id} className={`toast toast-${msg.type}`}>
            <div className="toast-header">
              <Icon size={18} className={`toast-icon ${msg.type}`} />
              <span className="toast-title">{msg.title}</span>
              <button className="icon-btn" onClick={() => onRemove(msg.id)} aria-label="Fechar">
                <X size={16} />
              </button>
            </div>
            {msg.message && <div className="toast-message">{msg.message}</div>}
          </div>
        )
      })}
    </div>
  )
}

export default Toast
