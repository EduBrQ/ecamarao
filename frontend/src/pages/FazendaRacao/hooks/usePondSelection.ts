import { useState } from 'react';
import { ViveiroDashboard } from '../types/dashboard';

interface UsePondSelectionReturn {
  selectedViveiro: ViveiroDashboard | null;
  selectViveiro: (viveiro: ViveiroDashboard) => void;
  clearSelection: () => void;
}

/**
 * Hook customizado para gerenciar seleção de viveiros
 * @returns Estado e funções para gerenciar seleção
 */
export const usePondSelection = (): UsePondSelectionReturn => {
  const [selectedViveiro, setSelectedViveiro] = useState<ViveiroDashboard | null>(null);

  const selectViveiro = (viveiro: ViveiroDashboard) => {
    setSelectedViveiro(viveiro);
  };

  const clearSelection = () => {
    setSelectedViveiro(null);
  };

  return {
    selectedViveiro,
    selectViveiro,
    clearSelection
  };
};
