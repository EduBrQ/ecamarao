import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import {
  ColetaRacao, ViveiroDTO, RegistroMortalidade,
  calcularBiomassa, calcularSobrevivencia, calcularFCR, calcularDOC,
  calcularRacaoDiaria, TABELA_RACAO,
} from '../models/types'

const initialRacao: ColetaRacao[] = [
  { id: 1, data: '2025-09-01', qntManha: 5, qntTarde: 5 },
  { id: 2, data: '2025-09-02', qntManha: 5, qntTarde: 5 },
  { id: 3, data: '2025-09-03', qntManha: 7, qntTarde: 7 },
  { id: 4, data: '2025-09-04', qntManha: 7, qntTarde: 7 },
  { id: 5, data: '2025-09-05', qntManha: 8, qntTarde: 8 },
  { id: 6, data: '2025-09-06', qntManha: 8, qntTarde: 8 },
]

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function Racao() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [racao, setRacao] = useState<ColetaRacao[]>(() => {
    const stored = localStorage.getItem(`racao_${viveiroId}`)
    return stored ? JSON.parse(stored) : initialRacao
  })
  const [viveiro, setViveiro] = useState<ViveiroDTO | null>(null)
  const [mortalidade, setMortalidade] = useState<RegistroMortalidade[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ data: '', qntManha: '', qntTarde: '' })
  const [showTabela, setShowTabela] = useState(false)

  useEffect(() => {
    const storedViveiro = localStorage.getItem('viveiro')
    if (storedViveiro) setViveiro(JSON.parse(storedViveiro))
    const storedMort = localStorage.getItem(`mortalidade_${viveiroId}`)
    if (storedMort) setMortalidade(JSON.parse(storedMort))
  }, [viveiroId])

  useEffect(() => {
    localStorage.setItem(`racao_${viveiroId}`, JSON.stringify(racao))
  }, [racao, viveiroId])

  const racaoTotal = racao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
  const precoKg = viveiro?.precoRacaoKg ?? 3
  const gastoRacao = racaoTotal * precoKg
  const densidade = viveiro?.densidade ?? 0
  const mortTotal = mortalidade.reduce((acc, m) => acc + m.quantidade, 0)
  const pesoMedio = viveiro?.pesoMedioAtual ?? 0
  const biomassa = calcularBiomassa(densidade, mortTotal, pesoMedio)
  const fcr = calcularFCR(racaoTotal, biomassa)
  const sobrevivencia = calcularSobrevivencia(densidade, mortTotal)
  const doc = calcularDOC(viveiro?.dataInicioCiclo)

  const recomendacao = calcularRacaoDiaria(densidade, mortTotal, pesoMedio, doc)

  const hoje = new Date().toISOString().split('T')[0]
  const registroHoje = racao.find(r => {
    const d = typeof r.data === 'string' ? r.data : new Date(r.data).toISOString().split('T')[0]
    return d === hoje
  })
  const alimentouHojeManha = registroHoje ? registroHoje.qntManha > 0 : false
  const alimentouHojeTarde = registroHoje ? registroHoje.qntTarde > 0 : false

  function getFcrStatus(val: number): string {
    if (val <= 0) return ''
    if (val <= 1.3) return 'Excelente'
    if (val <= 1.5) return 'Bom'
    if (val <= 2.0) return 'Regular'
    return 'Alto'
  }

  function getFcrColor(val: number): string {
    if (val <= 0) return 'var(--text-light)'
    if (val <= 1.5) return 'var(--success)'
    if (val <= 2.0) return 'var(--warning)'
    return 'var(--danger)'
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = () => {
    setSubmitted(true)
    if (!form.data || !form.qntManha || !form.qntTarde) return
    const newItem: ColetaRacao = {
      id: racao.length > 0 ? Math.max(...racao.map(r => r.id)) + 1 : 1,
      data: form.data,
      qntManha: Number(form.qntManha),
      qntTarde: Number(form.qntTarde),
    }
    setRacao([...racao, newItem])
    setModalOpen(false)
    setSubmitted(false)
    setForm({ data: '', qntManha: '', qntTarde: '' })
  }

  const preencherRecomendacao = () => {
    setForm({
      data: hoje,
      qntManha: recomendacao.manhaKg > 0 ? recomendacao.manhaKg.toFixed(1) : '',
      qntTarde: recomendacao.tardeKg > 0 ? recomendacao.tardeKg.toFixed(1) : '',
    })
    setModalOpen(true)
  }

  const removerColeta = (itemId: number) => {
    setRacao(racao.filter((r) => r.id !== itemId))
  }

  return (
    <div className="container fade-in">
      {/* Daily Recommendation Card */}
      <div className="card daily-feed-card">
        <div className="card-header-accent">
          Racao Hoje — Viveiro {viveiroId} (DOC {doc})
        </div>

        {recomendacao.faixa ? (
          <>
            <div className="daily-feed-phase">
              <span className="daily-feed-phase-name">{recomendacao.faixa.fase}</span>
              <span className="daily-feed-phase-info">
                {recomendacao.faixa.tipoRacao} &middot; {recomendacao.faixa.proteina}% proteina
              </span>
            </div>

            <div className="daily-feed-grid">
              <div className="daily-feed-item daily-feed-total">
                <span className="daily-feed-value">{recomendacao.totalKg.toFixed(1)}</span>
                <span className="daily-feed-unit">kg/dia</span>
                <span className="daily-feed-label">Recomendado</span>
              </div>
              <div className={`daily-feed-item ${alimentouHojeManha ? 'daily-feed-done' : 'daily-feed-pending'}`}>
                <span className="daily-feed-value">{recomendacao.manhaKg.toFixed(1)}</span>
                <span className="daily-feed-unit">kg</span>
                <span className="daily-feed-label">Manha (40%)</span>
              </div>
              <div className={`daily-feed-item ${alimentouHojeTarde ? 'daily-feed-done' : 'daily-feed-pending'}`}>
                <span className="daily-feed-value">{recomendacao.tardeKg.toFixed(1)}</span>
                <span className="daily-feed-unit">kg</span>
                <span className="daily-feed-label">Tarde (60%)</span>
              </div>
            </div>

            <div className="daily-feed-taxa">
              <span>Taxa: <strong>{recomendacao.faixa.taxaAlimentacao}% da biomassa/dia</strong></span>
              <span className="daily-feed-taxa-detail">
                Biomassa est.: {biomassa > 0 ? biomassa.toFixed(0) : '-'} kg &middot; Sobrev.: {sobrevivencia.toFixed(0)}%
              </span>
            </div>

            {!registroHoje && (
              <button className="btn btn-primary btn-block mt-1" onClick={preencherRecomendacao}>
                Registrar Racao de Hoje
              </button>
            )}
          </>
        ) : (
          <div className="empty-state">
            Sem recomendacao disponivel. Verifique se o ciclo esta ativo (DOC: {doc}).
          </div>
        )}
      </div>

      {/* FCR Summary */}
      <div className="card">
        <div className="card-title">Indicadores de Racao</div>
        <div className="fcr-summary">
          <div className="fcr-main">
            <span className="fcr-value" style={{ color: getFcrColor(fcr) }}>
              {fcr > 0 ? fcr.toFixed(2) : '-'}
            </span>
            <span className="fcr-label">FCR</span>
            {fcr > 0 && <span className="fcr-status" style={{ color: getFcrColor(fcr) }}>{getFcrStatus(fcr)}</span>}
          </div>
          <div className="fcr-details">
            <div className="fcr-detail-item">
              <span className="fcr-detail-value">{racaoTotal.toFixed(1)} kg</span>
              <span className="fcr-detail-label">Racao Total</span>
            </div>
            <div className="fcr-detail-item">
              <span className="fcr-detail-value">{biomassa > 0 ? biomassa.toFixed(0) : '-'} kg</span>
              <span className="fcr-detail-label">Biomassa Est.</span>
            </div>
            <div className="fcr-detail-item">
              <span className="fcr-detail-value">R$ {gastoRacao.toFixed(2)}</span>
              <span className="fcr-detail-label">Gasto Total</span>
            </div>
            <div className="fcr-detail-item">
              <span className="fcr-detail-value">R$ {precoKg.toFixed(2)}/kg</span>
              <span className="fcr-detail-label">Preco Racao</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Rate Reference Table */}
      <div className="card">
        <div className="flex-between mb-1">
          <h3 className="card-title" style={{ marginBottom: 0 }}>Tabela de Referencia</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTabela(!showTabela)}>
            {showTabela ? 'Ocultar' : 'Ver Tabela'}
          </button>
        </div>
        <p style={{ fontSize: '.75rem', color: 'var(--text-light)', marginBottom: '.5rem' }}>
          Fonte: FAO Technical Paper 583, Aqua Culture Asia Pacific (2024)
        </p>

        {showTabela && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>DOC</th>
                  <th>Fase</th>
                  <th className="text-right">Peso (g)</th>
                  <th className="text-right">Taxa (%)</th>
                  <th>Racao</th>
                  <th className="text-right">Prot.</th>
                </tr>
              </thead>
              <tbody>
                {TABELA_RACAO.map((f) => (
                  <tr key={f.docMin} className={doc >= f.docMin && doc <= f.docMax ? 'active-row' : ''}>
                    <td>{f.docMin}-{f.docMax}</td>
                    <td>{f.fase}</td>
                    <td className="text-right">{f.pesoMedioMin}-{f.pesoMedioMax}</td>
                    <td className="text-right">{f.taxaAlimentacao}%</td>
                    <td>{f.tipoRacao}</td>
                    <td className="text-right">{f.proteina}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feed Records */}
      <div className="card">
        <div className="flex-between mb-2">
          <h3 className="card-title" style={{ marginBottom: 0 }}>Historico de Arracoamento</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            + Inserir
          </button>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th className="text-right">Manha</th>
                <th className="text-right">Tarde</th>
                <th className="text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {racao.length === 0 ? (
                <tr><td colSpan={5} className="text-center">Nenhum registro</td></tr>
              ) : (
                racao.slice().reverse().map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.data)}</td>
                    <td className="text-right">{r.qntManha} kg</td>
                    <td className="text-right">{r.qntTarde} kg</td>
                    <td className="text-right"><strong>{(r.qntManha + r.qntTarde).toFixed(1)} kg</strong></td>
                    <td className="text-right">
                      <button className="btn btn-danger btn-sm" onClick={() => removerColeta(r.id)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        title="Registrar Arracoamento"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        {recomendacao.faixa && (
          <div className="modal-recommendation">
            <span className="modal-rec-title">Recomendacao para DOC {doc}</span>
            <div className="modal-rec-values">
              <span>Manha: <strong>{recomendacao.manhaKg.toFixed(1)} kg</strong></span>
              <span>Tarde: <strong>{recomendacao.tardeKg.toFixed(1)} kg</strong></span>
              <span>Total: <strong>{recomendacao.totalKg.toFixed(1)} kg</strong></span>
            </div>
          </div>
        )}
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.data ? 'has-error' : ''}`}>Data:</label>
          <input
            name="data" type="date"
            className={`form-control ${submitted && !form.data ? 'is-invalid' : ''}`}
            value={form.data} onChange={handleChange}
          />
          <FieldError show={submitted && !form.data} message="Insira uma data" />
        </div>
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.qntManha ? 'has-error' : ''}`}>Manha (kg):</label>
          <input
            name="qntManha" type="number" step="0.1"
            className={`form-control ${submitted && !form.qntManha ? 'is-invalid' : ''}`}
            value={form.qntManha} onChange={handleChange}
            placeholder={recomendacao.manhaKg > 0 ? `Recomendado: ${recomendacao.manhaKg.toFixed(1)} kg` : ''}
          />
          <FieldError show={submitted && !form.qntManha} message="Insira a quantidade" />
        </div>
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.qntTarde ? 'has-error' : ''}`}>Tarde (kg):</label>
          <input
            name="qntTarde" type="number" step="0.1"
            className={`form-control ${submitted && !form.qntTarde ? 'is-invalid' : ''}`}
            value={form.qntTarde} onChange={handleChange}
            placeholder={recomendacao.tardeKg > 0 ? `Recomendado: ${recomendacao.tardeKg.toFixed(1)} kg` : ''}
          />
          <FieldError show={submitted && !form.qntTarde} message="Insira a quantidade" />
        </div>
      </Modal>
    </div>
  )
}

export default Racao
