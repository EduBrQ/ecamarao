import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Fan, Plus, Trash2, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { backendApi, getErrorMessage, Viveiro, Aerador } from '../services/backendApi'

function Aeradores() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [aeradores, setAeradores] = useState<Aerador[]>([])
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ nome: '', status: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  useEffect(() => {
    const loadAeradoresData = async () => {
      if (!viveiroId) return
      try {
        setLoading(true)
        setError(null)
        const [viveiroData, aeradoresData] = await Promise.all([
          backendApi.getViveiroById(viveiroId),
          backendApi.getAeradores(viveiroId),
        ])
        setViveiro(viveiroData)
        setAeradores(aeradoresData)
      } catch (err) {
        console.error('Erro ao carregar dados dos aeradores:', err)
        setError('Erro ao carregar dados do viveiro')
      } finally {
        setLoading(false)
      }
    }
    loadAeradoresData()
  }, [viveiroId])

  if (loading) {
    return <div className="page fade-in"><div className="card text-center"><Loader2 className="spinner" size={20} />Carregando aeradores...</div></div>
  }
  if (error) {
    return <div className="page fade-in"><div className="card text-center field-error">{error}</div></div>
  }
  if (!viveiro) {
    return <div className="page fade-in"><div className="card text-center">Viveiro não encontrado</div></div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSave = async () => {
    setSubmitted(true)
    if (!form.nome) return
    try {
      await backendApi.createAerador(viveiroId!, { nome: form.nome, status: form.status })
      setAeradores(await backendApi.getAeradores(viveiroId!))
      setModalOpen(false)
      setSubmitted(false)
      setForm({ nome: '', status: false })
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar aerador'))
    }
  }

  const toggleStatus = async (id: number) => {
    const aerador = aeradores.find((a) => a.id === id)
    if (!aerador) return
    try {
      setLoadingId(id)
      await backendApi.updateAerador(viveiroId!, id.toString(), { nome: aerador.nome, status: !aerador.status })
      setAeradores(await backendApi.getAeradores(viveiroId!))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao atualizar aerador'))
    } finally {
      setLoadingId(null)
    }
  }

  const removerAerador = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este aerador?')) return
    try {
      await backendApi.deleteAerador(viveiroId!, id.toString())
      setAeradores(await backendApi.getAeradores(viveiroId!))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao deletar aerador'))
    }
  }

  const ativos = aeradores.filter((a) => a.status).length

  return (
    <div className="page fade-in">
      <div className="card">
        <h2 className="section-title">Aeradores &mdash; {viveiro.nome}</h2>

        <div className="stat-grid">
          <div className="stat-tile">
            <span className="stat-value">{aeradores.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-tile stat-tile-good">
            <span className="stat-value">{ativos}</span>
            <span className="stat-label">Ativos</span>
          </div>
          <div className="stat-tile stat-tile-critical">
            <span className="stat-value">{aeradores.length - ativos}</span>
            <span className="stat-label">Inativos</span>
          </div>
        </div>

        {aeradores.length > 0 && (
          <div className={`pill ${ativos === 0 ? 'pill-critical' : ativos === aeradores.length ? 'pill-good' : 'pill-warning'}`}>
            {ativos === 0 && <><AlertTriangle size={12} /> Nenhum aerador ativo</>}
            {ativos > 0 && ativos < aeradores.length && `${ativos}/${aeradores.length} aeradores ativos`}
            {ativos === aeradores.length && <><CheckCircle2 size={12} /> Todos os aeradores ativos</>}
          </div>
        )}

        <div className="card-row">
          <span />
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {aeradores.length === 0 ? (
          <div className="empty-state">
            <Fan className="empty-state-icon" size={28} />
            <strong>Nenhum aerador cadastrado</strong>
            <span>Adicione aeradores para controlar a oxigenação do viveiro</span>
            <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Adicionar primeiro aerador
            </button>
          </div>
        ) : (
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {aeradores.map((aerador) => (
              <div key={aerador.id} className="card">
                <div className="card-row">
                  <strong style={{ fontSize: '0.85rem' }}>{aerador.nome}</strong>
                  <button className="icon-btn" onClick={() => removerAerador(aerador.id)} aria-label="Remover aerador">
                    <Trash2 size={14} />
                  </button>
                </div>
                <button
                  className={`btn btn-block ${aerador.status ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => toggleStatus(aerador.id)}
                  disabled={loadingId === aerador.id}
                  style={{ flexDirection: 'column', gap: '0.35rem', padding: 'var(--space-3)' }}
                >
                  <Fan size={24} className={aerador.status ? 'fan-spin' : ''} />
                  <span>{loadingId === aerador.id ? '...' : aerador.status ? 'Ligado' : 'Desligado'}</span>
                </button>
                <span className="page-subtitle" style={{ fontSize: '0.7rem' }}>
                  Desde {new Date(aerador.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        title="Adicionar aerador"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.nome ? 'has-error' : ''}`}>Nome do aerador</label>
          <input
            name="nome" type="text"
            className={`form-control ${submitted && !form.nome ? 'is-invalid' : ''}`}
            value={form.nome} onChange={handleChange}
            placeholder="Ex: Aerador principal, Aerador secundário"
          />
          <FieldError show={submitted && !form.nome} message="Insira o nome do aerador" />
        </div>
        <div className="form-group">
          <div className="form-check">
            <input name="status" type="checkbox" className="form-check-input" checked={form.status} onChange={handleChange} id="aerador-status" />
            <label className="form-label" htmlFor="aerador-status">Ativo (ligado)</label>
          </div>
          <span className="form-hint">Aeradores ativos ajudam a manter os níveis de oxigênio adequados</span>
        </div>
      </Modal>
    </div>
  )
}

export default Aeradores
