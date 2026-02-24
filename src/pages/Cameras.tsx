import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import { Camera } from '../models/types'

const initialCameras: Camera[] = [
  { id: 1, ipCamera: 'http://166.165.35.32:80/mjpg/video.mjpg' },
  { id: 2, ipCamera: 'http://213.34.225.97:8080/mjpg/video.mjpg' },
]

function Cameras() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [cameras, setCameras] = useState<Camera[]>(initialCameras)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ ipCamera: '' })

  const handleSave = () => {
    setSubmitted(true)
    if (!form.ipCamera) return

    const newId = cameras.length + 1
    setCameras([...cameras, { id: newId, ipCamera: form.ipCamera }])
    setModalOpen(false)
    setSubmitted(false)
    setForm({ ipCamera: '' })
  }

  const removerCamera = (cameraId: number) => {
    setCameras(cameras.filter((c) => c.id !== cameraId))
  }

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">Cameras - Viveiro {viveiroId}</div>

        <div className="flex-between mb-2">
          <span>{cameras.length} camera(s)</span>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            + Adicionar camera
          </button>
        </div>

        <div className="camera-grid">
          {cameras.map((camera) => (
            <div key={camera.id} className="camera-card">
              <div className="camera-card-header">
                <h4>Camera {camera.id}</h4>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => removerCamera(camera.id)}
                >
                  Remover
                </button>
              </div>
              <img
                src={camera.ipCamera}
                alt={`Camera ${camera.id}`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.height = '200px'
                  target.style.background = '#f0f0f0'
                  target.alt = 'Camera offline'
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <Modal
        title="Adicionar camera"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.ipCamera ? 'has-error' : ''}`}>
            IP da camera:
          </label>
          <input
            type="text"
            className={`form-control ${submitted && !form.ipCamera ? 'is-invalid' : ''}`}
            value={form.ipCamera}
            onChange={(e) => setForm({ ipCamera: e.target.value })}
            placeholder="http://..."
          />
          <FieldError show={submitted && !form.ipCamera} message="Insira o IP da camera" />
        </div>
      </Modal>
    </div>
  )
}

export default Cameras
