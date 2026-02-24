import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { ViveiroDTO, calcularDOC } from '../models/types'

const initialViveiros: ViveiroDTO[] = [
  {
    id: 1,
    tamanho: 1500,
    densidade: 70,
    laboratorio: 'AquaTec',
    proprietario: 'Erica',
    dataInicioCiclo: '2025-08-15',
    pesoMedioAtual: 12,
    precoRacaoKg: 3,
  },
  {
    id: 2,
    tamanho: 1100,
    densidade: 50,
    laboratorio: 'AquaTec',
    proprietario: 'Eduardo',
    dataInicioCiclo: '2025-09-01',
    pesoMedioAtual: 9,
    precoRacaoKg: 3,
  },
]

function getStatusColor(doc: number): string {
  if (doc === 0) return 'var(--text-light)'
  if (doc < 30) return 'var(--info)'
  if (doc < 90) return 'var(--success)'
  if (doc < 120) return 'var(--warning)'
  return 'var(--danger)'
}

function getStatusLabel(doc: number): string {
  if (doc === 0) return 'Sem ciclo'
  if (doc < 30) return 'Inicio'
  if (doc < 90) return 'Crescimento'
  if (doc < 120) return 'Engorda'
  return 'Despesca'
}

function Home() {
  const navigate = useNavigate()
  const [viveiros, setViveiros] = useState<ViveiroDTO[]>(initialViveiros)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    volume: '',
    densidade: '',
    laboratorio: '',
    proprietario: '',
    dataInicioCiclo: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    setSubmitted(true)
    if (!form.volume || !form.densidade || !form.laboratorio || !form.proprietario || !form.dataInicioCiclo) {
      return
    }
    const newId = viveiros.length > 0 ? Math.max(...viveiros.map(v => v.id)) + 1 : 1
    const newViveiro: ViveiroDTO = {
      id: newId,
      tamanho: Number(form.volume),
      densidade: Number(form.densidade),
      laboratorio: form.laboratorio,
      proprietario: form.proprietario,
      dataInicioCiclo: form.dataInicioCiclo,
      pesoMedioAtual: 0,
      precoRacaoKg: 3,
    }
    setViveiros([...viveiros, newViveiro])
    setModalOpen(false)
    setSubmitted(false)
    setForm({ volume: '', densidade: '', laboratorio: '', proprietario: '', dataInicioCiclo: '' })
  }

  const visualizarViveiro = (viveiro: ViveiroDTO) => {
    localStorage.setItem('viveiro', JSON.stringify(viveiro))
    navigate(`/viveiro/${viveiro.id}`)
  }

  return (
    <div className="container fade-in">
      <div className="home-header">
        <h2 className="page-title">Meus Viveiros</h2>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Novo Viveiro
        </button>
      </div>

      <div className="viveiro-list">
        {viveiros.map((v) => {
          const doc = calcularDOC(v.dataInicioCiclo)
          const statusColor = getStatusColor(doc)
          const statusLabel = getStatusLabel(doc)
          const populacao = (v.densidade ?? 0) * 1000

          return (
            <div key={v.id} className="viveiro-status-card" onClick={() => visualizarViveiro(v)}>
              <div className="viveiro-status-header">
                <div className="viveiro-status-title">
                  <span className="viveiro-status-dot" style={{ background: statusColor }} />
                  <h3>Viveiro {v.id}</h3>
                </div>
                <span className="viveiro-status-badge" style={{ background: statusColor }}>
                  {statusLabel}
                </span>
              </div>

              <div className="viveiro-status-info">
                <span className="viveiro-owner">{v.proprietario} &mdash; {v.laboratorio}</span>
              </div>

              <div className="viveiro-kpi-row">
                <div className="viveiro-kpi">
                  <span className="viveiro-kpi-value">{doc}</span>
                  <span className="viveiro-kpi-label">DOC</span>
                </div>
                <div className="viveiro-kpi">
                  <span className="viveiro-kpi-value">{populacao.toLocaleString('pt-BR')}</span>
                  <span className="viveiro-kpi-label">Larvas</span>
                </div>
                <div className="viveiro-kpi">
                  <span className="viveiro-kpi-value">{v.tamanho ?? '-'}</span>
                  <span className="viveiro-kpi-label">m3</span>
                </div>
                <div className="viveiro-kpi">
                  <span className="viveiro-kpi-value">{v.pesoMedioAtual ?? 0}g</span>
                  <span className="viveiro-kpi-label">Peso Med.</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        title="Novo Viveiro"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.volume ? 'has-error' : ''}`}>
            Volume (m3):
          </label>
          <input
            name="volume"
            type="number"
            className={`form-control ${submitted && !form.volume ? 'is-invalid' : ''}`}
            value={form.volume}
            onChange={handleChange}
            placeholder="Ex: 1500"
          />
          <FieldError show={submitted && !form.volume} message="Insira a dimensao do viveiro" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.densidade ? 'has-error' : ''}`}>
            Povoamento (milheiros):
          </label>
          <input
            name="densidade"
            type="number"
            className={`form-control ${submitted && !form.densidade ? 'is-invalid' : ''}`}
            value={form.densidade}
            onChange={handleChange}
            placeholder="Ex: 70 (= 70.000 larvas)"
          />
          <FieldError show={submitted && !form.densidade} message="Insira a quantidade em milheiros" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.laboratorio ? 'has-error' : ''}`}>
            Laboratorio:
          </label>
          <select
            name="laboratorio"
            className={`form-control ${submitted && !form.laboratorio ? 'is-invalid' : ''}`}
            value={form.laboratorio}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            <option value="AquaTec">AquaTec</option>
            <option value="TecMari">TecMari</option>
            <option value="Touros">Touros</option>
          </select>
          <FieldError show={submitted && !form.laboratorio} message="Selecione o laboratorio" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.proprietario ? 'has-error' : ''}`}>
            Proprietario:
          </label>
          <input
            name="proprietario"
            type="text"
            className={`form-control ${submitted && !form.proprietario ? 'is-invalid' : ''}`}
            value={form.proprietario}
            onChange={handleChange}
            placeholder="Nome do proprietario"
          />
          <FieldError show={submitted && !form.proprietario} message="Insira o nome do proprietario" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.dataInicioCiclo ? 'has-error' : ''}`}>
            Data inicio do ciclo:
          </label>
          <input
            name="dataInicioCiclo"
            type="date"
            className={`form-control ${submitted && !form.dataInicioCiclo ? 'is-invalid' : ''}`}
            value={form.dataInicioCiclo}
            onChange={handleChange}
          />
          <FieldError show={submitted && !form.dataInicioCiclo} message="Insira a data de inicio" />
        </div>
      </Modal>
    </div>
  )
}

export default Home
