import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { backendApi, Viveiro, RegistroMortalidade } from '../services/backendApi'
import { calcularSobrevivencia } from '../models/types'

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function Mortalidade() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [registros, setRegistros] = useState<RegistroMortalidade[]>([])
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ data: '', quantidade: '', causa: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar dados do backend
  useEffect(() => {
    const loadData = async () => {
      if (!viveiroId) return
      
      try {
        setLoading(true)
        setError(null)

        // Carregar dados em paralelo
        const [viveiroData, registrosData] = await Promise.all([
          backendApi.getViveiroById(viveiroId),
          backendApi.getRegistrosMortalidade(viveiroId)
        ])

        setViveiro(viveiroData)
        setRegistros(registrosData)

      } catch (err) {
        console.error('Erro ao carregar dados de mortalidade:', err)
        setError('Erro ao carregar dados do viveiro')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [viveiroId])

  if (loading) {
    return (
      <div className="container fade-in">
        <div className="card text-center">Carregando dados de mortalidade...</div>
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

  const mortalidadeTotal = registros.reduce((acc, r) => acc + r.quantidade, 0)
  const densidade = viveiro?.densidade ?? 0
  const populacaoInicial = densidade * 1000
  const sobrevivencia = calcularSobrevivencia(densidade, mortalidadeTotal)
  const vivos = populacaoInicial - mortalidadeTotal

  function getSobrevivenciaColor(val: number): string {
    if (val >= 80) return 'var(--success)'
    if (val >= 60) return 'var(--warning)'
    return 'var(--danger)'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSubmitted(true)
    if (!form.data || !form.quantidade || !form.causa) return

    try {
      await backendApi.createRegistroMortalidade(viveiroId!, {
        data: form.data,
        quantidade: Number(form.quantidade),
        causa: form.causa
      })
      
      // Recarregar lista
      const updatedRegistros = await backendApi.getRegistrosMortalidade(viveiroId!)
      setRegistros(updatedRegistros)
      
      setModalOpen(false)
      setSubmitted(false)
      setForm({ data: '', quantidade: '', causa: '' })
    } catch (err) {
      console.error('Erro ao salvar registro de mortalidade:', err)
      setError('Erro ao salvar registro de mortalidade')
    }
  }

  const removerRegistro = async (itemId: number) => {
    try {
      await backendApi.deleteRegistroMortalidade(viveiroId!, itemId.toString())
      
      // Recarregar lista
      const updatedRegistros = await backendApi.getRegistrosMortalidade(viveiroId!)
      setRegistros(updatedRegistros)
    } catch (err) {
      console.error('Erro ao deletar registro de mortalidade:', err)
      setError('Erro ao deletar registro de mortalidade')
    }
  }

  const causas = [
    'Estresse termico',
    'Baixo oxigenio',
    'Doenca (WSSV)',
    'Doenca (Vibrio)',
    'Doenca (EMS/AHPND)',
    'Predadores',
    'Qualidade da agua',
    'Manejo inadequado',
    'Causa desconhecida',
    'Outra',
  ]

  return (
    <div className="container fade-in">
      {/* Summary Card */}
      <div className="card">
        <div className="card-header-accent">Mortalidade — {viveiro.nome}</div>

        <div className="mortality-summary">
          <div className="mortality-main">
            <span className="mortality-value" style={{ color: getSobrevivenciaColor(sobrevivencia) }}>
              {sobrevivencia.toFixed(1)}%
            </span>
            <span className="mortality-label">Sobrevivencia</span>
          </div>
          <div className="mortality-details">
            <div className="mortality-detail-item">
              <span className="mortality-detail-value">{populacaoInicial.toLocaleString('pt-BR')}</span>
              <span className="mortality-detail-label">Pop. Inicial</span>
            </div>
            <div className="mortality-detail-item">
              <span className="mortality-detail-value" style={{ color: 'var(--danger)' }}>
                {mortalidadeTotal.toLocaleString('pt-BR')}
              </span>
              <span className="mortality-detail-label">Mortalidade</span>
            </div>
            <div className="mortality-detail-item">
              <span className="mortality-detail-value" style={{ color: 'var(--success)' }}>
                {vivos.toLocaleString('pt-BR')}
              </span>
              <span className="mortality-detail-label">Vivos Est.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Records */}
      <div className="card">
        <div className="flex-between mb-2">
          <h3 className="card-title" style={{ marginBottom: 0 }}>Registros</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            + Registrar
          </button>
        </div>

        {registros.length === 0 ? (
          <div className="empty-state">
            Nenhum registro de mortalidade. Isso e bom!
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th className="text-right">Qtd</th>
                  <th>Causa</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {registros.slice().reverse().map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.data)}</td>
                    <td className="text-right">{r.quantidade.toLocaleString('pt-BR')}</td>
                    <td>{r.causa}</td>
                    <td className="text-right">
                      <button className="btn btn-danger btn-sm" onClick={() => removerRegistro(r.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        title="Registrar Mortalidade"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.data ? 'has-error' : ''}`}>Data:</label>
          <input
            name="data" type="date"
            className={`form-control ${submitted && !form.data ? 'is-invalid' : ''}`}
            value={form.data} onChange={handleChange}
          />
          <FieldError show={submitted && !form.data} message="Insira a data" />
        </div>
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.quantidade ? 'has-error' : ''}`}>
            Quantidade:
          </label>
          <input
            name="quantidade" type="number"
            className={`form-control ${submitted && !form.quantidade ? 'is-invalid' : ''}`}
            value={form.quantidade} onChange={handleChange}
            placeholder="Numero de camaroes mortos"
          />
          <FieldError show={submitted && !form.quantidade} message="Insira a quantidade" />
        </div>
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.causa ? 'has-error' : ''}`}>
            Causa provavel:
          </label>
          <select
            name="causa"
            className={`form-control ${submitted && !form.causa ? 'is-invalid' : ''}`}
            value={form.causa} onChange={handleChange}
          >
            <option value="">Selecione...</option>
            {causas.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <FieldError show={submitted && !form.causa} message="Selecione a causa" />
        </div>
      </Modal>
    </div>
  )
}

export default Mortalidade
