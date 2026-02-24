import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ViveiroDTO, calcularDOC } from '../models/types'

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

  const doc = calcularDOC(viveiro.dataInicioCiclo)

  const menuItems = [
    { label: 'Dashboard', icon: 'estrategia.svg', route: 'dashboard', desc: 'KPIs e indicadores do ciclo' },
    { label: 'Racao', icon: 'planilha.svg', route: 'racao', desc: 'Controle alimentar e FCR' },
    { label: 'Qualidade da Agua', icon: 'calculadora2.svg', route: 'anotacoes', desc: 'Medicoes e alertas' },
    { label: 'Mortalidade', icon: 'shrimp.png', route: 'mortalidade', desc: 'Registro e sobrevivencia' },
    { label: 'Ciclo de Cultivo', icon: 'estrategia.svg', route: 'ciclo', desc: 'DOC, biomassa e despesca' },
    { label: 'Aeradores', icon: 'fan.svg', route: 'aeradores', desc: 'Controle de aeracao' },
  ]

  return (
    <div className="container fade-in">
      <div className="viveiro-detail-header">
        <div className="viveiro-detail-title">
          <h2>Viveiro {viveiro.id}</h2>
          <span className="viveiro-detail-sub">
            {viveiro.proprietario} &mdash; {viveiro.laboratorio}
          </span>
        </div>
        <div className="viveiro-detail-doc">
          <span className="doc-number">{doc}</span>
          <span className="doc-label">DOC</span>
        </div>
      </div>

      <div className="viveiro-quick-stats">
        <div className="quick-stat">
          <span className="quick-stat-value">{((viveiro.densidade ?? 0) * 1000).toLocaleString('pt-BR')}</span>
          <span className="quick-stat-label">Larvas</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-value">{viveiro.pesoMedioAtual ?? 0}g</span>
          <span className="quick-stat-label">Peso Medio</span>
        </div>
      </div>

      <nav className="nav-grid-v2">
        {menuItems.map((item) => (
          <div
            key={item.route}
            className="nav-card-v2"
            onClick={() => navigate(`/viveiro/${id}/${item.route}`)}
          >
            <div className="nav-card-icon">
              <img src={`/img/${item.icon}`} alt={item.label} />
            </div>
            <div className="nav-card-text">
              <span className="nav-card-title">{item.label}</span>
              <span className="nav-card-desc">{item.desc}</span>
            </div>
          </div>
        ))}
      </nav>
    </div>
  )
}

export default Viveiro
