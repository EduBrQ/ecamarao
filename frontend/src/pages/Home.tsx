import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Wheat, ChevronRight, Loader2 } from 'lucide-react'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { calcularDOC } from '../models/types'
import { backendApi, getErrorMessage, Viveiro } from '../services/backendApi'
import { useToastGlobal } from '../hooks/useToastGlobal'

function getStatusVariant(doc: number): 'neutral' | 'info' | 'good' | 'warning' | 'critical' {
  if (doc === 0) return 'neutral'
  if (doc < 30) return 'info'
  if (doc < 90) return 'good'
  if (doc < 120) return 'warning'
  return 'critical'
}

function getStatusLabel(doc: number): string {
  if (doc === 0) return 'Sem ciclo'
  if (doc < 30) return 'Início'
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
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nome: string } | null>(null)
  const toast = useToastGlobal()

  const [form, setForm] = useState({
    nome: '',
    densidade: '',
    area: '',
    data_inicio_ciclo: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ativo',
  })

  useEffect(() => {
    const loadViveiros = async () => {
      try {
        setLoading(true)
        setError(null)
        setViveiros(await backendApi.getViveiros())
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
    if (!form.nome || !form.densidade || !form.area || !form.data_inicio_ciclo) return

    try {
      const newViveiro = await backendApi.createViveiro({
        nome: form.nome,
        densidade: parseFloat(form.densidade),
        area: parseFloat(form.area),
        data_inicio_ciclo: form.data_inicio_ciclo,
        status: form.status,
      })

      setViveiros(await backendApi.getViveiros())
      setModalOpen(false)
      setSubmitted(false)
      setForm({ nome: '', densidade: '', area: '', data_inicio_ciclo: '', status: 'ativo' })
      navigate(`/viveiro/${newViveiro.id}`)
    } catch (err) {
      toast.error('Erro ao criar', getErrorMessage(err, 'Tente novamente'))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await backendApi.deleteViveiro(deleteTarget.id.toString())
      setViveiros(await backendApi.getViveiros())
      toast.success('Viveiro deletado', `"${deleteTarget.nome}" foi removido com sucesso`)
      setDeleteTarget(null)
    } catch {
      toast.error('Erro ao deletar', 'Não foi possível remover o viveiro')
    }
  }

  if (loading) {
    return (
      <div className="page fade-in">
        <div className="card text-center">
          <Loader2 className="spinner" size={20} />
          Carregando viveiros...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page fade-in">
        <div className="card text-center field-error">{error}</div>
      </div>
    )
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Meus viveiros</h1>
          <p className="page-subtitle">{viveiros.length} viveiro{viveiros.length !== 1 ? 's' : ''} cadastrado{viveiros.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Novo viveiro
        </button>
      </div>

      <button className="nav-item" onClick={() => navigate('/fazenda/racao')}>
        <span className="nav-item-icon"><Wheat size={20} /></span>
        <span className="nav-item-text">
          <span className="nav-item-title">Ração da fazenda</span>
          <span className="nav-item-desc">Visão geral de todos os viveiros e recomendação diária</span>
        </span>
        <span className="nav-item-trailing"><ChevronRight size={18} /></span>
      </button>

      {viveiros.length === 0 ? (
        <div className="card">
          <div className="empty-state">Nenhum viveiro cadastrado ainda. Crie o primeiro acima.</div>
        </div>
      ) : (
        <div className="nav-list">
          {viveiros.map((v) => {
            const doc = calcularDOC(v.data_inicio_ciclo)
            const populacao = (v.densidade ?? 0) * 1000
            return (
              <div key={v.id} className="card" style={{ padding: 0 }}>
                <button
                  className="nav-item"
                  style={{ border: 'none' }}
                  onClick={() => navigate(`/viveiro/${v.id}`)}
                >
                  <span className="nav-item-text">
                    <span className="card-row">
                      <span className="nav-item-title">{v.nome}</span>
                      <span className={`pill pill-${getStatusVariant(doc)}`}>{getStatusLabel(doc)}</span>
                    </span>
                    <span className="nav-item-desc">{v.status} &middot; {v.area} m²</span>
                    <span className="stat-grid" style={{ marginTop: 'var(--space-2)' }}>
                      <span className="stat-tile">
                        <span className="stat-value">{doc}</span>
                        <span className="stat-label">DOC</span>
                      </span>
                      <span className="stat-tile">
                        <span className="stat-value">{populacao.toLocaleString('pt-BR')}</span>
                        <span className="stat-label">Larvas</span>
                      </span>
                      <span className="stat-tile">
                        <span className="stat-value">{v.densidade ?? 0}</span>
                        <span className="stat-label">Densidade</span>
                      </span>
                    </span>
                  </span>
                </button>
                <div style={{ padding: '0 var(--space-4) var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setDeleteTarget({ id: v.id, nome: v.nome })}
                  >
                    <Trash2 size={14} />
                    Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        title="Novo viveiro"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.nome ? 'has-error' : ''}`}>Nome do viveiro</label>
          <input
            name="nome" type="text"
            className={`form-control ${submitted && !form.nome ? 'is-invalid' : ''}`}
            value={form.nome} onChange={handleChange}
            placeholder="Ex: Viveiro Principal"
          />
          <FieldError show={submitted && !form.nome} message="Insira o nome do viveiro" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.densidade ? 'has-error' : ''}`}>Densidade (camarões/m²)</label>
          <input
            name="densidade" type="number" step="0.1"
            className={`form-control ${submitted && !form.densidade ? 'is-invalid' : ''}`}
            value={form.densidade} onChange={handleChange}
            placeholder="Ex: 80"
          />
          <FieldError show={submitted && !form.densidade} message="Insira a densidade por m²" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.area ? 'has-error' : ''}`}>Área (m²)</label>
          <input
            name="area" type="number" step="0.1"
            className={`form-control ${submitted && !form.area ? 'is-invalid' : ''}`}
            value={form.area} onChange={handleChange}
            placeholder="Ex: 2000"
          />
          <FieldError show={submitted && !form.area} message="Insira a área em m²" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.data_inicio_ciclo ? 'has-error' : ''}`}>Data início do ciclo</label>
          <input
            name="data_inicio_ciclo" type="date"
            className={`form-control ${submitted && !form.data_inicio_ciclo ? 'is-invalid' : ''}`}
            value={form.data_inicio_ciclo} onChange={handleChange}
          />
          <FieldError show={submitted && !form.data_inicio_ciclo} message="Insira a data de início" />
        </div>

        <div className="form-group">
          <label className="form-label">Status</label>
          <select name="status" className="form-control" value={form.status} onChange={handleChange}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>
      </Modal>

      {deleteTarget && (
        <div className="confirm-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="confirm-icon" size={32} />
            <h3 className="confirm-title">Confirmar exclusão</h3>
            <p className="confirm-text">
              Tem certeza que deseja deletar o viveiro <strong>"{deleteTarget.nome}"</strong>?
              Esta ação apaga também os dados de ração, medições e mortalidade relacionados.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Deletar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Home
