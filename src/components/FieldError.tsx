interface FieldErrorProps {
  show: boolean
  message: string
}

function FieldError({ show, message }: FieldErrorProps) {
  if (!show) return null
  return <div className="field-error">{message}</div>
}

export default FieldError
