import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { calcularDOC } from '../models/types'
import { backendApi, type Viveiro } from '../services/backendApi'

function Viveiro() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar dados do viveiro do backend
  useEffect(() => {
    const loadViveiro = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        setError(null)
        const viveiroData = await backendApi.getViveiroById(id)
        setViveiro(viveiroData)
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
      <div className="container">
        <div className="card text-center">Carregando dados do viveiro...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="card text-center text-red-600">{error}</div>
      </div>
    )
  }

  if (!viveiro) {
    return (
      <div className="container">
        <div className="card text-center">Viveiro não encontrado</div>
      </div>
    )
  }

  const doc = calcularDOC(viveiro.data_inicio_ciclo)

  // Função para exportar dados de cada seção
  const handleExport = async (route: string) => {
    if (!id) return
    
    try {
      let data: string[][] = []
      let filename = ''
      let headers: string[] = []

      switch (route) {
        case 'dashboard': {
          // Exportar KPIs e indicadores do ciclo
          const dashboardData: (string | number)[][] = [
            ['Indicador', 'Valor', 'Unidade'],
            ['DOC', doc, 'dias'],
            ['Nome do Viveiro', viveiro.nome, '-'],
            ['Área', viveiro.area, 'm²'],
            ['Densidade', viveiro.densidade || 0, 'camarões/m²'],
            ['População Inicial', ((viveiro.densidade || 0) * 1000).toLocaleString('pt-BR'), 'camarões'],
            ['Status', viveiro.status, '-'],
            ['Data Início Ciclo', viveiro.data_inicio_ciclo || '-', '-'],
            
          ]
          filename = `dashboard_${viveiro.nome}_${new Date().toLocaleDateString('pt-BR')}.csv`
          headers = dashboardData[0] as string[]
          data = dashboardData.slice(1) as string[][]
          break
        }

        case 'racao': {
          // Exportar dados de ração
          const racaoData = await backendApi.getColetasRacao(id)
          filename = `racao_${viveiro.nome}_${new Date().toLocaleDateString('pt-BR')}.csv`
          headers = ['Data', 'Quantidade Manhã (kg)', 'Quantidade Tarde (kg)', 'Total (kg)']
          data = racaoData.map((item: any) => [
            new Date(item.data).toLocaleDateString('pt-BR'),
            (item.qntManha || 0).toString(),
            (item.qntTarde || 0).toString(),
            ((item.qntManha || 0) + (item.qntTarde || 0)).toString()
          ])
          break
        }

        case 'anotacoes': {
          // Exportar medições de qualidade da água
          const anotacoesData = await backendApi.getMedicoes(id)
          filename = `qualidade_agua_${viveiro.nome}_${new Date().toLocaleDateString('pt-BR')}.csv`
          headers = ['Data', 'pH', 'Temperatura (°C)', 'Oxigênio (mg/L)', 'Salinidade (ppt)', 'Observações']
          data = anotacoesData.map((item: any) => [
            new Date(item.data).toLocaleDateString('pt-BR'),
            item.ph || '-',
            item.temperatura || '-',
            item.oxigenio || '-',
            item.salinidade || '-',
            item.observacoes || '-'
          ])
          break
        }

        case 'mortalidade': {
          // Exportar registros de mortalidade
          const mortalidadeData = await backendApi.getRegistrosMortalidade(id)
          filename = `mortalidade_${viveiro.nome}_${new Date().toLocaleDateString('pt-BR')}.csv`
          headers = ['Data', 'Quantidade', 'Causa Provável', 'Observações']
          data = mortalidadeData.map((item: any) => [
            new Date(item.data).toLocaleDateString('pt-BR'),
            item.quantidade.toString(),
            item.causa || '-',
            item.observacoes || '-'
          ])
          break
        }

        case 'ciclo': {
          // Exportar informações completas do ciclo
          const [racaoCiclo, mortalidadeCiclo] = await Promise.all([
            backendApi.getColetasRacao(id),
            backendApi.getRegistrosMortalidade(id)
          ])
          
          const racaoTotalCiclo = racaoCiclo.reduce((acc: number, r: any) => acc + r.qntManha + r.qntTarde, 0)
          const mortTotalCiclo = mortalidadeCiclo.reduce((acc: number, m: any) => acc + m.quantidade, 0)
          const vivosCiclo = ((viveiro.densidade || 0) * 1000) - mortTotalCiclo
          const sobrevivenciaCiclo = ((viveiro.densidade || 0) * 1000) > 0 ? (vivosCiclo / ((viveiro.densidade || 0) * 1000)) * 100 : 0
          
          filename = `ciclo_${viveiro.nome}_${new Date().toLocaleDateString('pt-BR')}.csv`
          headers = ['Indicador', 'Valor', 'Unidade']
          data = [
            ['DOC', doc.toString(), 'dias'],
            ['Nome do Viveiro', viveiro.nome, '-'],
            ['Área', viveiro.area.toString(), 'm²'],
            ['Densidade', (viveiro.densidade || 0).toString(), 'camarões/m²'],
            ['População Inicial', ((viveiro.densidade || 0) * 1000).toLocaleString('pt-BR'), 'camarões'],
            ['Vivos Atuais', vivosCiclo.toLocaleString('pt-BR'), 'camarões'],
            ['Mortalidade Total', mortTotalCiclo.toLocaleString('pt-BR'), 'camarões'],
            ['Taxa de Sobrevivência', sobrevivenciaCiclo.toFixed(1), '%'],
            ['Ração Total', racaoTotalCiclo.toFixed(1), 'kg'],
            ['Dias Alimentados', racaoCiclo.length.toString(), 'dias'],
            ['Média Diária de Ração', racaoTotalCiclo > 0 && doc > 0 ? (racaoTotalCiclo / doc).toFixed(1) : '0', 'kg/dia'],
            ['Status', viveiro.status, '-'],
            ['Data Início Ciclo', viveiro.data_inicio_ciclo || '-', '-'],
          ]
          break
        }

        case 'aeradores': {
          // Exportar dados dos aeradores
          const aeradoresData = await backendApi.getAeradores(id)
          filename = `aeradores_${viveiro.nome}_${new Date().toLocaleDateString('pt-BR')}.csv`
          headers = ['ID', 'Marca/Modelo', 'Potência (HP)', 'Status', 'Data Instalação', 'Observações']
          data = aeradoresData.map((item: any) => [
            item.id.toString(),
            item.marca || '-',
            item.potencia || '-',
            item.status || '-',
            item.dataInstalacao ? new Date(item.dataInstalacao).toLocaleDateString('pt-BR') : '-',
            item.observacoes || '-'
          ])
          break
        }

        default:
          return
      }

      // Criar CSV
      const csvContent = [
        headers.join(','),
        ...data.map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
      ].join('\n')

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error('Erro ao exportar dados:', error)
      alert('Erro ao exportar dados. Tente novamente.')
    }
  }

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
          <h2>{viveiro.nome}</h2>
          <span className="viveiro-detail-sub">
            Status: {viveiro.status} &mdash; {viveiro.area} m²
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
          <span className="quick-stat-value">{viveiro.densidade ?? 0}</span>
          <span className="quick-stat-label">Densidade/m²</span>
        </div>
        <div className="quick-stat">
          <span className="quick-stat-value">{viveiro.area} m²</span>
          <span className="quick-stat-label">Área</span>
        </div>
      </div>

      <nav className="nav-grid-v2">
        {menuItems.map((item) => (
          <div className='row'>

          
          <div
            key={item.route}
            className="nav-card-v2 col-10"
            >
            
            <div className="nav-card-icon" 
            onClick={() => navigate(`/viveiro/${id}/${item.route}`)}>
              
              <img src={`/img/${item.icon}`} alt={item.label} />
            </div>
            <div onClick={() => navigate(`/viveiro/${id}/${item.route}`)} className="nav-card-text">
              <span className="nav-card-title">{item.label}</span>
              <span className="nav-card-desc">{item.desc}</span>
            </div>
            
          <div className="nav-card-icon-export export-icon" style={{ justifySelf: 'flex-end' }}>
              <button className="export-button" onClick={() => handleExport(item.route)}>
                <img src="/img/planilha.svg" alt="Exportar" />
              </button>
              </div>
            </div>
          </div>
        ))}
      </nav>

      <style>{`
        .export-button {
          width: 2.5rem;
          height: 2.5rem;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          background: var(--success-light) !important;
          position: relative;
          bottom: 28px;
          left: 18px;
          border-radius: 100%;
          border: 1px solid darkgreen;
        }

        .export-icon {
          background: none !important;
        }

        .nav-card-v2:hover .export-button {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}

export default Viveiro
