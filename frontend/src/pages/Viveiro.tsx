import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Wheat, Droplets, Skull, Fan, ChevronRight, Download } from 'lucide-react'
import { Card, StatTile, IconButton, Spinner, Alert, EmptyState } from '@edubrq/design-system'
import { calcularDOC, calcularSobrevivencia, calcularPopulacaoInicial } from '../models/types'
import { backendApi, type Viveiro } from '../services/backendApi'

const MENU_ITEMS = [
  { label: 'Visão Geral', icon: LayoutDashboard, route: 'visao-geral', desc: 'DOC, biomassa, FCR e fase do ciclo' },
  { label: 'Ração', icon: Wheat, route: 'racao', desc: 'Controle alimentar e recomendação diária' },
  { label: 'Qualidade da Água', icon: Droplets, route: 'anotacoes', desc: 'Medições e alertas' },
  { label: 'Mortalidade', icon: Skull, route: 'mortalidade', desc: 'Registro e sobrevivência' },
  { label: 'Aeradores', icon: Fan, route: 'aeradores', desc: 'Controle de aeração' },
]

function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function VivieroPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadViveiro = async () => {
      if (!id) return
      try {
        setLoading(true)
        setError(null)
        setViveiro(await backendApi.getViveiroById(id))
      } catch (err) {
        console.error('Erro ao carregar viveiro:', err)
        setError('Erro ao carregar dados do viveiro')
      } finally {
        setLoading(false)
      }
    }
    loadViveiro()
  }, [id])

  if (loading) {
    return (
      <div className="page fade-in">
        <Card className="text-center"><Spinner /> Carregando dados do viveiro...</Card>
      </div>
    )
  }
  if (error) {
    return <div className="page fade-in"><Alert tone="danger">{error}</Alert></div>
  }
  if (!viveiro) {
    return <div className="page fade-in"><EmptyState title="Viveiro não encontrado" /></div>
  }

  const doc = calcularDOC(viveiro.data_inicio_ciclo)

  const handleExport = async (route: string) => {
    if (!id) return
    try {
      switch (route) {
        case 'visao-geral': {
          const [racaoData, mortalidadeData] = await Promise.all([
            backendApi.getColetasRacao(id),
            backendApi.getRegistrosMortalidade(id),
          ])
          const racaoTotal = racaoData.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
          const mortTotal = mortalidadeData.reduce((acc, m) => acc + m.quantidade, 0)
          const populacaoInicial = calcularPopulacaoInicial(viveiro.densidade ?? 0, viveiro.area ?? 0)
          const vivos = populacaoInicial - mortTotal
          const sobrevivencia = calcularSobrevivencia(viveiro.densidade ?? 0, viveiro.area ?? 0, mortTotal)
          downloadCsv(
            `visao_geral_${viveiro.nome}.csv`,
            ['Indicador', 'Valor', 'Unidade'],
            [
              ['DOC', doc, 'dias'],
              ['Nome do Viveiro', viveiro.nome, '-'],
              ['Área', viveiro.area, 'm²'],
              ['Densidade', viveiro.densidade || 0, 'camarões/m²'],
              ['População Inicial', populacaoInicial.toLocaleString('pt-BR'), 'camarões'],
              ['Vivos Atuais', vivos.toLocaleString('pt-BR'), 'camarões'],
              ['Sobrevivência', sobrevivencia.toFixed(1), '%'],
              ['Ração Total', racaoTotal.toFixed(1), 'kg'],
              ['Status', viveiro.status, '-'],
              ['Data Início Ciclo', viveiro.data_inicio_ciclo || '-', '-'],
            ],
          )
          break
        }
        case 'racao': {
          const racaoData = await backendApi.getColetasRacao(id)
          downloadCsv(
            `racao_${viveiro.nome}.csv`,
            ['Data', 'Manhã (kg)', 'Tarde (kg)', 'Total (kg)'],
            racaoData.map((item) => [
              new Date(item.data).toLocaleDateString('pt-BR'),
              item.qntManha || 0,
              item.qntTarde || 0,
              (item.qntManha || 0) + (item.qntTarde || 0),
            ]),
          )
          break
        }
        case 'anotacoes': {
          const medicoes = await backendApi.getMedicoes(id)
          downloadCsv(
            `qualidade_agua_${viveiro.nome}.csv`,
            ['Data', 'pH', 'Temperatura (°C)', 'Oxigênio (mg/L)', 'Alcalinidade', 'Transparência', 'Salinidade'],
            medicoes.map((item) => [
              new Date(item.data).toLocaleDateString('pt-BR'),
              item.ph, item.temperatura, item.oxigenio, item.alcalinidade, item.transparencia, item.salinidade,
            ]),
          )
          break
        }
        case 'mortalidade': {
          const registros = await backendApi.getRegistrosMortalidade(id)
          downloadCsv(
            `mortalidade_${viveiro.nome}.csv`,
            ['Data', 'Quantidade', 'Causa'],
            registros.map((item) => [new Date(item.data).toLocaleDateString('pt-BR'), item.quantidade, item.causa || '-']),
          )
          break
        }
        case 'aeradores': {
          const aeradores = await backendApi.getAeradores(id)
          downloadCsv(
            `aeradores_${viveiro.nome}.csv`,
            ['ID', 'Nome', 'Status', 'Criado em'],
            aeradores.map((item) => [item.id, item.nome, item.status ? 'Ligado' : 'Desligado', new Date(item.created_at).toLocaleDateString('pt-BR')]),
          )
          break
        }
      }
    } catch (err) {
      console.error('Erro ao exportar dados:', err)
    }
  }

  return (
    <div className="page fade-in">
      <Card>
        <div className="page-header">
          <div>
            <h1 className="page-title">{viveiro.nome}</h1>
            <p className="page-subtitle">{viveiro.status} &middot; {viveiro.area} m²</p>
          </div>
          <StatTile className="stat-tile-accent" style={{ minWidth: 64 }} label="DOC" value={doc} />
        </div>
        <div className="stat-grid">
          <StatTile label="População" value={calcularPopulacaoInicial(viveiro.densidade ?? 0, viveiro.area ?? 0).toLocaleString('pt-BR')} />
          <StatTile label="Densidade/m²" value={viveiro.densidade ?? 0} />
          <StatTile label="Área m²" value={viveiro.area} />
        </div>
      </Card>

      <div className="nav-list">
        {MENU_ITEMS.map((item) => (
          <div key={item.route} className="nav-item" style={{ padding: 0 }}>
            <button
              className="nav-item"
              style={{ border: 'none', flex: 1 }}
              onClick={() => navigate(`/viveiro/${id}/${item.route}`)}
            >
              <span className="nav-item-icon"><item.icon size={20} /></span>
              <span className="nav-item-text">
                <span className="nav-item-title">{item.label}</span>
                <span className="nav-item-desc">{item.desc}</span>
              </span>
              <span className="nav-item-trailing"><ChevronRight size={18} /></span>
            </button>
            <IconButton
              variant="ghost"
              style={{ marginRight: 'var(--space-3)' }}
              onClick={() => handleExport(item.route)}
              aria-label={`Exportar ${item.label}`}
              title={`Exportar ${item.label}`}
              icon={<Download size={16} />}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default VivieroPage
