import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { ViveiroDTO } from '../models/types'

const initialViveiros: ViveiroDTO[] = [
  {
    id: 1,
    tamanho: 1500,
    ipCamera: 'http://208.72.70.171:80/mjpg/video.mjpg',
    densidade: 70,
    latitude: '-7.397094',
    longitude: '-35.540758',
    laboratorio: 'AquaTec',
    proprietario: 'Erica',
    dataInicioCiclo: '15/08/2020',
  },
  {
    id: 2,
    tamanho: 1100,
    ipCamera: 'http://208.72.70.171:80/mjpg/video.mjpg',
    densidade: 50,
    latitude: '-7.392803',
    longitude: '-35.542637',
    laboratorio: 'AquaTec',
    proprietario: 'Eduardo',
    dataInicioCiclo: '15/08/2020',
  },
]

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
    const newId = viveiros.length + 1
    const newViveiro: ViveiroDTO = {
      id: newId,
      tamanho: Number(form.volume),
      densidade: Number(form.densidade),
      laboratorio: form.laboratorio,
      proprietario: form.proprietario,
      dataInicioCiclo: form.dataInicioCiclo,
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
      <div className="card">
        <div className="card-header-accent">Viveiros</div>

        <div className="viveiro-grid">
          <div className="add-btn" onClick={() => setModalOpen(true)}>
            <img src="/img/plus.svg" alt="Adicionar" />
            <span>Adicionar</span>
          </div>
          {viveiros.map((v) => (
            <div key={v.id} className="viveiro-card" onClick={() => visualizarViveiro(v)}>
              <img src="/img/planilha.svg" alt="Viveiro" />
              <span>Viveiro {v.id}</span>
            </div>
          ))}
        </div>
      </div>

      <Modal
        title="Inserir novo viveiro"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.volume ? 'has-error' : ''}`}>
            Volume do Viveiro (m3):
          </label>
          <input
            name="volume"
            type="number"
            className={`form-control ${submitted && !form.volume ? 'is-invalid' : ''}`}
            value={form.volume}
            onChange={handleChange}
          />
          <FieldError show={submitted && !form.volume} message="Insira a dimensao do viveiro" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.densidade ? 'has-error' : ''}`}>
            Quantidade de povoamento:
          </label>
          <input
            name="densidade"
            type="number"
            className={`form-control ${submitted && !form.densidade ? 'is-invalid' : ''}`}
            value={form.densidade}
            onChange={handleChange}
          />
          <FieldError show={submitted && !form.densidade} message="Insira a quantidade de larvas" />
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
            <option value="aquatec">AquaTec</option>
            <option value="tecmari">TecMari</option>
            <option value="touros">Touros</option>
          </select>
          <FieldError show={submitted && !form.laboratorio} message="Insira o laboratorio de origem" />
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
          />
          <FieldError show={submitted && !form.proprietario} message="Insira o nome do proprietario" />
        </div>

        <div className="form-group">
          <label className={`form-label required ${submitted && !form.dataInicioCiclo ? 'has-error' : ''}`}>
            Data de inicio do ciclo:
          </label>
          <input
            name="dataInicioCiclo"
            type="date"
            className={`form-control ${submitted && !form.dataInicioCiclo ? 'is-invalid' : ''}`}
            value={form.dataInicioCiclo}
            onChange={handleChange}
          />
          <FieldError show={submitted && !form.dataInicioCiclo} message="Insira a data de inicio do ciclo" />
        </div>
      </Modal>
    </div>
  )
}

export default Home
