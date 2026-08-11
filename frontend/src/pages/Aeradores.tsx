import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Fan, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, StatTile, Badge, IconButton, Button, Input, Checkbox, EmptyState, Spinner, Alert, type BadgeTone } from '@edubrq/design-system'
import Modal from '../components/Modal'
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
    return <div className="page fade-in"><Card className="text-center"><Spinner /> Carregando aeradores...</Card></div>
  }
  if (error) {
    return <div className="page fade-in"><Alert tone="danger">{error}</Alert></div>
  }
  if (!viveiro) {
    return <div className="page fade-in"><EmptyState title="Viveiro não encontrado" /></div>
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
  const statusTone: BadgeTone = ativos === 0 ? 'danger' : ativos === aeradores.length ? 'success' : 'warning'

  return (
    <div className="page fade-in">
      <Card>
        <h2 className="section-title">Aeradores &mdash; {viveiro.nome}</h2>

        <div className="stat-grid">
          <StatTile label="Total" value={aeradores.length} />
          <StatTile className="stat-tile-good" label="Ativos" value={ativos} />
          <StatTile className="stat-tile-critical" label="Inativos" value={aeradores.length - ativos} />
        </div>

        {aeradores.length > 0 && (
          <Badge tone={statusTone}>
            {ativos === 0 && <><AlertTriangle size={12} /> Nenhum aerador ativo</>}
            {ativos > 0 && ativos < aeradores.length && `${ativos}/${aeradores.length} aeradores ativos`}
            {ativos === aeradores.length && <><CheckCircle2 size={12} /> Todos os aeradores ativos</>}
          </Badge>
        )}

        <div className="card-row">
          <span />
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Adicionar
          </Button>
        </div>

        {aeradores.length === 0 ? (
          <EmptyState
            icon={<Fan size={28} />}
            title="Nenhum aerador cadastrado"
            description="Adicione aeradores para controlar a oxigenação do viveiro"
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus size={14} /> Adicionar primeiro aerador
              </Button>
            }
          />
        ) : (
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
            {aeradores.map((aerador) => (
              <Card key={aerador.id}>
                <div className="card-row">
                  <strong style={{ fontSize: '0.85rem' }}>{aerador.nome}</strong>
                  <IconButton variant="ghost" size="sm" onClick={() => removerAerador(aerador.id)} aria-label="Remover aerador" icon={<Trash2 size={14} />} />
                </div>
                <Button
                  variant={aerador.status ? 'primary' : 'secondary'}
                  className="btn-block"
                  onClick={() => toggleStatus(aerador.id)}
                  disabled={loadingId === aerador.id}
                  style={{ flexDirection: 'column', gap: '0.35rem', padding: 'var(--space-3)' }}
                >
                  <Fan size={24} className={aerador.status ? 'fan-spin' : ''} />
                  <span>{loadingId === aerador.id ? '...' : aerador.status ? 'Ligado' : 'Desligado'}</span>
                </Button>
                <span className="page-subtitle" style={{ fontSize: '0.7rem' }}>
                  Desde {new Date(aerador.created_at).toLocaleDateString('pt-BR')}
                </span>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Modal
        title="Adicionar aerador"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <Input
          name="nome" type="text" label="Nome do aerador" required
          value={form.nome} onChange={handleChange}
          placeholder="Ex: Aerador principal, Aerador secundário"
          error={submitted && !form.nome ? 'Insira o nome do aerador' : undefined}
        />
        <Checkbox
          name="status"
          checked={form.status}
          onChange={handleChange}
          label="Ativo (ligado)"
        />
        <span className="form-hint">Aeradores ativos ajudam a manter os níveis de oxigênio adequados</span>
      </Modal>
    </div>
  )
}

export default Aeradores
