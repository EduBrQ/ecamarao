import { useState, useEffect } from 'react';
import { backendApi } from '../../../services/backendApi';
import { DashboardResponse } from '../types/dashboard';
import { CalculadoraRacao } from '../../../models/CalculadoraRacao';

interface UseDashboardDataReturn {
  dashboard: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  totalRacaoHoje: number;
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
          // Calcular quantidade real de camarões: densidade × área
          const quantidadeCamaroes = viveiro.viveiro.densidade * viveiro.viveiro.area;
          
          // Calcular peso médio baseado no DOC para camarões jovens
          // Para pós-larva (DOC 3), peso é muito menor (~0.03g)
          let pesoMedioGramas = 0.03; // Padrão para pós-larva

          // Se não tiver peso estimado, calcular baseado no DOC
          const doc = viveiro.doc || 0;
          if (doc <= 10) pesoMedioGramas = 0.015; // ~15mg
          else if (doc <= 20) pesoMedioGramas = 0.025; // ~25mg  
          else if (doc <= 30) pesoMedioGramas = 0.05;  // ~50mg
          else if (doc <= 45) pesoMedioGramas = 0.1;   // ~100mg
          else if (doc <= 60) pesoMedioGramas = 0.5;   // ~500mg
          else pesoMedioGramas = 1.0; // 1g para fases mais avançadas

          // Usar nova calculadora com valores corretos
          const resultadoCalculadora = CalculadoraRacao.calcularRacaoDiaria({
            quantidadeCamaroes: quantidadeCamaroes,
            pesoMedioGramas: pesoMedioGramas,
            doc: doc
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
            pesoEstimadoG: pesoMedioGramas,
            populacaoEstimada: quantidadeCamaroes,
            biomassaEstimadaKg: resultadoCalculadora.biomassa,
            usandoNovaCalculadora: true,
            faixaPeso: resultadoCalculadora.faixaPeso,
            faseCultivo: resultadoCalculadora.faseCultivo,
            taxaAlimentacaoDecimal: resultadoCalculadora.taxaAlimentacao / 100
          };
        })
      };

      // Calcular totais da fazenda usando a nova calculadora
      const totaisCalculados = CalculadoraRacao.calcularTotalRecomendado(dashboardComCalculos.viveiros);
      
      // Atualizar dashboard com valores calculados e totais
      const dashboardFinal = {
        ...dashboardComCalculos,
        totais: {
          ...dashboardData.totais,
          totalRecomendado: totaisCalculados.totalRecomendado
        }
      };

      setDashboard(dashboardFinal);
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

  // Calcular total de ração hoje
  const totalRacaoHoje = dashboard?.viveiros.reduce((total, viveiro) => {
    const hoje = new Date().toISOString().split('T')[0];
    const racaoHoje = viveiro.racoes.find(r => r.data.split('T')[0] === hoje);
    return total + (racaoHoje?.total || 0);
  }, 0) || 0;

  return {
    dashboard,
    loading,
    error,
    totalRacaoHoje,
    refetchData: carregarDashboard
  };
};
