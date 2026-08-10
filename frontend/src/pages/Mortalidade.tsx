import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { backendApi, getErrorMessage, Viveiro, RegistroMortalidade } from '../services/backendApi'
import { calcularSobrevivencia } from '../models/types'

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function sobrevivenciaVariant(val: number): string {
  if (val >= 80) return 'stat-tile-good'
  if (val >= 60) return 'stat-tile-warning'
  return 'stat-tile-critical'
}

const CAUSAS = [
  'Estresse térmico', 'Baixo oxigênio', 'Doença (WSSV)', 'Doença (Vibrio)',
  'Doença (EMS/AHPND)', 'Predadores', 'Qualidade da água', 'Manejo inadequado',
  'Causa desconhecida', 'Outra',
]

function Mortalidade() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [registros, setRegistros] = useState<RegistroMortalidade[]>([])
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ data: '', quantidade: '', causa: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!viveiroId) return
      try {
        setLoading(true)
        setError(null)
        const [viveiroData, registrosData] = await Promise.all([
          backendApi.getViveiroById(viveiroId),
          backendApi.getRegistrosMortalidade(viveiroId),
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
    return <div className="page fade-in"><div className="card text-center"><Loader2 className="spinner" size={20} />Carregando dados de mortalidade...</div></div>
  }
  if (error) {
    return <div className="page fade-in"><div className="card text-center field-error">{error}</div></div>
  }
  if (!viveiro) {
    return <div className="page fade-in"><div className="card text-center">Viveiro não encontrado</div></div>
  }

  const mortalidadeTotal = registros.reduce((acc, r) => acc + r.quantidade, 0)
  const densidade = viveiro?.densidade ?? 0
  const area = viveiro?.area ?? 0
  const populacaoInicial = densidade * area
  const sobrevivencia = calcularSobrevivencia(densidade, area, mortalidadeTotal)
  const vivos = populacaoInicial - mortalidadeTotal

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
        causa: form.causa,
      })
      setRegistros(await backendApi.getRegistrosMortalidade(viveiroId!))
      setModalOpen(false)
      setSubmitted(false)
      setForm({ data: '', quantidade: '', causa: '' })
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar registro de mortalidade'))
    }
  }

  const removerRegistro = async (itemId: number) => {
    try {
      await backendApi.deleteRegistroMortalidade(viveiroId!, itemId.toString())
      setRegistros(await backendApi.getRegistrosMortalidade(viveiroId!))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao deletar registro de mortalidade'))
    }
  }

  return (
    <div className="page fade-in">
      <div className="card">
        <h2 className="section-title">Mortalidade &mdash; {viveiro.nome}</h2>
        <div className="stat-grid">
          <div className={`stat-tile ${sobrevivenciaVariant(sobrevivencia)}`}>
            <span className="stat-value">{sobrevivencia.toFixed(1)}<span className="stat-unit">%</span></span>
            <span className="stat-label">Sobrevivência</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{populacaoInicial.toLocaleString('pt-BR')}</span>
            <span className="stat-label">Pop. inicial</span>
          </div>
          <div className="stat-tile stat-tile-critical">
            <span className="stat-value">{mortalidadeTotal.toLocaleString('pt-BR')}</span>
            <span className="stat-label">Mortalidade</span>
          </div>
          <div className="stat-tile stat-tile-good">
            <span className="stat-value">{vivos.toLocaleString('pt-BR')}</span>
            <span className="stat-label">Vivos est.</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-row">
          <h3 className="section-title">Registros</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Registrar
          </button>
        </div>

        {registros.length === 0 ? (
          <div className="empty-state success">Nenhum registro de mortalidade. Isso é bom!</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr><th>Data</th><th className="num">Qtd</th><th>Causa</th><th></th></tr>
              </thead>
              <tbody>
                {registros.slice().reverse().map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.data)}</td>
                    <td className="num">{r.quantidade.toLocaleString('pt-BR')}</td>
                    <td>{r.causa}</td>
                    <td className="num">
                      <button className="btn btn-ghost btn-sm" onClick={() => removerRegistro(r.id)}>
                        <Trash2 size={14} />
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
        title="Registrar mortalidade"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.data ? 'has-error' : ''}`}>Data</label>
          <input name="data" type="date" className={`form-control ${submitted && !form.data ? 'is-invalid' : ''}`} value={form.data} onChange={handleChange} />
          <FieldError show={submitted && !form.data} message="Insira a data" />
        </div>
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.quantidade ? 'has-error' : ''}`}>Quantidade</label>
          <input
            name="quantidade" type="number"
            className={`form-control ${submitted && !form.quantidade ? 'is-invalid' : ''}`}
            value={form.quantidade} onChange={handleChange}
            placeholder="Número de camarões mortos"
          />
          <FieldError show={submitted && !form.quantidade} message="Insira a quantidade" />
        </div>
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.causa ? 'has-error' : ''}`}>Causa provável</label>
          <select name="causa" className={`form-control ${submitted && !form.causa ? 'is-invalid' : ''}`} value={form.causa} onChange={handleChange}>
            <option value="">Selecione...</option>
            {CAUSAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <FieldError show={submitted && !form.causa} message="Selecione a causa" />
        </div>
      </Modal>
    </div>
  )
}

export default Mortalidade
