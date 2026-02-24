import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ViveiroDTO } from '../models/types'

function Viveiro() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [viveiro, setViveiro] = useState<ViveiroDTO | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('viveiro')
    if (stored) {
      setViveiro(JSON.parse(stored))
    }
  }, [])

  if (!viveiro) {
    return (
      <div className="container">
        <div className="card text-center">Carregando...</div>
      </div>
    )
  }

  const menuItems = [
    { label: 'Dashboard & Relatorios', icon: 'estrategia.svg', route: 'feedbacks' },
    { label: 'Controle de Racao', icon: 'planilha.svg', route: 'racao' },
    { label: 'Cameras', icon: 'cam.svg', route: 'cameras' },
    { label: 'Medicoes', icon: 'calculadora2.svg', route: 'anotacoes' },
    { label: 'Aeradores', icon: 'fan.svg', route: 'aeradores' },
  ]

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">
          Viveiro {viveiro.id}
        </div>
        <p className="viveiro-subtitle">
          {viveiro.densidade} mil larvas &mdash; {viveiro.proprietario}
        </p>

        <nav className="nav-grid">
          {menuItems.map((item) => (
            <div
              key={item.route}
              className="nav-card"
              onClick={() => navigate(`/viveiro/${id}/${item.route}`)}
            >
              <img src={`/img/${item.icon}`} alt={item.label} />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default Viveiro
