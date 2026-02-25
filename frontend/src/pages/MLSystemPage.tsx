// Página principal para o Sistema de Machine Learning
// Integra todas as funcionalidades ML em uma interface completa

import React, { useState, useEffect } from 'react';
import { MLVisualization } from '../components/MLVisualization';
import { gerarDadosSinteticos, exportarCSV, datasetDividido } from '../data/datasetML';

export default function MLSystemPage() {
  const [activeTab, setActiveTab] = useState<'dataset' | 'treinamento' | 'predicao'>('dataset');
  const [dadosGerados, setDadosGerados] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Gerar dataset quando a aba for carregada
  useEffect(() => {
    if (activeTab === 'dataset' && !dadosGerados) {
      gerarDadosSinteticos(1000);
      setDadosGerados(true);
    }
  }, [activeTab, dadosGerados]);

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header">
          <h1>🤖 Sistema de Machine Learning - Predição de Ração</h1>
        </div>
        
        <div className="card-body">
          {/* Abas de Navegação */}
          <div className="mb-3">
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <button 
                className={`btn ${activeTab === 'dataset' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('dataset')}
              >
                📊 Dataset
              </button>
              <button 
                className={`btn ${activeTab === 'treinamento' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('treinamento')}
              >
                🎯 Treinamento
              </button>
              <button 
                className={`btn ${activeTab === 'predicao' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('predicao')}
              >
                🔮 Predição
              </button>
            </div>
          </div>

          {/* Conteúdo da Aba Ativa */}
          {activeTab === 'dataset' && (
            <div>
              <h2>📊 Dataset de Treinamento</h2>
              <div style={{ 
                backgroundColor: 'var(--info-light)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                marginBottom: '2rem'
              }}>
                <h3>📋 Dataset Sintético Gerado</h3>
                <p>Dataset baseado em literatura acadêmica de carcinicultura brasileira:</p>
                <ul>
                  <li><strong>1000 registros</strong> de dados simulados</li>
                  <li><strong>10 variáveis</strong> incluindo ambientais e biométricas</li>
                  <li><strong>Divisão automática:</strong> 70% treino, 20% teste, 10% validação</li>
                  <li><strong>Realismo:</strong> Baseado em taxas FAO e condições reais</li>
                </ul>
                
                <div style={{ marginTop: '1rem' }}>
                  <button 
                    className="btn btn-success"
                    onClick={() => setShowExportOptions(!showExportOptions)}
                  >
                    📥 Opções de Exportação
                  </button>
                  
                  {showExportOptions && (
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--light)', borderRadius: '8px' }}>
                      <h4>Exportar Dataset:</h4>
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button 
                          className="btn btn-primary"
                          onClick={() => exportarCSV(datasetDividido.treino, 'dataset_treino.csv')}
                        >
                          📂 Treino (700 registros)
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => exportarCSV(datasetDividido.teste, 'dataset_teste.csv')}
                        >
                          📂 Teste (200 registros)
                        </button>
                        <button 
                          className="btn btn-info"
                          onClick={() => exportarCSV(datasetDividido.validacao, 'dataset_validacao.csv')}
                        >
                          📂 Validação (100 registros)
                        </button>
                        <button 
                          className="btn btn-warning"
                          onClick={() => exportarCSV(gerarDadosSinteticos(1000), 'dataset_completo.csv')}
                        >
                          📂 Completo (1000 registros)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-3">
                <h3>📈 Estatísticas do Dataset</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                  <div className="text-center">
                    <div className="stat-value">{datasetDividido.treino.length}</div>
                    <div className="stat-label">Registros Treino</div>
                  </div>
                  <div className="text-center">
                    <div className="stat-value">{datasetDividido.teste.length}</div>
                    <div className="stat-label">Registros Teste</div>
                  </div>
                  <div className="text-center">
                    <div className="stat-value">{datasetDividido.validacao.length}</div>
                    <div className="stat-label">Registros Validação</div>
                  </div>
                  <div className="text-center">
                    <div className="stat-value">{datasetDividido.treino.length + datasetDividido.teste.length + datasetDividido.validacao.length}</div>
                    <div className="stat-label">Total</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'treinamento' && (
            <div>
              <h2>🎯 Treinamento do Modelo</h2>
              <MLVisualization />
            </div>
          )}

          {activeTab === 'predicao' && (
            <div>
              <h2>🔮 Predição de Ração</h2>
              <MLVisualization />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: var(--primary);
          margin-bottom: 0.5rem;
        }
        
        .stat-label {
          font-size: 0.875rem;
          color: var(--text-dark);
          text-align: center;
        }
        
        .text-center {
          text-align: center;
        }
      `}</style>
    </div>
  );
}
