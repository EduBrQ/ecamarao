import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ViveiroDTO, ColetaRacao, RegistroMortalidade,
  calcularBiomassa, calcularFCR, calcularDOC,
  calcularRacaoDiaria, getFaixaRacao,
} from '../models/types'

interface ViveiroResumo {
  viveiro: ViveiroDTO
  doc: number
  racaoHojeTotal: number
  racaoHojeManha: number
  racaoHojeTarde: number
  recomendadoTotal: number
  recomendadoManha: number
  recomendadoTarde: number
  fase: string
  fcrAtual: number
  racaoAcumulada: number
  biomassa: number
  alimentouManha: boolean
  alimentouTarde: boolean
}

function FazendaRacao() {
  const navigate = useNavigate()
  const [viveiros, setViveiros] = useState<ViveiroDTO[]>([])
  const [resumos, setResumos] = useState<ViveiroResumo[]>([])

  useEffect(() => {
    // Load viveiros from localStorage (same source as Home page)
    const stored = localStorage.getItem('viveiros')
    if (stored) {
      setViveiros(JSON.parse(stored))
    } else {
      // Fallback: load initial viveiros
      const initialViveiros: ViveiroDTO[] = [
        { id: 1, densidade: 70, laboratorio: 'AquaTec', proprietario: 'Erica', dataInicioCiclo: '2025-08-15', pesoMedioAtual: 12, precoRacaoKg: 3 },
        { id: 2, densidade: 50, laboratorio: 'AquaTec', proprietario: 'Eduardo', dataInicioCiclo: '2025-09-01', pesoMedioAtual: 9, precoRacaoKg: 3 },
      ]
      setViveiros(initialViveiros)
    }
  }, [])

  useEffect(() => {
    if (viveiros.length === 0) return
    const hoje = new Date().toISOString().split('T')[0]

    const res: ViveiroResumo[] = viveiros.map(v => {
      const doc = calcularDOC(v.dataInicioCiclo)
      const densidade = v.densidade ?? 0
      const pesoMedio = v.pesoMedioAtual ?? 0

      // Load mortality
      const storedMort = localStorage.getItem(`mortalidade_${v.id}`)
      const mortalidade: RegistroMortalidade[] = storedMort ? JSON.parse(storedMort) : []
      const mortTotal = mortalidade.reduce((acc: number, m: RegistroMortalidade) => acc + m.quantidade, 0)

      // Load feed records
      const storedRacao = localStorage.getItem(`racao_${v.id}`)
      const racaoList: ColetaRacao[] = storedRacao ? JSON.parse(storedRacao) : []

      const biomassa = calcularBiomassa(densidade, mortTotal, pesoMedio)
      const racaoAcumulada = racaoList.reduce((acc: number, r: ColetaRacao) => acc + r.qntManha + r.qntTarde, 0)
      const fcrAtual = calcularFCR(racaoAcumulada, biomassa)
      const recomendacao = calcularRacaoDiaria(densidade, mortTotal, pesoMedio, doc)
      const faixa = getFaixaRacao(doc)

      // Check today's feeding
      const registroHoje = racaoList.find((r: ColetaRacao) => {
        const d = typeof r.data === 'string' ? r.data : new Date(r.data).toISOString().split('T')[0]
        return d === hoje
      })

      return {
        viveiro: v,
        doc,
        racaoHojeTotal: registroHoje ? registroHoje.qntManha + registroHoje.qntTarde : 0,
        racaoHojeManha: registroHoje ? registroHoje.qntManha : 0,
        racaoHojeTarde: registroHoje ? registroHoje.qntTarde : 0,
        recomendadoTotal: recomendacao.totalKg,
        recomendadoManha: recomendacao.manhaKg,
        recomendadoTarde: recomendacao.tardeKg,
        fase: faixa?.fase ?? 'N/A',
        fcrAtual,
        racaoAcumulada,
        biomassa,
        alimentouManha: registroHoje ? registroHoje.qntManha > 0 : false,
        alimentouTarde: registroHoje ? registroHoje.qntTarde > 0 : false,
      }
    })
    setResumos(res)
  }, [viveiros])

  const totalRecomendadoHoje = resumos.reduce((acc, r) => acc + r.recomendadoTotal, 0)
  const totalManhaHoje = resumos.reduce((acc, r) => acc + r.recomendadoManha, 0)
  const totalTardeHoje = resumos.reduce((acc, r) => acc + r.recomendadoTarde, 0)
  const totalRacaoAcumulada = resumos.reduce((acc, r) => acc + r.racaoAcumulada, 0)
  const totalBiomassa = resumos.reduce((acc, r) => acc + r.biomassa, 0)
  const fcrGeral = totalBiomassa > 0 ? totalRacaoAcumulada / totalBiomassa : 0
  const totalJaAlimentadoHoje = resumos.reduce((acc, r) => acc + r.racaoHojeTotal, 0)
  const viveirosAlimentados = resumos.filter(r => r.alimentouManha || r.alimentouTarde).length

  function getFcrColor(val: number): string {
    if (val <= 0) return 'var(--text-light)'
    if (val <= 1.5) return 'var(--success)'
    if (val <= 2.0) return 'var(--warning)'
    return 'var(--danger)'
  }

  const goToViveiroRacao = (v: ViveiroDTO) => {
    localStorage.setItem('viveiro', JSON.stringify(v))
    navigate(`/viveiro/${v.id}/racao`)
  }

  return (
    <div className="container fade-in">
      <div className="home-header">
        <h2 className="page-title">Racao da Fazenda</h2>
        <span style={{ fontSize: '.8rem', color: 'var(--text-light)' }}>
          {viveiros.length} viveiro{viveiros.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Farm-level daily recommendation */}
      <div className="card daily-feed-card">
        <div className="card-header-accent">
          Racao Hoje — Toda a Fazenda
        </div>

        <div className="daily-feed-grid">
          <div className="daily-feed-item daily-feed-total">
            <span className="daily-feed-value">{totalRecomendadoHoje.toFixed(1)}</span>
            <span className="daily-feed-unit">kg/dia</span>
            <span className="daily-feed-label">Total Recomendado</span>
          </div>
          <div className="daily-feed-item daily-feed-pending">
            <span className="daily-feed-value">{totalManhaHoje.toFixed(1)}</span>
            <span className="daily-feed-unit">kg</span>
            <span className="daily-feed-label">Manha (40%)</span>
          </div>
          <div className="daily-feed-item daily-feed-pending">
            <span className="daily-feed-value">{totalTardeHoje.toFixed(1)}</span>
            <span className="daily-feed-unit">kg</span>
            <span className="daily-feed-label">Tarde (60%)</span>
          </div>
        </div>

        <div className="daily-feed-taxa">
          <span>Ja alimentado hoje: <strong>{totalJaAlimentadoHoje.toFixed(1)} kg</strong></span>
          <span className="daily-feed-taxa-detail">
            {viveirosAlimentados}/{viveiros.length} viveiros com registro hoje
          </span>
        </div>
      </div>

      {/* Farm KPIs */}
      <div className="card">
        <div className="card-title">Indicadores Gerais</div>
        <div className="farm-kpi-grid">
          <div className="farm-kpi-item">
            <span className="farm-kpi-value" style={{ color: getFcrColor(fcrGeral) }}>
              {fcrGeral > 0 ? fcrGeral.toFixed(2) : '-'}
            </span>
            <span className="farm-kpi-label">FCR Geral</span>
          </div>
          <div className="farm-kpi-item">
            <span className="farm-kpi-value">{totalRacaoAcumulada.toFixed(0)}</span>
            <span className="farm-kpi-label">Racao Total (kg)</span>
          </div>
          <div className="farm-kpi-item">
            <span className="farm-kpi-value">{totalBiomassa > 0 ? totalBiomassa.toFixed(0) : '-'}</span>
            <span className="farm-kpi-label">Biomassa (kg)</span>
          </div>
          <div className="farm-kpi-item">
            <span className="farm-kpi-value">R$ {(totalRacaoAcumulada * 3).toFixed(0)}</span>
            <span className="farm-kpi-label">Gasto Racao</span>
          </div>
        </div>
      </div>

      {/* Per-viveiro breakdown */}
      <div className="card">
        <div className="card-title">Racao por Viveiro</div>
        <div className="viveiro-feed-list">
          {resumos.map(r => (
            <div
              key={r.viveiro.id}
              className="viveiro-feed-card"
              onClick={() => goToViveiroRacao(r.viveiro)}
            >
              <div className="viveiro-feed-header">
                <div>
                  <strong>Viveiro {r.viveiro.id}</strong>
                  <span className="viveiro-feed-phase">{r.fase} &middot; DOC {r.doc}</span>
                </div>
                <div className="viveiro-feed-status">
                  {r.alimentouManha && r.alimentouTarde ? (
                    <span className="feed-status-badge feed-status-done">Completo</span>
                  ) : r.alimentouManha || r.alimentouTarde ? (
                    <span className="feed-status-badge feed-status-partial">Parcial</span>
                  ) : (
                    <span className="feed-status-badge feed-status-pending">Pendente</span>
                  )}
                </div>
              </div>

              <div className="viveiro-feed-amounts">
                <div className="viveiro-feed-amount">
                  <span className="viveiro-feed-amount-label">Recomendado</span>
                  <span className="viveiro-feed-amount-value">{r.recomendadoTotal.toFixed(1)} kg</span>
                </div>
                <div className="viveiro-feed-amount">
                  <span className="viveiro-feed-amount-label">Manha</span>
                  <span className="viveiro-feed-amount-value">
                    {r.alimentouManha ? `${r.racaoHojeManha.toFixed(1)} kg` : `${r.recomendadoManha.toFixed(1)} kg`}
                  </span>
                </div>
                <div className="viveiro-feed-amount">
                  <span className="viveiro-feed-amount-label">Tarde</span>
                  <span className="viveiro-feed-amount-value">
                    {r.alimentouTarde ? `${r.racaoHojeTarde.toFixed(1)} kg` : `${r.recomendadoTarde.toFixed(1)} kg`}
                  </span>
                </div>
                <div className="viveiro-feed-amount">
                  <span className="viveiro-feed-amount-label">FCR</span>
                  <span className="viveiro-feed-amount-value" style={{ color: getFcrColor(r.fcrAtual) }}>
                    {r.fcrAtual > 0 ? r.fcrAtual.toFixed(2) : '-'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FazendaRacao
