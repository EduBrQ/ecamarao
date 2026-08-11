import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react'
import { Card, StatTile, Badge, Button, Input, Alert, EmptyState, Spinner } from '@edubrq/design-system'
import Modal from '../components/Modal'
import { backendApi, getErrorMessage, Medicao } from '../services/backendApi'
import { gerarAlertas, RANGES_IDEAIS, ParametroAgua } from '../models/types'

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function paramVariant(param: ParametroAgua, valor: number): string {
  const range = RANGES_IDEAIS[param]
  if (valor >= range.min && valor <= range.max) return 'stat-tile-good'
  const margin = (range.max - range.min) * 0.15
  if (valor < range.min - margin || valor > range.max + margin) return 'stat-tile-critical'
  return 'stat-tile-warning'
}

const PARAMS: ParametroAgua[] = ['ph', 'oxigenio', 'temperatura', 'alcalinidade', 'transparencia', 'salinidade']

function Anotacoes() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [medicoes, setMedicoes] = useState<Medicao[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [form, setForm] = useState({
    data: '', oxigenio: '', ph: '', temperatura: '',
    alcalinidade: '', transparencia: '', salinidade: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMedicoes = async () => {
      if (!viveiroId) return
      try {
        setLoading(true)
        setError(null)
        setMedicoes(await backendApi.getMedicoes(viveiroId))
      } catch (err) {
        console.error('Erro ao carregar medições:', err)
        setError('Erro ao carregar medições do viveiro')
      } finally {
        setLoading(false)
      }
    }
    loadMedicoes()
  }, [viveiroId])

  if (loading) {
    return <div className="page fade-in"><Card className="text-center"><Spinner /> Carregando medições...</Card></div>
  }
  if (error) {
    return <div className="page fade-in"><Alert tone="danger">{error}</Alert></div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSubmitted(true)
    const allFilled = Object.values(form).every((v) => v !== '')
    if (!allFilled) return
    try {
      await backendApi.createMedicao(viveiroId!, {
        data: form.data,
        oxigenio: Number(form.oxigenio),
        ph: Number(form.ph),
        temperatura: Number(form.temperatura),
        alcalinidade: Number(form.alcalinidade),
        transparencia: Number(form.transparencia),
        salinidade: Number(form.salinidade),
      })
      setMedicoes(await backendApi.getMedicoes(viveiroId!))
      setModalOpen(false)
      setSubmitted(false)
      setForm({ data: '', oxigenio: '', ph: '', temperatura: '', alcalinidade: '', transparencia: '', salinidade: '' })
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar medição'))
    }
  }

  const removerMedicao = async (itemId: number) => {
    try {
      await backendApi.deleteMedicao(viveiroId!, itemId.toString())
      setMedicoes(await backendApi.getMedicoes(viveiroId!))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao deletar medição'))
    }
  }

  const fields = [
    { name: 'data', label: 'Data', type: 'date', error: 'Insira uma data' },
    { name: 'oxigenio', label: 'O2 (mg/L)', type: 'number', error: 'Insira o oxigênio dissolvido' },
    { name: 'ph', label: 'pH', type: 'number', error: 'Insira o pH' },
    { name: 'temperatura', label: 'Temperatura (°C)', type: 'number', error: 'Insira a temperatura' },
    { name: 'alcalinidade', label: 'Alcalinidade (ppm)', type: 'number', error: 'Insira a alcalinidade' },
    { name: 'transparencia', label: 'Transparência (cm)', type: 'number', error: 'Insira a transparência' },
    { name: 'salinidade', label: 'Salinidade (ppt)', type: 'number', error: 'Insira a salinidade' },
  ]

  const ultimaMedicao = medicoes.length > 0 ? medicoes[medicoes.length - 1] : null
  const alertas = ultimaMedicao ? gerarAlertas(ultimaMedicao) : []

  return (
    <div className="page fade-in">
      {alertas.length > 0 && (
        <Card>
          <h3 className="section-title">Alertas de qualidade</h3>
          <div className="alert-list">
            {alertas.map((alerta, i) => (
              <Alert
                key={i}
                tone={alerta.condicao.startsWith('critico') ? 'danger' : 'warning'}
                icon={<AlertTriangle size={16} />}
                title={alerta.mensagem}
              >
                {alerta.manejo}
              </Alert>
            ))}
          </div>
        </Card>
      )}

      {alertas.length === 0 && ultimaMedicao && (
        <Card>
          <Alert tone="success" icon={<CheckCircle2 size={20} />}>Todos os parâmetros dentro da faixa ideal</Alert>
        </Card>
      )}

      <Card>
        <h3 className="section-title">Faixas ideais</h3>
        <div className="stat-grid">
          {PARAMS.map((param) => {
            const range = RANGES_IDEAIS[param]
            return (
              <StatTile key={param} label={range.label} value={`${range.min}-${range.max}${range.unit}`} />
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="card-row">
          <h3 className="section-title">Medições ({medicoes.length})</h3>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Nova medição
          </Button>
        </div>

        {medicoes.length === 0 ? (
          <EmptyState title="Nenhuma medição registrada ainda." />
        ) : (
          <div className="nav-list">
            {medicoes.slice().reverse().map((m) => {
              const mAlertas = gerarAlertas(m)
              const isExpanded = expandedId === m.id
              return (
                <Card key={m.id} style={{ padding: 0 }}>
                  <button
                    className="nav-item"
                    style={{ border: 'none', flexWrap: 'wrap' }}
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  >
                    <span className="nav-item-text">
                      <span className="card-row">
                        <span className="nav-item-title">{formatDate(m.data)}</span>
                        {mAlertas.length > 0 && <Badge tone="warning">{mAlertas.length} alerta(s)</Badge>}
                      </span>
                      <span className="nav-item-desc">pH {m.ph} &middot; O2 {m.oxigenio} &middot; {m.temperatura}°C</span>
                    </span>
                  </button>

                  {isExpanded && (
                    <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
                      <div className="stat-grid">
                        {PARAMS.map((param) => {
                          const range = RANGES_IDEAIS[param]
                          const valor = m[param] as number
                          return (
                            <StatTile key={param} className={paramVariant(param, valor)} label={range.label} value={valor} unit={range.unit} />
                          )
                        })}
                      </div>
                      {mAlertas.length > 0 && (
                        <div className="alert-list" style={{ marginTop: 'var(--space-3)' }}>
                          {mAlertas.map((a, i) => (
                            <Alert
                              key={i}
                              tone={a.condicao.startsWith('critico') ? 'danger' : 'warning'}
                              icon={<AlertTriangle size={16} />}
                              title={a.mensagem}
                            >
                              {a.manejo}
                            </Alert>
                          ))}
                        </div>
                      )}
                      <Button variant="danger" size="sm" style={{ marginTop: 'var(--space-3)' }} onClick={() => removerMedicao(m.id)}>
                        <Trash2 size={14} /> Excluir medição
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </Card>

      <Modal
        title="Nova medição"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        {fields.map((f) => (
          <Input
            key={f.name}
            name={f.name}
            type={f.type}
            step={f.type === 'number' ? '0.1' : undefined}
            label={f.label}
            required
            value={form[f.name as keyof typeof form]}
            onChange={handleChange}
            error={submitted && !form[f.name as keyof typeof form] ? f.error : undefined}
          />
        ))}
      </Modal>
    </div>
  )
}

export default Anotacoes
