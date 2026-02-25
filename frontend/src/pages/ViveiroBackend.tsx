import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { backendApi, Viveiro } from '../services/backendApi';

export function ViveiroBackend() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [viveiro, setViveiro] = useState<Viveiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do viveiro do backend
  useEffect(() => {
    const loadViveiro = async () => {
      if (!id) {
        setError('ID do viveiro não fornecido');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        const viveiroData = await backendApi.getViveiroById(id);
        setViveiro(viveiroData);
      } catch (err) {
        console.error('Erro ao carregar viveiro:', err);
        setError('Erro ao carregar dados do viveiro');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadViveiro();
    }
  }, [id]);

  const handleUpdate = async (field: string, value: any) => {
    if (!viveiro || !id) return;

    try {
      const updatedViveiro = await backendApi.updateViveiro(id, { [field]: value });
      setViveiro(updatedViveiro);
    } catch (err) {
      console.error('Erro ao atualizar viveiro:', err);
      setError('Erro ao atualizar viveiro');
    }
  };

  const handleDelete = async () => {
    if (!viveiro || !id) return;

    if (!confirm('Tem certeza que deseja deletar este viveiro?')) return;

    try {
      await backendApi.deleteViveiro(id);
      navigate('/viveiros');
    } catch (err) {
      console.error('Erro ao deletar viveiro:', err);
      setError('Erro ao deletar viveiro');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">Carregando dados do viveiro...</div>
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

  if (!viveiro) {
    return (
      <div className="container">
        <div className="card text-center">Viveiro não encontrado</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="viveiro-detail-header">
        <div className="viveiro-detail-title">
          <h2>Viveiro {viveiro.id}</h2>
          <span className="viveiro-detail-sub">
            Status: {viveiro.status}
          </span>
        </div>
        <div className="viveiro-detail-actions">
          <button 
            onClick={() => navigate('/viveiros')}
            className="btn-secondary"
          >
            ← Voltar
          </button>
          <button 
            onClick={handleDelete}
            className="btn bg-red-600 text-white"
          >
            🗑️ Deletar
          </button>
        </div>
      </div>

      <div className="viveiro-info-grid">
        <div className="viveiro-info-card">
          <h3>Informações Básicas</h3>
          <div className="form-group">
            <label>Nome:</label>
            <input
              type="text"
              value={viveiro.nome}
              onChange={(e) => handleUpdate('nome', e.target.value)}
              className="input"
            />
          </div>
          <div className="form-group">
            <label>Status:</label>
            <select
              value={viveiro.status}
              onChange={(e) => handleUpdate('status', e.target.value)}
              className="input"
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="manutencao">Manutenção</option>
            </select>
          </div>
        </div>

        <div className="viveiro-info-card">
          <h3>Dados Técnicos</h3>
          <div className="form-group">
            <label>Densidade (camarões/m²):</label>
            <input
              type="number"
              value={viveiro.densidade}
              onChange={(e) => handleUpdate('densidade', parseFloat(e.target.value))}
              className="input"
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label>Área (m²):</label>
            <input
              type="number"
              value={viveiro.area}
              onChange={(e) => handleUpdate('area', parseFloat(e.target.value))}
              className="input"
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label>Início do Ciclo:</label>
            <input
              type="date"
              value={viveiro.data_inicio_ciclo}
              onChange={(e) => handleUpdate('data_inicio_ciclo', e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="viveiro-actions">
        <button 
          onClick={() => handleUpdate('nome', viveiro.nome)}
          className="btn"
        >
          💾 Salvar Alterações
        </button>
      </div>

      <style>{`
        .viveiro-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 1rem;
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .viveiro-detail-title h2 {
          margin: 0;
          color: #1f2937;
        }

        .viveiro-detail-sub {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .viveiro-detail-actions {
          display: flex;
          gap: 0.5rem;
        }

        .viveiro-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .viveiro-info-card {
          background: white;
          padding: 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .viveiro-info-card h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
          font-weight: 600;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .viveiro-actions {
          text-align: center;
          padding: 2rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        @media (max-width: 768px) {
          .viveiro-info-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
