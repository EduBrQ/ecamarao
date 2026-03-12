import React from 'react';

interface AquaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  title: string;
  children: React.ReactNode;
  saveButtonText?: string;
  cancelButtonText?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AquaModal: React.FC<AquaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  children,
  saveButtonText = 'Salvar',
  cancelButtonText = 'Cancelar',
  size = 'md'
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="aqua-modal-overlay" onClick={handleOverlayClick}>
      <div className={`aqua-modal aqua-modal-${size}`}>
        <div className="aqua-modal-header">
          <h3 className="aqua-modal-title">{title}</h3>
          <button className="aqua-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="aqua-modal-body">
          {children}
        </div>
        
        {onSave && (
          <div className="aqua-modal-footer">
            <button className="aqua-btn aqua-btn-secondary" onClick={onClose}>
              {cancelButtonText}
            </button>
            <button className="aqua-btn aqua-btn-primary" onClick={onSave}>
              {saveButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AquaModal;
