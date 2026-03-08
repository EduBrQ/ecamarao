import { ReactNode } from 'react'

interface ModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  children: ReactNode
  saveButtonText?: string
  saveButtonClass?: string
}

function Modal({ title, isOpen, onClose, onSave, children, saveButtonText = "Salvar", saveButtonClass = "btn-primary" }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className={`btn ${saveButtonClass}`} onClick={onSave}>{saveButtonText}</button>
        </div>
      </div>
    </div>
  )
}

export default Modal
