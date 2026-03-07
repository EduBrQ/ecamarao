import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { calcularDOC } from '../models/types'
import { backendApi, Viveiro } from '../services/backendApi'
import { useToastGlobal } from '../hooks/useToastGlobal'

function getStatusColor(doc: number): string {
  if (doc === 0) return 'var(--text-light)'
  if (doc < 30) return 'var(--info)'
  if (doc < 90) return 'var(--success)'
  if (doc < 120) return 'var(--warning)'
  return 'var(--danger)'
}

function getStatusLabel(doc: number): string {
  if (doc === 0) return 'Sem ciclo'
  if (doc < 30) return 'Inicio'
  if (doc < 90) return 'Crescimento'
  if (doc < 120) return 'Engorda'
  return 'Despesca'
}

function Home() {
  const navigate = useNavigate()
  const [viveiros, setViveiros] = useState<Viveiro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [viveiroToDelete, setViveiroToDelete] = useState<{id: number, nome: string} | null>(null)
  const toast = useToastGlobal()

  // Loading inicial de 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])
  const [form, setForm] = useState({
    nome: '',
    densidade: '',
    area: '',
    data_inicio_ciclo: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Um dia antes
    status: 'ativo'
  })

  // Carregar viveiros do backend
  useEffect(() => {
    const loadViveiros = async () => {
      try {
        setLoading(true)
        setError(null)
        const viveirosData = await backendApi.getViveiros()
        setViveiros(viveirosData)
      } catch (err) {
        console.error('Erro ao carregar viveiros:', err)
        setError('Erro ao carregar viveiros do backend')
      } finally {
        setLoading(false)
      }
    }

    loadViveiros()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSubmitted(true)
    if (!form.nome || !form.densidade || !form.area || !form.data_inicio_ciclo) {
      return
    }

    try {
      const newViveiro = await backendApi.createViveiro({
        nome: form.nome,
        densidade: parseFloat(form.densidade),
        area: parseFloat(form.area),
        data_inicio_ciclo: form.data_inicio_ciclo,
        status: form.status
      })

      // Recarregar lista
      const updatedViveiros = await backendApi.getViveiros()
      setViveiros(updatedViveiros)

      setModalOpen(false)
      setSubmitted(false)
      setForm({ nome: '', densidade: '', area: '', data_inicio_ciclo: '', status: 'ativo' })

      // Navegar para o novo viveiro
      navigate(`/viveiro/${newViveiro.id}`)
    } catch (err: any) {
      console.log('🔍 Debug - Erro capturado:', err)
      console.log('🔍 Debug - Toast disponível:', toast)
      
      // 1. Erro específico do backend (response.data.error)
      if (err.response?.data?.error) {
        console.log('🔍 Debug - Erro do backend:', err.response.data.error)
        toast.error('Erro ao criar', err.response.data.error)
      }
      // 2. Erros de validação (response.data.details[])
      else if (err.response?.data?.details) {
        const errors = err.response.data.details;
        if (Array.isArray(errors) && errors.length > 0) {
          console.log('🔍 Debug - Erro de validação:', errors[0].message)
          toast.error('Erro ao criar', errors[0].message)
        } else {
          toast.error('Erro ao criar', 'Dados inválidos')
        }
      }
      // 3. Erro genérico
      else {
        console.log('🔍 Debug - Erro genérico')
        toast.error('Erro ao criar', 'Tente novamente')
      }
    }


  }

  const visualizarViveiro = (viveiro: Viveiro) => {
    navigate(`/viveiro/${viveiro.id}`)
  }

  const handleDeleteViveiro = async (id: number, nome: string) => {
    setViveiroToDelete({ id, nome })
    setDeleteModalOpen(true)
  }

  const confirmDeleteViveiro = async () => {
    if (!viveiroToDelete) return

    try {
      await backendApi.deleteViveiro(viveiroToDelete.id.toString())
      
      // Recarregar lista
      const updatedViveiros = await backendApi.getViveiros()
      setViveiros(updatedViveiros)
      
      toast.success('Viveiro deletado', `"${viveiroToDelete.nome}" foi removido com sucesso`)
      setDeleteModalOpen(false)
      setViveiroToDelete(null)
    } catch (err: any) {
      console.error('Erro ao deletar viveiro:', err)
      
      if (err.response?.data?.error) {
        toast.error('Erro ao deletar', err.response.data.error)
      } else {
        toast.error('Erro ao deletar', 'Não foi possível remover o viveiro')
      }
    }
  }

  const cancelDelete = () => {
    setDeleteModalOpen(false)
    setViveiroToDelete(null)
  }

  // Loading inicial estiloso de 5 segundos
  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="loading-content">
            {/* <div className="loading-spinner">
              <div className="spinner"></div>
            </div> */}
            <h2 className="loading-title">🦐 AquaFarm</h2>
            <p className="loading-subtitle">Sistema de Gestão Aquícola</p>
            <div className="loading-progress">
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <span className="progress-text">Carregando sistema...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container">
        <div className="card text-center">Carregando viveiros...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="card text-center text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="container fade-in">

      <div className="home-header">
        <h2 className="page-title">Meus Viveiros</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* <button className="btn btn-secondary" onClick={() => navigate('/viveiros-backend')}>
            📋 Viveiros Backend
          </button> */}
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + Novo Viveiro
          </button>
        </div>
      </div>

      {/* Farm-level quick access */}
      <div className="farm-nav-card" onClick={() => navigate('/fazenda/racao')}>
        <div className="farm-nav-icon">&#127834;</div>
        <div className="farm-nav-text">
          <span className="farm-nav-title">Racao da Fazenda</span>
          <span className="farm-nav-desc">Gestao de racao de todos os viveiros &middot; Recomendacao diaria</span>
        </div>
        <span className="farm-nav-arrow">&rsaquo;</span>
      </div>

      <div className="viveiro-list">
        {viveiros.map((v) => {
          const doc = calcularDOC(v.data_inicio_ciclo)
          const statusColor = getStatusColor(doc)
          const statusLabel = getStatusLabel(doc)
          const populacao = (v.densidade ?? 0) * 1000

          return (
            <div key={v.id} className="viveiro-status-card">
              <div className="viveiro-status-header">
                <div className="viveiro-status-title" onClick={() => visualizarViveiro(v)}>
                  <span className="viveiro-status-dot" style={{ background: statusColor }} />
                  <h3>{v.nome}</h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="viveiro-status-badge" style={{ background: statusColor }}>
                    {statusLabel}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteViveiro(v.id, v.nome)
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--danger)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem'
                    }}
                    title="Deletar viveiro"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="viveiro-status-info" onClick={() => visualizarViveiro(v)}>
                <span className="viveiro-owner">Status: {v.status} &mdash; {v.area} m²</span>
              </div>

              <div className="viveiro-kpi-row" onClick={() => visualizarViveiro(v)}>
                <div className="viveiro-kpi">
                  <span className="viveiro-kpi-value">{doc}</span>
                  <span className="viveiro-kpi-label">DOC</span>
                </div>
                <div className="viveiro-kpi">
                  <span className="viveiro-kpi-value">{populacao.toLocaleString('pt-BR')}</span>
                  <span className="viveiro-kpi-label">Larvas</span>
                </div>
                <div className="viveiro-kpi">
                  <span className="viveiro-kpi-value">{v.densidade ?? 0}</span>
                  <span className="viveiro-kpi-label">Densidade</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        title="Novo Viveiro"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.nome ? 'has-error' : ''}`}>
            Nome do Viveiro:
          </label>
          <input
            name="nome"
            type="text"
            className={`form-control ${submitted && !form.nome ? 'is-invalid' : ''}`}
            value={form.nome}
            onChange={handleChange}
            placeholder="Ex: Viveiro Principal"
          />
          <FieldError show={submitted && !form.nome} message="Insira o nome do viveiro" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.densidade ? 'has-error' : ''}`}>
            Densidade (camarões/m²):
          </label>
          <input
            name="densidade"
            type="number"
            className={`form-control ${submitted && !form.densidade ? 'is-invalid' : ''}`}
            value={form.densidade}
            onChange={handleChange}
            placeholder="Ex: 80"
            step="0.1"
          />
          <FieldError show={submitted && !form.densidade} message="Insira a densidade por m²" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.area ? 'has-error' : ''}`}>
            Área (m²):
          </label>
          <input
            name="area"
            type="number"
            className={`form-control ${submitted && !form.area ? 'is-invalid' : ''}`}
            value={form.area}
            onChange={handleChange}
            placeholder="Ex: 2000"
            step="0.1"
          />
          <FieldError show={submitted && !form.area} message="Insira a área em m²" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.data_inicio_ciclo ? 'has-error' : ''}`}>
            Data início do ciclo:
          </label>
          <input
            name="data_inicio_ciclo"
            type="date"
            className={`form-control ${submitted && !form.data_inicio_ciclo ? 'is-invalid' : ''}`}
            value={form.data_inicio_ciclo}
            onChange={handleChange}
          />
          <FieldError show={submitted && !form.data_inicio_ciclo} message="Insira a data de início" />
        </div>

        <div className="form-group">
          <label className="form-label">
            Status:
          </label>
          <select
            name="status"
            className="form-control"
            value={form.status}
            onChange={handleChange}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>
      </Modal>

      {/* Modal de Confirmação de Delete */}
      {deleteModalOpen && viveiroToDelete && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
          onClick={cancelDelete}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗑️</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Confirmar Exclusão</h3>
              <p style={{ margin: '0 0 1rem 0', color: '#666', lineHeight: '1.5' }}>
                Tem certeza que deseja deletar o viveiro <strong>"{viveiroToDelete.nome}"</strong>?
              </p>
              <p style={{ margin: '0 0 1.5rem 0', color: '#dc2626', fontSize: '0.875rem' }}>
                ⚠️ Esta ação não pode ser desfeita e apagará todos os dados relacionados (ração, medições, mortalidade).
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteViveiro}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home

// Estilos para o loading estiloso
const LoadingStyles = `
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-card {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 400px;
  width: 90%;
  text-align: center;
  animation: slideIn 0.5s ease-out;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
}

.loading-spinner {
  margin-bottom: 1rem;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-title {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.loading-subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0;
}

.loading-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  width: 100%;
  animation: progress 5s ease-out forwards;
}

.progress-text {
  font-size: 0.875rem;
  color: #666;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progress {
  0% { width: 0%; }
  100% { width: 100%; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
`

// Injetar estilos no documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = LoadingStyles
  document.head.appendChild(styleSheet)
}
