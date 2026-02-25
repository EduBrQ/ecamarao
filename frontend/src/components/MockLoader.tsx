import React from 'react';
import { limparTodosDados, verificarMockCarregado, carregarMockViveiro25Dias } from '../mocks/mockViveiro25Dias';

interface MockLoaderProps {
  onMockLoaded?: () => void;
  onMockCleared?: () => void;
}

const MockLoader: React.FC<MockLoaderProps> = ({ onMockLoaded, onMockCleared }) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Verificar se o mock já está carregado ao montar
    const loaded = verificarMockCarregado();
    setIsLoaded(loaded);
  }, []);

  const handleCarregarMock = () => {
    try {
      carregarMockViveiro25Dias();
      setIsLoaded(true);
      if (onMockLoaded) {
        onMockLoaded();
      }
      
      // Recarregar a página após 1 segundo para mostrar os dados
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erro ao carregar mock:', error);
      alert('Erro ao carregar mock. Verifique o console para mais detalhes.');
    }
  };

  const handleLimparDados = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados do localStorage?')) {
      try {
        limparTodosDados();
        setIsLoaded(false);
        if (onMockCleared) {
          onMockCleared();
        }
        
        // Recarregar a página após 500ms
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
      } catch (error) {
        console.error('❌ Erro ao limpar dados:', error);
        alert('Erro ao limpar dados. Verifique o console para mais detalhes.');
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      background: 'white',
      border: '2px solid #3498db',
      borderRadius: '8px',
      padding: '15px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      minWidth: '250px',
      fontSize: '14px'
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
        🦐 Mock Viveiro 60 Dias
      </h4>
      
      <div style={{ marginBottom: '10px', fontSize: '12px', color: '#7f8c8d' }}>
        Status: {isLoaded ? (
          <span style={{ color: '#28a745', fontWeight: 'bold' }}>✅ Carregado</span>
        ) : (
          <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>❌ Não carregado</span>
        )}
      </div>

      <div style={{ marginBottom: '15px', fontSize: '11px', lineHeight: '1.4' }}>
        <strong>Dados:</strong><br />
        • 60 larvas/m²<br />
        • PL10-PL12 (3mg)<br />
        • 60 dias de cultivo<br />
        • 8.5g peso médio<br />
        • FCR: 0.44
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={handleCarregarMock}
          style={{
            background: '#3498db',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#2980b9'}
          onMouseOut={(e) => e.currentTarget.style.background = '#3498db'}
        >
          🚀 Carregar Mock
        </button>
        
        <button
          onClick={handleLimparDados}
          style={{
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#c0392b'}
          onMouseOut={(e) => e.currentTarget.style.background = '#e74c3c'}
        >
          🗑️ Limpar Dados
        </button>
      </div>

      <div style={{ 
        marginTop: '10px', 
        padding: '8px', 
        background: '#f8f9fa', 
        borderRadius: '4px', 
        fontSize: '10px',
        color: '#6c757d',
        border: '1px solid #dee2e6'
      }}>
        <strong>Como usar:</strong><br />
        1. Clique em "Carregar Mock"<br />
        2. Aguarde o recarregamento<br />
        3. Navegue pelo sistema
      </div>
    </div>
  );
};

export default MockLoader;
