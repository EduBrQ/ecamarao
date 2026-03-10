import { useState, useEffect } from 'react';
import { backendApi } from '../services/backendApi';
import { DashboardResponse } from '../domains/fazenda/types';
import { calcularRacaoLocal } from '../models/CalculadoraRacao';

interface UseDashboardDataReturn {
  dashboard: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  refetchData: () => Promise<void>;
}

/**
 * Hook customizado para gerenciar dados do dashboard
 * @returns Estado e funções para gerenciar dados do dashboard
 */
export const useDashboardData = (): UseDashboardDataReturn => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardData = await backendApi.getDashboardFazenda();
      
      // Calcular valores com nova calculadora para cada viveiro
      const dashboardComCalculos = {
        ...dashboardData,
        viveiros: dashboardData.viveiros.map((viveiro: any) => {
          // Usar nova calculadora
          const resultadoCalculadora = calcularRacaoLocal({
            viveiro: viveiro.viveiro,
            doc: viveiro.doc,
            biomassaEstimadaKg: 0,
            pesoEstimadoG: 0,
            usandoNovaCalculadora: false
          });
          
          // Atualizar viveiro com valores calculados
          return {
            ...viveiro,
            recomendadoTotal: resultadoCalculadora.racaoTotalDia,
            recomendadoManha: resultadoCalculadora.racaoManha,
            recomendadoTarde: resultadoCalculadora.racaoTarde,
            fase: resultadoCalculadora.faseCultivo,
            fcrAtual: viveiro.racaoAcumulada > 0 && resultadoCalculadora.biomassa > 0 ? 
              (viveiro.racaoAcumulada / resultadoCalculadora.biomassa) : 0,
            biomassa: resultadoCalculadora.biomassa,
            pesoEstimadoG: viveiro.pesoEstimadoG || 0,
            populacaoEstimada: viveiro.populacaoEstimada || 0,
            biomassaEstimadaKg: resultadoCalculadora.biomassa,
            usandoNovaCalculadora: true,
            faixaPeso: resultadoCalculadora.faixaPeso,
            faseCultivo: resultadoCalculadora.faseCultivo,
            taxaAlimentacaoDecimal: resultadoCalculadora.taxaAlimentacaoDecimal
          };
        })
      };
      
      setDashboard(dashboardComCalculos);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Falha ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDashboard();
  }, []);

  return {
    dashboard,
    loading,
    error,
    refetchData: carregarDashboard
  };
};
