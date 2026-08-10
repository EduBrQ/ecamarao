import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Plus, Trash2, Loader2 } from 'lucide-react'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
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
    return <div className="page fade-in"><div className="card text-center"><Loader2 className="spinner" size={20} />Carregando medições...</div></div>
  }
  if (error) {
    return <div className="page fade-in"><div className="card text-center field-error">{error}</div></div>
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
        <div className="card">
          <h3 className="section-title">Alertas de qualidade</h3>
          <div className="alert-list">
            {alertas.map((alerta, i) => (
              <div key={i} className={`alert ${alerta.condicao.startsWith('critico') ? 'alert-critical' : 'alert-warning'}`}>
                <AlertTriangle className="alert-icon" size={16} />
                <div className="alert-body">
                  <strong>{alerta.mensagem}</strong>
                  <span>{alerta.manejo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alertas.length === 0 && ultimaMedicao && (
        <div className="card">
          <div className="empty-state success"><CheckCircle2 size={20} />Todos os parâmetros dentro da faixa ideal</div>
        </div>
      )}

      <div className="card">
        <h3 className="section-title">Faixas ideais</h3>
        <div className="stat-grid">
          {PARAMS.map((param) => {
            const range = RANGES_IDEAIS[param]
            return (
              <div key={param} className="stat-tile">
                <span className="stat-value" style={{ fontSize: '0.9rem' }}>{range.min}-{range.max}{range.unit}</span>
                <span className="stat-label">{range.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-row">
          <h3 className="section-title">Medições ({medicoes.length})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Nova medição
          </button>
        </div>

        {medicoes.length === 0 ? (
          <div className="empty-state">Nenhuma medição registrada ainda.</div>
        ) : (
          <div className="nav-list">
            {medicoes.slice().reverse().map((m) => {
              const mAlertas = gerarAlertas(m)
              const isExpanded = expandedId === m.id
              return (
                <div key={m.id} className="card" style={{ padding: 0 }}>
                  <button
                    className="nav-item"
                    style={{ border: 'none', flexWrap: 'wrap' }}
                    onClick={() => setExpandedId(isExpanded ? null : m.id)}
                  >
                    <span className="nav-item-text">
                      <span className="card-row">
                        <span className="nav-item-title">{formatDate(m.data)}</span>
                        {mAlertas.length > 0 && <span className="pill pill-warning">{mAlertas.length} alerta(s)</span>}
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
                            <div key={param} className={`stat-tile ${paramVariant(param, valor)}`}>
                              <span className="stat-value">{valor}<span className="stat-unit">{range.unit}</span></span>
                              <span className="stat-label">{range.label}</span>
                            </div>
                          )
                        })}
                      </div>
                      {mAlertas.length > 0 && (
                        <div className="alert-list" style={{ marginTop: 'var(--space-3)' }}>
                          {mAlertas.map((a, i) => (
                            <div key={i} className={`alert ${a.condicao.startsWith('critico') ? 'alert-critical' : 'alert-warning'}`}>
                              <AlertTriangle className="alert-icon" size={16} />
                              <div className="alert-body"><strong>{a.mensagem}</strong><span>{a.manejo}</span></div>
                            </div>
                          ))}
                        </div>
                      )}
                      <button className="btn btn-danger btn-sm" style={{ marginTop: 'var(--space-3)' }} onClick={() => removerMedicao(m.id)}>
                        <Trash2 size={14} /> Excluir medição
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        title="Nova medição"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        {fields.map((f) => (
          <div key={f.name} className="form-group">
            <label className={`form-label required ${submitted && !form[f.name as keyof typeof form] ? 'has-error' : ''}`}>{f.label}</label>
            <input
              name={f.name}
              type={f.type}
              step={f.type === 'number' ? '0.1' : undefined}
              className={`form-control ${submitted && !form[f.name as keyof typeof form] ? 'is-invalid' : ''}`}
              value={form[f.name as keyof typeof form]}
              onChange={handleChange}
            />
            <FieldError show={submitted && !form[f.name as keyof typeof form]} message={f.error} />
          </div>
        ))}
      </Modal>
    </div>
  )
}

export default Anotacoes
