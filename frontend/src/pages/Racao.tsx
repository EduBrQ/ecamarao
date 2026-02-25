import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import {
  ColetaRacao, RegistroMortalidade,
  calcularBiomassa, calcularFCR, calcularDOC,
  calcularRacaoDiariaAvancada, TABELA_RACAO,
} from '../models/types'
import { backendApi, Viveiro } from '../services/backendApi'

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function Racao() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [racao, setRacao] = useState<ColetaRacao[]>([])
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [mortalidade, setMortalidade] = useState<RegistroMortalidade[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ data: '', qntManha: '', qntTarde: '' })
  const [showTabela, setShowTabela] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar dados do backend
  useEffect(() => {
    const loadData = async () => {
      if (!viveiroId) return
      
      try {
        setLoading(true)
        setError(null)

        // Carregar dados em paralelo
        const [viveiroData, racaoData, mortalidadeData] = await Promise.all([
          backendApi.getViveiroById(viveiroId),
          backendApi.getColetasRacao(viveiroId),
          backendApi.getRegistrosMortalidade(viveiroId)
        ])

        setViveiro(viveiroData)
        setRacao(racaoData)
        setMortalidade(mortalidadeData)

      } catch (err) {
        console.error('Erro ao carregar dados de ração:', err)
        setError('Erro ao carregar dados do viveiro')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [viveiroId])

  if (loading) {
    return (
      <div className="container fade-in">
        <div className="card text-center">Carregando dados de ração...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container fade-in">
        <div className="card text-center text-red-600">{error}</div>
      </div>
    )
  }

  if (!viveiro) {
    return (
      <div className="container fade-in">
        <div className="card text-center">Viveiro não encontrado</div>
      </div>
    )
  }

  const racaoTotal = racao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
  const precoKg = 3 // Preço fixo por enquanto
  const gastoRacao = racaoTotal * precoKg
  const densidade = viveiro?.densidade ?? 0
  const mortTotal = mortalidade.reduce((acc, m) => acc + m.quantidade, 0)
  const pesoMedio = 0 // Peso médio não está disponível no backend ainda
  const biomassa = calcularBiomassa(densidade, mortTotal, pesoMedio)
  const fcr = calcularFCR(racaoTotal, biomassa)
  const doc = calcularDOC(viveiro?.data_inicio_ciclo)
  
  const recomendacao = calcularRacaoDiariaAvancada(
    densidade,
    doc,
    mortalidade,
    pesoMedio,
    undefined // plInicial não está disponível no backend
  )

  // Verificação de dados essenciais
  const dadosIncompletos = !viveiro || !viveiro.densidade || !viveiro.data_inicio_ciclo;
  const densidadeBaixa = viveiro?.densidade && viveiro.densidade < 10; // menos de 10 larvas/m²
  const densidadeFormatada = viveiro?.densidade ? `${viveiro.densidade} larvas/m²` : 'Não informada';
  const cicloFormatado = viveiro?.data_inicio_ciclo ? new Date(viveiro.data_inicio_ciclo).toLocaleDateString('pt-BR') : 'Não iniciado';

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

  const handleSave = async () => {
    setSubmitted(true)
    if (!form.data || !form.qntManha || !form.qntTarde) return

    try {
      await backendApi.createColetaRacao(viveiroId!, {
        data: form.data,
        qnt_manha: Number(form.qntManha),
        qnt_tarde: Number(form.qntTarde)
      })
      
      // Recarregar lista
      const updatedRacao = await backendApi.getColetasRacao(viveiroId!)
      setRacao(updatedRacao)
      
      setModalOpen(false)
      setSubmitted(false)
      setForm({ data: '', qntManha: '', qntTarde: '' })
    } catch (err) {
      console.error('Erro ao salvar coleta de ração:', err)
      setError('Erro ao salvar coleta de ração')
    }
  }

  const preencherRecomendacao = () => {
    if (!recomendacao.faixa) {
      console.warn('preencherRecomendacao - Sem faixa de ração disponível');
      return;
    }
    
    if (recomendacao.totalKg <= 0) {
      console.warn('preencherRecomendacao - Quantidade recomendada inválida:', recomendacao.totalKg);
      return;
    }
    
    setForm({
      data: hoje,
      qntManha: recomendacao.manhaKg > 0 ? recomendacao.manhaKg.toFixed(1) : '',
      qntTarde: recomendacao.tardeKg > 0 ? recomendacao.tardeKg.toFixed(1) : ''
    })
    setModalOpen(true)
  }

  const removerColeta = async (itemId: number) => {
    try {
      await backendApi.deleteColetaRacao(viveiroId!, itemId.toString())
      
      // Recarregar lista
      const updatedRacao = await backendApi.getColetasRacao(viveiroId!)
      setRacao(updatedRacao)
    } catch (err) {
      console.error('Erro ao deletar coleta de ração:', err)
      setError('Erro ao deletar coleta de ração')
    }
  }

  return (
    <div className="container fade-in">
      {/* Verificação de dados essenciais */}
      {dadosIncompletos && (
        <div className="card" style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)', marginBottom: '1rem' }}>
          <div style={{ padding: '1rem' }}>
            <h4 style={{ color: 'var(--warning)', margin: '0 0 0.5rem 0' }}>⚠️ Dados Essenciais Faltando</h4>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)' }}>
              Para calcular a recomendação de ração, preencha os seguintes dados do viveiro:
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                {!viveiro?.densidade && <li><strong>Densidade:</strong> larvas por m² (ex: 50-100)</li>}
                {!viveiro?.data_inicio_ciclo && <li><strong>Data de Início:</strong> do ciclo de cultivo</li>}
              </ul>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                <strong>Status atual:</strong> Densidade: {densidadeFormatada} | Ciclo: {cicloFormatado} | DOC: {doc}
              </div>
            </div>
          </div>
        </div>
      )}

      {densidadeBaixa && !dadosIncompletos && (
        <div className="card" style={{ backgroundColor: 'var(--info-light)', border: '1px solid var(--info)', marginBottom: '1rem' }}>
          <div style={{ padding: '1rem' }}>
            <h4 style={{ color: 'var(--info)', margin: '0 0 0.5rem 0' }}>ℹ️ Densidade Baixa Detectada</h4>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)' }}>
              A densidade de <strong>{viveiro?.densidade} larvas/m²</strong> está abaixo do recomendado (10-100 larvas/m²).
              <br />Isso pode resultar em recomendações muito baixas de ração.
              <br /><strong>Densidade recomendada:</strong> 30-70 larvas/m² para cultivo intensivo.
            </div>
          </div>
        </div>
      )}

      {/* Daily Recommendation Card */}
      <div className="card daily-feed-card">
        <div className="card-header-accent">
          Racao Hoje — {viveiro.nome} (DOC {doc})
          <div style={{ fontSize: '0.75rem', color: 'var(--warning-light)', fontWeight: 'bold', marginTop: '0.25rem' }}>
            Densidade: {densidadeFormatada} | Ciclo: {cicloFormatado}
          </div>
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
                Biomassa est.: {recomendacao.biomassaEstimadaKg.toFixed(0)} kg &middot; 
                Peso: {recomendacao.pesoEstimadoG.toFixed(1)}g &middot; 
                Pop: {recomendacao.populacaoEstimada.toLocaleString()} camarões
              </span>
            </div>

            {/* Informações detalhadas para início de ciclo */}
            {racao.length === 0 && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--info-light)', borderRadius: '6px', border: '1px solid var(--info)' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-dark)', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                  📊 Início de Ciclo - Cálculo Automático
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', lineHeight: '1.4' }}>
                  <div><strong>DOC {doc}:</strong> {recomendacao.faixa.fase}</div>
                  <div><strong>PL Inicial:</strong> {recomendacao.plData ? `${recomendacao.plData.pl} (${recomendacao.plData.pesoMedioMg}mg)` : 'Não informado'}</div>
                  <div><strong>População estimada:</strong> {recomendacao.populacaoEstimada.toLocaleString()} camarões</div>
                  <div><strong>Peso estimado:</strong> {recomendacao.pesoEstimadoG.toFixed(3)}g {recomendacao.plData && `(baseado ${recomendacao.plData.pl})`}</div>
                  <div><strong>Biomassa calculada:</strong> {recomendacao.biomassaEstimadaKg.toFixed(1)}kg</div>
                  <div><strong>Taxa de alimentação:</strong> {recomendacao.faixa.taxaAlimentacao}% da biomassa/dia</div>
                  {recomendacao.plData && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                      <strong>Fonte:</strong> {recomendacao.plData.fonte}
                    </div>
                  )}
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--info)' }}>
                    <strong>Recomendação do dia:</strong> {recomendacao.manhaKg.toFixed(1)}kg (manhã) + {recomendacao.tardeKg.toFixed(1)}kg (tarde) = {recomendacao.totalKg.toFixed(1)}kg total
                  </div>
                </div>
              </div>
            )}

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
          {recomendacao.faixa && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              Baseado em {recomendacao.biomassaEstimadaKg.toFixed(0)}kg biomassa estimada
            </div>
          )}
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
          {recomendacao.faixa && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              Taxa: {recomendacao.faixa.taxaAlimentacao}% da biomassa/dia
            </div>
          )}
          <FieldError show={submitted && !form.qntTarde} message="Insira a quantidade" />
        </div>
      </Modal>
    </div>
  )
}

export default Racao
