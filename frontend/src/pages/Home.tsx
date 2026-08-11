import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Wheat, ChevronRight } from 'lucide-react'
import {
  Button, Card, Badge, StatTile, Input, Select, EmptyState, Spinner, Alert,
  Modal as DsModal, type BadgeTone,
} from '@edubrq/design-system'
import Modal from '../components/Modal'
import { calcularDOC } from '../models/types'
import { backendApi, getErrorMessage, Viveiro } from '../services/backendApi'
import { useToastGlobal } from '../hooks/useToastGlobal'

function getStatusTone(doc: number): BadgeTone {
  if (doc === 0) return 'neutral'
  if (doc < 30) return 'accent'
  if (doc < 90) return 'success'
  if (doc < 120) return 'warning'
  return 'danger'
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
        <Card className="text-center"><Spinner /> Carregando viveiros...</Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page fade-in">
        <Alert tone="danger">{error}</Alert>
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
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Novo viveiro
        </Button>
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
        <Card>
          <EmptyState title="Nenhum viveiro cadastrado ainda. Crie o primeiro acima." />
        </Card>
      ) : (
        <div className="nav-list">
          {viveiros.map((v) => {
            const doc = calcularDOC(v.data_inicio_ciclo)
            const populacao = (v.densidade ?? 0) * (v.area ?? 0)
            return (
              <Card key={v.id} style={{ padding: 0 }}>
                <button
                  className="nav-item"
                  style={{ border: 'none' }}
                  onClick={() => navigate(`/viveiro/${v.id}`)}
                >
                  <span className="nav-item-text">
                    <span className="card-row">
                      <span className="nav-item-title">{v.nome}</span>
                      <Badge tone={getStatusTone(doc)}>{getStatusLabel(doc)}</Badge>
                    </span>
                    <span className="nav-item-desc">{v.status} &middot; {v.area} m²</span>
                    <span className="stat-grid" style={{ marginTop: 'var(--space-2)' }}>
                      <StatTile label="DOC" value={doc} />
                      <StatTile label="População" value={populacao.toLocaleString('pt-BR')} />
                      <StatTile label="Densidade" value={v.densidade ?? 0} />
                    </span>
                  </span>
                </button>
                <div style={{ padding: '0 var(--space-4) var(--space-3)', display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget({ id: v.id, nome: v.nome })}
                  >
                    <Trash2 size={14} />
                    Excluir
                  </Button>
                </div>
              </Card>
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
        <Input
          name="nome"
          label="Nome do viveiro"
          required
          value={form.nome}
          onChange={handleChange}
          placeholder="Ex: Viveiro Principal"
          error={submitted && !form.nome ? 'Insira o nome do viveiro' : undefined}
        />
        <Input
          name="densidade"
          type="number"
          step="0.1"
          label="Densidade (camarões/m²)"
          required
          value={form.densidade}
          onChange={handleChange}
          placeholder="Ex: 80"
          error={submitted && !form.densidade ? 'Insira a densidade por m²' : undefined}
        />
        <Input
          name="area"
          type="number"
          step="0.1"
          label="Área (m²)"
          required
          value={form.area}
          onChange={handleChange}
          placeholder="Ex: 2000"
          error={submitted && !form.area ? 'Insira a área em m²' : undefined}
        />
        <Input
          name="data_inicio_ciclo"
          type="date"
          label="Data início do ciclo"
          required
          value={form.data_inicio_ciclo}
          onChange={handleChange}
          error={submitted && !form.data_inicio_ciclo ? 'Insira a data de início' : undefined}
        />
        <Select
          name="status"
          label="Status"
          value={form.status}
          onChange={handleChange}
          options={[
            { value: 'ativo', label: 'Ativo' },
            { value: 'inativo', label: 'Inativo' },
            { value: 'manutencao', label: 'Manutenção' },
          ]}
        />
      </Modal>

      <DsModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmar exclusão"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" onClick={confirmDelete}>Deletar</Button>
          </>
        }
      >
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Tem certeza que deseja deletar o viveiro <strong>"{deleteTarget?.nome}"</strong>?
          Esta ação apaga também os dados de ração, medições e mortalidade relacionados.
        </p>
      </DsModal>
    </div>
  )
}

export default Home
