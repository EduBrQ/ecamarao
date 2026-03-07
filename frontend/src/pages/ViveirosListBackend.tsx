import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendApi, Viveiro } from '../services/backendApi';
import { useToastGlobal } from '../hooks/useToastGlobal';

export function ViveirosListBackend() {
  const navigate = useNavigate();
  const toast = useToastGlobal();
  const [viveiros, setViveiros] = useState<Viveiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar lista de viveiros do backend
  useEffect(() => {
    const loadViveiros = async () => {
      try {
        setLoading(true);
        setError(null);
        const viveirosData = await backendApi.getViveiros();
        setViveiros(viveirosData);
      } catch (err) {
        console.error('Erro ao carregar viveiros:', err);
        setError('Erro ao carregar lista de viveiros');
      } finally {
        setLoading(false);
      }
    };

    loadViveiros();
  }, []);

  const handleCreateViveiro = async () => {
    const nome = prompt('Nome do novo viveiro:');
    if (!nome) return;

    try {
      const newViveiro = await backendApi.createViveiro({
        nome: nome,
        densidade: 80.0,
        area: 2000.0,
        data_inicio_ciclo: new Date().toISOString().split('T')[0],
        status: 'ativo'
      });
      
      // Recarregar lista
      const updatedViveiros = await backendApi.getViveiros();
      setViveiros(updatedViveiros);
      
      // Navegar para o novo viveiro
      navigate(`/viveiro/${newViveiro.id}`);
    } catch (err: any) {
      console.error('Erro ao criar viveiro:', err);
      
      // Extrair mensagem de erro específica
      if (err.response?.data?.details) {
        const errors = err.response.data.details;
        if (Array.isArray(errors) && errors.length > 0) {
          const firstError = errors[0];
          toast.error('Erro ao criar viveiro', firstError.message);
        } else {
          toast.error('Erro ao criar viveiro', 'Dados inválidos');
        }
      } else if (err.response?.data?.error) {
        toast.error('Erro ao criar viveiro', err.response.data.error);
      } else {
        toast.error('Erro ao criar viveiro', 'Tente novamente');
      }
    }
  };

  const handleDeleteViveiro = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este viveiro?')) return;

    try {
      await backendApi.deleteViveiro(id.toString());
      // Recarregar lista
      const updatedViveiros = viveiros.filter(v => v.id !== id);
      setViveiros(updatedViveiros);
    } catch (err) {
      console.error('Erro ao deletar viveiro:', err);
      setError('Erro ao deletar viveiro');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">Carregando viveiros...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card text-center text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="viveiros-header">
        <h1>Lista de Viveiros (Backend)</h1>
        <div className="viveiros-actions">
          <button 
            onClick={handleCreateViveiro}
            className="btn"
          >
            ➕ Novo Viveiro
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="btn-secondary"
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      <div className="viveiros-grid">
        {viveiros.map(viveiro => (
          <div key={viveiro.id} className="viveiro-card">
            <div className="viveiro-card-header">
              <h3>{viveiro.nome}</h3>
              <span className={`viveiro-status viveiro-status-${viveiro.status}`}>
                {viveiro.status}
              </span>
            </div>
            <div className="viveiro-card-body">
              <div className="viveiro-info">
                <div className="viveiro-info-item">
                  <label>Densidade:</label>
                  <span>{viveiro.densidade} camarões/m²</span>
                </div>
                <div className="viveiro-info-item">
                  <label>Área:</label>
                  <span>{viveiro.area} m²</span>
                </div>
                <div className="viveiro-info-item">
                  <label>Início:</label>
                  <span>{new Date(viveiro.data_inicio_ciclo).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="viveiro-actions">
                <button 
                  onClick={() => navigate(`/viveiro/${viveiro.id}`)}
                  className="btn-secondary"
                >
                  📝 Editar
                </button>
                <button 
                  onClick={() => handleDeleteViveiro(viveiro.id)}
                  className="btn bg-red-600 text-white"
                >
                  🗑️ Deletar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
