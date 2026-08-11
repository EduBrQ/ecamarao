import { useToast } from '@edubrq/design-system'

export function useToastGlobal() {
  const notify = useToast()

  const success = (title: string, message?: string, duration?: number) =>
    notify({ title, description: message, tone: 'success', duration })

  const error = (title: string, message?: string, duration?: number) =>
    notify({ title, description: message, tone: 'danger', duration })

  const warning = (title: string, message?: string, duration?: number) =>
    notify({ title, description: message, tone: 'warning', duration })

  const info = (title: string, message?: string, duration?: number) =>
    notify({ title, description: message, tone: 'accent', duration })

  return { success, error, warning, info }
}
