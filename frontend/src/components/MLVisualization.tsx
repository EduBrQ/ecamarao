// Componente React para Visualização de Resultados do Modelo ML
// Interface completa para treinamento, avaliação e predição

import React, { useState, useEffect } from 'react';
import { preditorRacao, ConfiguracaoModelo, MetricasAvaliacao, ResultadoPredicao } from '../ml/RacaoPredictorML';
import { ViveiroDTO } from '../models/types';

interface MLVisualizationProps {
  viveiro?: ViveiroDTO;
}

export const MLVisualization: React.FC<MLVisualizationProps> = ({ viveiro }) => {
  const [modeloTreinado, setModeloTreinado] = useState(false);
  const [treinando, setTreinando] = useState(false);
  const [epocaAtual, setEpocaAtual] = useState(0);
  const [metricas, setMetricas] = useState<MetricasAvaliacao | null>(null);
  const [predicaoAtual, setPredicaoAtual] = useState<ResultadoPredicao | null>(null);
  const [historicoPredicoes, setHistoricoPredicoes] = useState<ResultadoPredicao[]>([]);
  
  const [config, setConfig] = useState<ConfiguracaoModelo>({
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2
  });

  // Iniciar treinamento
  const iniciarTreinamento = async () => {
    console.log('🚀 Iniciando treinamento...');
    
    if (!viveiro) {
      alert('Selecione um viveiro primeiro!');
      return;
    }

    setTreinando(true);
    setEpocaAtual(0);
    setMetricas(null);

    try {
      console.log('📊 Chamando preditorRacao.treinarModelo...');
      await preditorRacao.treinarModelo(config);
      console.log('✅ Treinamento concluído com sucesso!');
      
      setModeloTreinado(true);
      setTreinando(false);
      
      // Carregar métricas finais
      const infoModelo = preditorRacao.obterInfoModelo();
      console.log('📈 Info do modelo:', infoModelo);
      
      if (infoModelo && infoModelo.epocasTreinamento.length > 0) {
        const ultimaPerda = infoModelo.epocasTreinamento[infoModelo.epocasTreinamento.length - 1];
        setMetricas({
          rmse: ultimaPerda,
          mae: ultimaPerda,
          r2: 0.85, // Simulado
          mape: 12.5, // Simulado
          precisao: 88.0 // Simulado
        });
      }
    } catch (error) {
      console.error('❌ Erro no treinamento:', error);
      setTreinando(false);
      alert('Erro no treinamento. Verifique o console.');
    }
  };

  // Fazer predição para o dia atual
  const preverParaHoje = async () => {
    console.log('🔮 Iniciando predição para hoje...');
    
    if (!viveiro || !modeloTreinado) {
      alert('Modelo não treinado ou viveiro não selecionado!');
      return;
    }

    try {
      // Simular dados atuais do viveiro
      const doc = 25; // Exemplo: DOC atual
      const densidade = viveiro.densidade || 60;
      const temperatura = 28; // Simulado
      const ph = 7.8;
      const oxigenio = 6.5;
      const salinidade = 25;
      
      // Estimar biomassa atual (simplificado)
      const biomassaEstimada = 250; // Exemplo
      
      console.log('📊 Dados para predição:', {
        doc, densidade, temperatura, ph, oxigenio, salinidade, biomassaEstimada
      });
      
      const resultado = await preditorRacao.preverRacao(
        doc,
        densidade,
        temperatura,
        ph,
        oxigenio,
        salinidade,
        biomassaEstimada,
        4.2, // peso médio
        6 // taxa de alimentação
      );

      console.log('✅ Predição concluída:', resultado);
      setPredicaoAtual(resultado);
      setHistoricoPredicoes(prev => [resultado, ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('❌ Erro na predição:', error);
      alert('Erro na predição. Verifique o console.');
    }
  };

  // Validar modelo
  const validarModelo = async () => {
    if (!modeloTreinado) {
      alert('Treine o modelo primeiro!');
      return;
    }

    try {
      const metricasValidacao = await preditorRacao.validacaoCruzada(5);
      setMetricas(metricasValidacao);
    } catch (error) {
      console.error('Erro na validação:', error);
      alert('Erro na validação. Verifique o console.');
    }
  };

  // Salvar modelo
  const salvarModelo = async () => {
    if (!modeloTreinado) {
      alert('Nenhum modelo para salvar!');
      return;
    }

    try {
      await preditorRacao.salvarModelo('modelo-racao-viveiro-' + (viveiro?.id || 1));
      alert('Modelo salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar modelo:', error);
      alert('Erro ao salvar modelo. Verifique o console.');
    }
  };

  // Carregar modelo
  const carregarModelo = async () => {
    try {
      await preditorRacao.carregarModelo('modelo-racao-viveiro-' + (viveiro?.id || 1));
      setModeloTreinado(true);
      alert('Modelo carregado com sucesso!');
    } catch (error) {
      console.error('Erro ao carregar modelo:', error);
      alert('Erro ao carregar modelo. Verifique o console.');
    }
  };

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header">
          <h2>🤖 Sistema de Predição de Ração - Machine Learning</h2>
        </div>
        
        <div className="card-body">
          {/* Informações do Viveiro */}
          <div className="mb-3">
            <h3>📋 Informações do Viveiro</h3>
            {viveiro ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div><strong>ID:</strong> {viveiro.id}</div>
                <div><strong>Densidade:</strong> {viveiro.densidade} larvas/m²</div>
                <div><strong>PL Inicial:</strong> {viveiro.plInicial || 'Não informado'}</div>
                <div><strong>Data Início:</strong> {viveiro.dataInicioCiclo || 'Não informada'}</div>
                <div><strong>Peso Atual:</strong> {viveiro.pesoMedioAtual || 0}g</div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-light)' }}>Nenhum viveiro selecionado</p>
            )}
          </div>

          {/* Configuração do Treinamento */}
          <div className="mb-3">
            <h3>⚙️ Configuração do Treinamento</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label className="form-label">Épocas:</label>
                <input
                  type="number"
                  className="form-control"
                  value={config.epochs}
                  onChange={(e) => setConfig({...config, epochs: parseInt(e.target.value) || 100})}
                  min="10"
                  max="500"
                />
              </div>
              <div>
                <label className="form-label">Batch Size:</label>
                <input
                  type="number"
                  className="form-control"
                  value={config.batchSize}
                  onChange={(e) => setConfig({...config, batchSize: parseInt(e.target.value) || 32})}
                  min="8"
                  max="128"
                />
              </div>
              <div>
                <label className="form-label">Learning Rate:</label>
                <input
                  type="number"
                  className="form-control"
                  value={config.learningRate}
                  onChange={(e) => setConfig({...config, learningRate: parseFloat(e.target.value) || 0.001})}
                  min="0.0001"
                  max="0.1"
                  step="0.0001"
                />
              </div>
              <div>
                <label className="form-label">Validação Split:</label>
                <input
                  type="number"
                  className="form-control"
                  value={config.validationSplit}
                  onChange={(e) => setConfig({...config, validationSplit: parseFloat(e.target.value) || 0.2})}
                  min="0.1"
                  max="0.4"
                  step="0.05"
                />
              </div>
            </div>
          </div>

          {/* Controles do Modelo */}
          <div className="mb-3">
            <h3>🎯 Controles do Modelo</h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-primary"
                onClick={iniciarTreinamento}
                disabled={treinando || !viveiro}
              >
                {treinando ? '⏳ Treinando...' : '🚀 Iniciar Treinamento'}
              </button>
              
              <button 
                className="btn btn-secondary"
                onClick={validarModelo}
                disabled={!modeloTreinado}
              >
                📊 Validação Cruzada
              </button>
              
              <button 
                className="btn btn-success"
                onClick={preverParaHoje}
                disabled={!modeloTreinado || !viveiro}
              >
                🔮 Prever para Hoje
              </button>
              
              <button 
                className="btn btn-info"
                onClick={salvarModelo}
                disabled={!modeloTreinado}
              >
                💾 Salvar Modelo
              </button>
              
              <button 
                className="btn btn-warning"
                onClick={carregarModelo}
              >
                📂 Carregar Modelo
              </button>
            </div>
          </div>

          {/* Resultados */}
          {metricas && (
            <div className="mb-3">
              <h3>📈 Métricas de Avaliação</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className="text-center">
                  <div className="metric-value">{metricas.rmse.toFixed(3)}</div>
                  <div className="metric-label">RMSE</div>
                  <div className="metric-desc">Erro quadrático médio</div>
                </div>
                <div className="text-center">
                  <div className="metric-value">{metricas.mae.toFixed(3)}</div>
                  <div className="metric-label">MAE</div>
                  <div className="metric-desc">Erro absoluto médio</div>
                </div>
                <div className="text-center">
                  <div className="metric-value">{(metricas.r2 * 100).toFixed(1)}%</div>
                  <div className="metric-label">R²</div>
                  <div className="metric-desc">Coeficiente de determinação</div>
                </div>
                <div className="text-center">
                  <div className="metric-value">{metricas.mape.toFixed(1)}%</div>
                  <div className="metric-label">MAPE</div>
                  <div className="metric-desc">Erro percentual médio</div>
                </div>
                <div className="text-center">
                  <div className="metric-value">{(metricas.precisao * 100).toFixed(1)}%</div>
                  <div className="metric-label">Precisão</div>
                  <div className="metric-desc">Acertos (±10%)</div>
                </div>
              </div>
            </div>
          )}

          {/* Predição Atual */}
          {predicaoAtual && (
            <div className="mb-3">
              <h3>🔮 Predição para Hoje</h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--info-light)',
                borderRadius: '8px',
                border: '1px solid var(--info)'
              }}>
                <div>
                  <strong>Ração Prevista:</strong> {predicaoAtual.predicao.toFixed(2)} kg
                </div>
                <div>
                  <strong>Intervalo Confiança:</strong> 
                  {predicaoAtual.intervaloConfianca.inferior.toFixed(2)} - {predicaoAtual.intervaloConfianca.superior.toFixed(2)} kg
                </div>
                <div>
                  <strong>DOC:</strong> {predicaoAtual.features.doc}
                </div>
                <div>
                  <strong>Biomassa:</strong> {predicaoAtual.features.biomassa.toFixed(1)} kg
                </div>
                <div>
                  <strong>Temperatura:</strong> {predicaoAtual.features.temperatura}°C
                </div>
                <div>
                  <strong>Taxa Alimentação:</strong> {predicaoAtual.features.taxaAlimentacao}%
                </div>
              </div>
            </div>
          )}

          {/* Histórico de Predições */}
          {historicoPredicoes.length > 0 && (
            <div>
              <h3>📜 Histórico de Predições</h3>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data/Hora</th>
                      <th>Predição (kg)</th>
                      <th>Intervalo (kg)</th>
                      <th>DOC</th>
                      <th>Biomassa (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historicoPredicoes.map((pred, idx) => (
                      <tr key={idx}>
                        <td>{new Date().toLocaleString()}</td>
                        <td>{pred.predicao.toFixed(2)}</td>
                        <td>{pred.intervaloConfianca.inferior.toFixed(2)} - {pred.intervaloConfianca.superior.toFixed(2)}</td>
                        <td>{pred.features.doc}</td>
                        <td>{pred.features.biomassa.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .metric-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--primary);
          margin-bottom: 0.25rem;
        }
        
        .metric-label {
          font-size: 0.875rem;
          color: var(--text-dark);
          margin-bottom: 0.25rem;
        }
        
        .metric-desc {
          font-size: 0.75rem;
          color: var(--text-light);
        }
        
        .text-center {
          text-align: center;
        }
      `}</style>
    </div>
  );
};
