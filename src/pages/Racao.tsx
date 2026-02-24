import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { ColetaRacao } from '../models/types'

const initialRacao: ColetaRacao[] = [
  { id: 1, data: '2020-12-12', qntManha: 5, qntTarde: 5 },
  { id: 2, data: '2020-12-12', qntManha: 5, qntTarde: 5 },
  { id: 3, data: '2020-12-12', qntManha: 7, qntTarde: 7 },
  { id: 4, data: '2020-12-12', qntManha: 7, qntTarde: 7 },
  { id: 5, data: '2020-12-12', qntManha: 8, qntTarde: 8 },
  { id: 6, data: '2020-12-12', qntManha: 8, qntTarde: 8 },
]

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function Racao() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [racao, setRacao] = useState<ColetaRacao[]>(initialRacao)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ data: '', qntManha: '', qntTarde: '' })

  const racaoTotal = racao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
  const gastoRacao = racaoTotal * 3

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    setSubmitted(true)
    if (!form.data || !form.qntManha || !form.qntTarde) return

    const newItem: ColetaRacao = {
      id: racao.length + 1,
      data: form.data,
      qntManha: Number(form.qntManha),
      qntTarde: Number(form.qntTarde),
    }
    setRacao([...racao, newItem])
    setModalOpen(false)
    setSubmitted(false)
    setForm({ data: '', qntManha: '', qntTarde: '' })
  }

  const removerColeta = (itemId: number) => {
    setRacao(racao.filter((r) => r.id !== itemId))
  }

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">Controle de Racao - Viveiro {viveiroId}</div>

        <button className="btn btn-primary mb-2" onClick={() => setModalOpen(true)}>
          + Inserir
        </button>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th className="text-right">Manha</th>
                <th className="text-right">Tarde</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {racao.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.data)}</td>
                  <td className="text-right">{r.qntManha} kg</td>
                  <td className="text-right">{r.qntTarde} kg</td>
                  <td className="text-right">
                    <button className="btn btn-danger btn-sm" onClick={() => removerColeta(r.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="summary">
          <div><strong>Total:</strong> {racaoTotal} kg</div>
          <div><strong>Gasto estimado:</strong> R$ {gastoRacao},00</div>
        </div>
      </div>

      <Modal
        title="Inserir nova coleta"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.data ? 'has-error' : ''}`}>Data:</label>
          <input
            name="data"
            type="date"
            className={`form-control ${submitted && !form.data ? 'is-invalid' : ''}`}
            value={form.data}
            onChange={handleChange}
          />
          <FieldError show={submitted && !form.data} message="Insira uma data" />
        </div>
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.qntManha ? 'has-error' : ''}`}>Manha (kg):</label>
          <input
            name="qntManha"
            type="number"
            className={`form-control ${submitted && !form.qntManha ? 'is-invalid' : ''}`}
            value={form.qntManha}
            onChange={handleChange}
          />
          <FieldError show={submitted && !form.qntManha} message="Insira uma quantidade" />
        </div>
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.qntTarde ? 'has-error' : ''}`}>Tarde (kg):</label>
          <input
            name="qntTarde"
            type="number"
            className={`form-control ${submitted && !form.qntTarde ? 'is-invalid' : ''}`}
            value={form.qntTarde}
            onChange={handleChange}
          />
          <FieldError show={submitted && !form.qntTarde} message="Insira uma quantidade" />
        </div>
      </Modal>
    </div>
  )
}

export default Racao
