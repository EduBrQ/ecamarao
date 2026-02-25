import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { backendApi, Viveiro, Aerador } from '../services/backendApi'

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

  // Carregar dados do backend
  useEffect(() => {
    const loadAeradoresData = async () => {
      if (!viveiroId) return
      
      try {
        setLoading(true)
        setError(null)

        // Carregar dados em paralelo
        const [viveiroData, aeradoresData] = await Promise.all([
          backendApi.getViveiroById(viveiroId),
          backendApi.getAeradores(viveiroId)
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
    return (
      <div className="container fade-in">
        <div className="card text-center">Carregando dados dos aeradores...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container fade-in">
        <div className="card text-center text-red-600">{error}</div>
      </div>
    )
  }

  if (!viveiro) {
    return (
      <div className="container fade-in">
        <div className="card text-center">Viveiro não encontrado</div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSave = async () => {
    setSubmitted(true)
    if (!form.nome) return

    try {
      await backendApi.createAerador(viveiroId!, {
        nome: form.nome,
        status: form.status
      })
      
      // Recarregar lista
      const updatedAeradores = await backendApi.getAeradores(viveiroId!)
      setAeradores(updatedAeradores)
      
      setModalOpen(false)
      setSubmitted(false)
      setForm({ nome: '', status: false })
    } catch (err) {
      console.error('Erro ao salvar aerador:', err)
      setError('Erro ao salvar aerador')
    }
  }

  const toggleStatus = async (id: number) => {
    try {
      const aerador = aeradores.find(a => a.id === id)
      if (!aerador) return
      
      setLoadingId(id)
      
      await backendApi.updateAerador(viveiroId!, id.toString(), {
        nome: aerador.nome,
        status: !aerador.status
      })
      
      // Recarregar lista
      const updatedAeradores = await backendApi.getAeradores(viveiroId!)
      setAeradores(updatedAeradores)
    } catch (err) {
      console.error('Erro ao atualizar aerador:', err)
      setError('Erro ao atualizar aerador')
    } finally {
      setLoadingId(null)
    }
  }

  const removerAerador = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este aerador?')) return
    
    try {
      await backendApi.deleteAerador(viveiroId!, id.toString())
      
      // Recarregar lista
      const updatedAeradores = await backendApi.getAeradores(viveiroId!)
      setAeradores(updatedAeradores)
    } catch (err) {
      console.error('Erro ao deletar aerador:', err)
      setError('Erro ao deletar aerador')
    }
  }

  const ativos = aeradores.filter(a => a.status).length
  const inativos = aeradores.length - ativos

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">Aeradores — {viveiro.nome}</div>

        <div className="aerador-summary">
          <div className="aerador-main">
            <span className="aerador-value">{aeradores.length}</span>
            <span className="aerador-label">Total</span>
          </div>
          <div className="aerador-details">
            <div className="aerador-detail-item">
              <span className="aerador-detail-value">{ativos}</span>
              <span className="aerador-detail-label">Ativos</span>
            </div>
            <div className="aerador-detail-item">
              <span className="aerador-detail-value">{inativos}</span>
              <span className="aerador-detail-label">Inativos</span>
            </div>
            <div className="aerador-detail-item">
              <span className="aerador-detail-value">{ativos > 0 ? 'OK' : '⚠️'}</span>
              <span className="aerador-detail-label">Status</span>
            </div>
          </div>
        </div>

        <div className="flex-between mb-2">
          <span className="aerador-status-text">
            {ativos === 0 && '⚠️ Nenhum aerador ativo'}
            {ativos > 0 && ativos < aeradores.length && `${ativos}/${aeradores.length} aeradores ativos`}
            {ativos === aeradores.length && '✅ Todos os aeradores ativos'}
          </span>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            + Adicionar
          </button>
        </div>

        <div className="aerador-grid">
          {aeradores.map((aerador) => (
            <div key={aerador.id} className="aerador-card">
              <div className="aerador-card-header">
                <h4>{aerador.nome}</h4>
                <button
                  className="aerador-remove"
                  onClick={() => removerAerador(aerador.id)}
                  aria-label="Remover aerador"
                >
                  &times;
                </button>
              </div>

              <button
                className={`aerador-toggle ${aerador.status ? 'on' : 'off'} ${loadingId === aerador.id ? 'loading' : ''}`}
                onClick={() => toggleStatus(aerador.id)}
                disabled={loadingId === aerador.id}
              >
                <div className="aerador-icon">
                  {aerador.status ? '🌀' : '⏸️'}
                </div>
                <span className="aerador-status-text">
                  {loadingId === aerador.id ? '...' : (aerador.status ? 'Ligado' : 'Desligado')}
                </span>
              </button>

              <div className="aerador-info">
                <span className="aerador-id">ID: {aerador.id}</span>
                <span className="aerador-date">
                  Criado: {new Date(aerador.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
          
          {aeradores.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🌀</div>
              <div className="empty-state-title">Nenhum aerador cadastrado</div>
              <div className="empty-state-text">
                Adicione aeradores para controlar a oxigenação do viveiro
              </div>
              <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                + Adicionar Primeiro Aerador
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        title="Adicionar Aerador"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.nome ? 'has-error' : ''}`}>
            Nome do Aerador:
          </label>
          <input
            name="nome"
            type="text"
            className={`form-control ${submitted && !form.nome ? 'is-invalid' : ''}`}
            value={form.nome}
            onChange={handleChange}
            placeholder="Ex: Aerador Principal, Aerador Secundário"
          />
          <FieldError show={submitted && !form.nome} message="Insira o nome do aerador" />
        </div>

        <div className="form-group">
          <label className="form-label">
            Status Inicial:
          </label>
          <div className="form-check">
            <input
              name="status"
              type="checkbox"
              className="form-check-input"
              checked={form.status}
              onChange={handleChange}
            />
            <label className="form-check-label">
              Ativo (ligado)
            </label>
          </div>
          <div className="form-text">
            Aeradores ativos ajudam a manter os níveis de oxigênio adequados
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Aeradores
