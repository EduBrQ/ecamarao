import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { AeradorDTO } from '../models/types'

const initialAeradores: AeradorDTO[] = [
  { id: 1, nome: 'Aerador - 1', status: false },
  { id: 2, nome: 'Aerador - 2', status: true },
  { id: 3, nome: 'Aerador - 3', status: false },
]

function Aeradores() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [aeradores, setAeradores] = useState<AeradorDTO[]>(initialAeradores)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const toggleAerador = (aerador: AeradorDTO) => {
    setLoadingId(aerador.id)
    setTimeout(() => {
      setAeradores((prev) =>
        prev.map((a) => (a.id === aerador.id ? { ...a, status: !a.status } : a))
      )
      setLoadingId(null)
    }, 3000)
  }

  const adicionarAerador = () => {
    const newId = aeradores.length + 1
    setAeradores([...aeradores, { id: newId, nome: `Aerador - ${newId}`, status: false }])
  }

  const removerAerador = (aeradorId: number) => {
    setAeradores(aeradores.filter((a) => a.id !== aeradorId))
  }

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">Aeradores - Viveiro {viveiroId}</div>

        <div className="flex-between mb-2">
          <span>{aeradores.length} aerador(es)</span>
          <button className="btn btn-primary btn-sm" onClick={adicionarAerador}>
            + Adicionar
          </button>
        </div>

        <div className="aerador-grid">
          {aeradores.map((aerador) => (
            <div key={aerador.id} className="aerador-card">
              <div className="aerador-card-header">
                <h4>Aerador {aerador.id}</h4>
                <button
                  className="aerador-remove"
                  onClick={() => removerAerador(aerador.id)}
                  aria-label="Remover aerador"
                >
                  &times;
                </button>
              </div>

              <button
                className={`aerador-toggle ${aerador.status ? 'on' : 'off'}`}
                onClick={() => toggleAerador(aerador)}
                disabled={loadingId === aerador.id}
              >
                <img
                  src={`/img/${aerador.status}.svg`}
                  alt={aerador.status ? 'Ligado' : 'Desligado'}
                />
                <span>{aerador.status ? 'Ligado' : 'Desligado'}</span>
              </button>

              {loadingId === aerador.id && <div className="spinner" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Aeradores
