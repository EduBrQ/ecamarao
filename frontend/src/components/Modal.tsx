import { ReactNode } from 'react'
import { Modal as DsModal, Button } from '@edubrq/design-system'

interface ModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  children: ReactNode
}

function Modal({ title, isOpen, onClose, onSave, children }: ModalProps) {
  return (
    <DsModal
      open={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onSave}>Salvar</Button>
        </>
      }
    >
      {children}
    </DsModal>
  )
}

export default Modal
