import { useState, useEffect } from 'react'

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

function Toast({ messages, onRemove }: ToastProps) {
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.duration !== 0) {
        const timer = setTimeout(() => {
          onRemove(msg.id)
        }, msg.duration || 5000)
        return () => clearTimeout(timer)
      }
    })
  }, [messages, onRemove])

  if (messages.length === 0) return null

  return (
    <div className="toast-container">
      {messages.map(msg => (
        <div key={msg.id} className={`toast toast-${msg.type}`}>
          <div className="toast-content">
            <div className="toast-header">
              <span className="toast-icon">
                {msg.type === 'success' && '✅'}
                {msg.type === 'error' && '❌'}
                {msg.type === 'warning' && '⚠️'}
                {msg.type === 'info' && 'ℹ️'}
              </span>
              <span className="toast-title">{msg.title}</span>
              <button 
                className="toast-close" 
                onClick={() => onRemove(msg.id)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            {msg.message && (
              <div className="toast-message">{msg.message}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// Hook para gerenciar toasts
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const addMessage = (message: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString()
    setMessages(prev => [...prev, { ...message, id }])
    return id
  }

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id))
  }

  const success = (title: string, message?: string, duration?: number) => {
    return addMessage({ type: 'success', title, message, duration })
  }

  const error = (title: string, message?: string, duration?: number) => {
    return addMessage({ type: 'error', title, message, duration })
  }

  const warning = (title: string, message?: string, duration?: number) => {
    return addMessage({ type: 'warning', title, message, duration })
  }

  const info = (title: string, message?: string, duration?: number) => {
    return addMessage({ type: 'info', title, message, duration })
  }

  const clear = () => {
    setMessages([])
  }

  return {
    messages,
    addMessage,
    removeMessage,
    success,
    error,
    warning,
    info,
    clear
  }
}

export default Toast
