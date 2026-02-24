import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { Medicao } from '../models/types'

const initialMedicoes: Medicao[] = [
  { id: 1, data: '2021-03-01', oxigenio: 22, ph: 22, temperatura: 22, alcalinidade: 22, dureza: 22, transparencia: 22 },
  { id: 2, data: '2021-03-01', oxigenio: 22, ph: 22, temperatura: 22, alcalinidade: 22, dureza: 22, transparencia: 22 },
  { id: 3, data: '2021-03-01', oxigenio: 22, ph: 22, temperatura: 22, alcalinidade: 22, dureza: 22, transparencia: 22 },
  { id: 4, data: '2021-03-01', oxigenio: 22, ph: 22, temperatura: 22, alcalinidade: 22, dureza: 22, transparencia: 22 },
  { id: 5, data: '2021-03-01', oxigenio: 22, ph: 22, temperatura: 22, alcalinidade: 22, dureza: 22, transparencia: 22 },
]

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function Anotacoes() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [medicoes, setMedicoes] = useState<Medicao[]>(initialMedicoes)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    data: '', oxigenio: '', ph: '', temperatura: '',
    alcalinidade: '', dureza: '', transparencia: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    setSubmitted(true)
    const allFilled = Object.values(form).every((v) => v !== '')
    if (!allFilled) return

    const newItem: Medicao = {
      id: medicoes.length + 1,
      data: form.data,
      oxigenio: Number(form.oxigenio),
      ph: Number(form.ph),
      temperatura: Number(form.temperatura),
      alcalinidade: Number(form.alcalinidade),
      dureza: Number(form.dureza),
      transparencia: Number(form.transparencia),
    }
    setMedicoes([...medicoes, newItem])
    setModalOpen(false)
    setSubmitted(false)
    setForm({ data: '', oxigenio: '', ph: '', temperatura: '', alcalinidade: '', dureza: '', transparencia: '' })
  }

  const removerColeta = (itemId: number) => {
    setMedicoes(medicoes.filter((m) => m.id !== itemId))
  }

  const fields = [
    { name: 'data', label: 'Data', type: 'date', error: 'Insira uma data' },
    { name: 'oxigenio', label: 'O2 (ppm)', type: 'number', error: 'Insira a coleta do Oxigenio' },
    { name: 'ph', label: 'pH (ppm)', type: 'number', error: 'Insira a coleta do pH' },
    { name: 'temperatura', label: 'Temperatura (C)', type: 'number', error: 'Insira a temperatura' },
    { name: 'alcalinidade', label: 'Alcalinidade (ppm)', type: 'number', error: 'Insira a alcalinidade' },
    { name: 'dureza', label: 'Dureza (ppm)', type: 'number', error: 'Insira a dureza' },
    { name: 'transparencia', label: 'Transparencia (cm)', type: 'number', error: 'Insira a transparencia' },
  ]

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">Medicoes - Viveiro {viveiroId}</div>

        <div className="flex-between mb-2">
          <span>{medicoes.length} medicao(oes)</span>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            + Inserir Coleta
          </button>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>O2</th>
                <th>pH</th>
                <th>Temp</th>
                <th>Alc</th>
                <th>Dur</th>
                <th>Transp</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {medicoes.map((m) => (
                <tr key={m.id}>
                  <td>{formatDate(m.data)}</td>
                  <td>{m.oxigenio}</td>
                  <td>{m.ph}</td>
                  <td>{m.temperatura}°C</td>
                  <td>{m.alcalinidade}</td>
                  <td>{m.dureza}</td>
                  <td>{m.transparencia}cm</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => removerColeta(m.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title="Inserir nova coleta"
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
