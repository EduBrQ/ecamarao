import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { backendApi, Medicao } from '../services/backendApi'
import { gerarAlertas, RANGES_IDEAIS, ParametroAgua } from '../models/types'

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function getParamColor(param: ParametroAgua, valor: number): string {
  const range = RANGES_IDEAIS[param]
  if (valor >= range.min && valor <= range.max) return 'var(--success)'
  const margin = (range.max - range.min) * 0.15
  if (valor < range.min - margin || valor > range.max + margin) return 'var(--danger)'
  return 'var(--warning)'
}

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

  // Carregar dados do backend
  useEffect(() => {
    const loadMedicoes = async () => {
      if (!viveiroId) return
      
      try {
        setLoading(true)
        setError(null)
        const medicoesData = await backendApi.getMedicoes(viveiroId)
        setMedicoes(medicoesData)
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
    return (
      <div className="container fade-in">
        <div className="card text-center">Carregando medições...</div>
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
        salinidade: Number(form.salinidade)
      })
      
      // Recarregar lista
      const updatedMedicoes = await backendApi.getMedicoes(viveiroId!)
      setMedicoes(updatedMedicoes)
      
      setModalOpen(false)
      setSubmitted(false)
      setForm({ data: '', oxigenio: '', ph: '', temperatura: '', alcalinidade: '', transparencia: '', salinidade: '' })
    } catch (err) {
      console.error('Erro ao salvar medição:', err)
      setError('Erro ao salvar medição')
    }
  }

  const removerMedicao = async (itemId: number) => {
    try {
      await backendApi.deleteMedicao(viveiroId!, itemId.toString())
      
      // Recarregar lista
      const updatedMedicoes = await backendApi.getMedicoes(viveiroId!)
      setMedicoes(updatedMedicoes)
    } catch (err) {
      console.error('Erro ao deletar medição:', err)
      setError('Erro ao deletar medição')
    }
  }

  const fields = [
    { name: 'data', label: 'Data', type: 'date', error: 'Insira uma data' },
    { name: 'oxigenio', label: 'O2 (mg/L)', type: 'number', error: 'Insira o oxigenio dissolvido' },
    { name: 'ph', label: 'pH', type: 'number', error: 'Insira o pH' },
    { name: 'temperatura', label: 'Temperatura (C)', type: 'number', error: 'Insira a temperatura' },
    { name: 'alcalinidade', label: 'Alcalinidade (ppm)', type: 'number', error: 'Insira a alcalinidade' },
    { name: 'transparencia', label: 'Transparencia (cm)', type: 'number', error: 'Insira a transparencia' },
    { name: 'salinidade', label: 'Salinidade (ppt)', type: 'number', error: 'Insira a salinidade' },
  ]

  // Last measurement alerts
  const ultimaMedicao = medicoes.length > 0 ? medicoes[medicoes.length - 1] : null
  const alertas = ultimaMedicao ? gerarAlertas(ultimaMedicao) : []

  return (
    <div className="container fade-in">
      {/* Alert Banner */}
      {alertas.length > 0 && (
        <div className="card alert-banner">
          <h3 className="card-title">Alertas de Qualidade</h3>
          <div className="alert-list">
            {alertas.map((alerta, i) => (
              <div key={i} className={`alert-item alert-${alerta.condicao.startsWith('critico') ? 'critical' : 'warning'}`}>
                <div className="alert-msg">{alerta.mensagem}</div>
                <div className="alert-manejo">{alerta.manejo}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {alertas.length === 0 && ultimaMedicao && (
        <div className="card">
          <div className="empty-state success-state">
            Todos os parametros dentro da faixa ideal
          </div>
        </div>
      )}

      {/* Ideal Ranges Reference */}
      <div className="card">
        <h3 className="card-title">Faixas Ideais</h3>
        <div className="ranges-grid">
          {(['ph', 'oxigenio', 'temperatura', 'alcalinidade', 'transparencia', 'salinidade'] as ParametroAgua[]).map((param) => {
            const range = RANGES_IDEAIS[param]
            return (
              <div key={param} className="range-chip">
                <span className="range-chip-label">{range.label}</span>
                <span className="range-chip-value">{range.min}-{range.max}{range.unit}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Measurements */}
      <div className="card">
        <div className="card-header-accent">Medicoes - Viveiro {viveiroId}</div>

        <div className="flex-between mb-2">
          <span>{medicoes.length} medicao(oes)</span>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            + Nova Medicao
          </button>
        </div>

        <div className="medicao-list">
          {medicoes.slice().reverse().map((m) => {
            const mAlertas = gerarAlertas(m)
            const isExpanded = expandedId === m.id
            return (
              <div key={m.id} className={`medicao-card ${mAlertas.length > 0 ? 'medicao-has-alerts' : 'medicao-ok'}`}>
                <div className="medicao-header" onClick={() => setExpandedId(isExpanded ? null : m.id)}>
                  <div className="medicao-date">
                    <span className="medicao-date-text">{formatDate(m.data)}</span>
                    {mAlertas.length > 0 && (
                      <span className="medicao-alert-count">{mAlertas.length} alerta(s)</span>
                    )}
                  </div>
                  <div className="medicao-params-mini">
                    <span style={{ color: getParamColor('ph', m.ph) }}>pH {m.ph}</span>
                    <span style={{ color: getParamColor('oxigenio', m.oxigenio) }}>O2 {m.oxigenio}</span>
                    <span style={{ color: getParamColor('temperatura', m.temperatura) }}>{m.temperatura}°C</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="medicao-details">
                    <div className="medicao-params-full">
                      {(['ph', 'oxigenio', 'temperatura', 'alcalinidade', 'transparencia', 'salinidade'] as ParametroAgua[]).map((param) => {
                        const range = RANGES_IDEAIS[param]
                        const valor = m[param] as number
                        return (
                          <div key={param} className="medicao-param" style={{ borderLeftColor: getParamColor(param, valor) }}>
                            <span className="medicao-param-label">{range.label}</span>
                            <span className="medicao-param-value" style={{ color: getParamColor(param, valor) }}>
                              {valor}{range.unit}
                            </span>
                            <span className="medicao-param-range">Ideal: {range.min}-{range.max}</span>
                          </div>
                        )
                      })}
                    </div>
                    {mAlertas.length > 0 && (
                      <div className="medicao-alerts-detail">
                        {mAlertas.map((a, i) => (
                          <div key={i} className={`alert-item alert-${a.condicao.startsWith('critico') ? 'critical' : 'warning'}`}>
                            <div className="alert-msg">{a.mensagem}</div>
                            <div className="alert-manejo">{a.manejo}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <button className="btn btn-danger btn-sm mt-1" onClick={() => removerMedicao(m.id)}>
                      Excluir Medicao
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Modal
        title="Nova Medicao"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        {fields.map((f) => (
          <div key={f.name} className="form-group">
            <label className={`form-label required ${submitted && !form[f.name as keyof typeof form] ? 'has-error' : ''}`}>
              {f.label}:
            </label>
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
