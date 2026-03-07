import { useState, useEffect, createContext, useContext } from 'react'

interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

const ToastContext = createContext<{
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  messages: ToastMessage[]
  removeMessage: (id: string) => void
} | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
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

  // Auto-remove messages
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.duration !== 0) {
        const timer = setTimeout(() => {
          removeMessage(msg.id)
        }, msg.duration || 5000)
        return () => clearTimeout(timer)
      }
    })
  }, [messages])

  const value = {
    success,
    error,
    warning,
    info,
    messages,
    removeMessage
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToastGlobal() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastGlobal must be used within a ToastProvider')
  }
  return context
}
