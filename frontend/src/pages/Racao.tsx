import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Info, Plus, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { backendApi, getErrorMessage, Viveiro } from '../services/backendApi'
import { useToastGlobal } from '../hooks/useToastGlobal'
import Modal from '../components/Modal'
import FieldError from '../components/FieldError'
import {
  ColetaRacao, RegistroMortalidade,
  calcularFCR, calcularDOC,
  calcularRacaoDiariaAvancada, TABELA_RACAO,
} from '../models/types'

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function fcrVariant(val: number): string {
  if (val <= 0) return ''
  if (val <= 1.5) return 'pill-good'
  if (val <= 2.0) return 'pill-warning'
  return 'pill-critical'
}

function fcrLabel(val: number): string {
  if (val <= 0) return ''
  if (val <= 1.3) return 'Excelente'
  if (val <= 1.5) return 'Bom'
  if (val <= 2.0) return 'Regular'
  return 'Alto'
}

function Racao() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const toast = useToastGlobal()
  const [racao, setRacao] = useState<ColetaRacao[]>([])
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [mortalidade, setMortalidade] = useState<RegistroMortalidade[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ data: '', qntManha: '', qntTarde: '' })
  const [showTabela, setShowTabela] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!viveiroId) return
      try {
        setLoading(true)
        setError(null)
        const [viveiroData, racaoData, mortalidadeData] = await Promise.all([
          backendApi.getViveiroById(viveiroId),
          backendApi.getColetasRacao(viveiroId),
          backendApi.getRegistrosMortalidade(viveiroId),
        ])
        setViveiro(viveiroData)
        setRacao(racaoData)
        setMortalidade(mortalidadeData)
      } catch (err) {
        console.error('Erro ao carregar dados de ração:', err)
        toast.error('Erro ao carregar dados', getErrorMessage(err, 'Não foi possível carregar os dados do viveiro'))
        setError('Erro ao carregar dados do viveiro')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [viveiroId, toast])

  if (loading) {
    return <div className="page fade-in"><div className="card text-center"><Loader2 className="spinner" size={20} />Carregando dados de ração...</div></div>
  }
  if (error) {
    return <div className="page fade-in"><div className="card text-center field-error">{error}</div></div>
  }
  if (!viveiro) {
    return <div className="page fade-in"><div className="card text-center">Viveiro não encontrado</div></div>
  }

  const racaoTotal = racao.reduce((acc, r) => acc + r.qntManha + r.qntTarde, 0)
  const precoKg = 3
  const gastoRacao = racaoTotal * precoKg
  const densidade = viveiro?.densidade ?? 0
  const area = viveiro?.area ?? 0
  const doc = calcularDOC(viveiro?.data_inicio_ciclo)
  const recomendacao = calcularRacaoDiariaAvancada(densidade, area, doc, mortalidade, undefined, undefined)
  // Biomassa/FCR usam o mesmo peso e população estimados da recomendação
  // (curva de crescimento por DOC), em vez de um peso fixo de pós-larva,
  // para não subestimar a biomassa real do viveiro ao longo do ciclo.
  const biomassa = recomendacao.biomassaEstimadaKg
  const fcr = calcularFCR(racaoTotal, biomassa)

  const dadosIncompletos = !viveiro || !viveiro.densidade || !viveiro.data_inicio_ciclo
  const densidadeFormatada = viveiro?.densidade ? `${viveiro.densidade} camarões/m²` : 'Não informada'
  const cicloFormatado = viveiro?.data_inicio_ciclo ? new Date(viveiro.data_inicio_ciclo).toLocaleDateString('pt-BR') : 'Não iniciado'

  const hoje = new Date().toISOString().split('T')[0]
  const registroHoje = racao.find((r) => {
    const d = typeof r.data === 'string' ? r.data : new Date(r.data).toISOString().split('T')[0]
    return d === hoje
  })
  const alimentouHojeManha = registroHoje ? registroHoje.qntManha > 0 : false
  const alimentouHojeTarde = registroHoje ? registroHoje.qntTarde > 0 : false

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
        qnt_tarde: Number(form.qntTarde),
      })
      setRacao(await backendApi.getColetasRacao(viveiroId!))
      setModalOpen(false)
      setSubmitted(false)
      setForm({ data: '', qntManha: '', qntTarde: '' })
    } catch (err) {
      toast.error('Erro ao salvar', getErrorMessage(err, 'Não foi possível salvar a coleta de ração'))
    }
  }

  const preencherRecomendacao = () => {
    if (!recomendacao.faixa || recomendacao.totalKg <= 0) return
    setForm({
      data: hoje,
      qntManha: recomendacao.manhaKg > 0 ? recomendacao.manhaKg.toFixed(1) : '',
      qntTarde: recomendacao.tardeKg > 0 ? recomendacao.tardeKg.toFixed(1) : '',
    })
    setModalOpen(true)
  }

  const removerColeta = async (itemId: number) => {
    try {
      await backendApi.deleteColetaRacao(viveiroId!, itemId.toString())
      setRacao(await backendApi.getColetasRacao(viveiroId!))
    } catch (err) {
      toast.error('Erro ao deletar', getErrorMessage(err, 'Não foi possível deletar a coleta de ração'))
    }
  }

  return (
    <div className="page fade-in">
      {dadosIncompletos && (
        <div className="alert alert-warning">
          <AlertTriangle className="alert-icon" size={16} />
          <div className="alert-body">
            <strong>Dados essenciais faltando</strong>
            <span>
              {!viveiro?.densidade && 'Densidade (camarões/m²). '}
              {!viveiro?.data_inicio_ciclo && 'Data de início do ciclo. '}
              Sem isso não é possível calcular a recomendação de ração. Densidade: {densidadeFormatada} &middot; Ciclo: {cicloFormatado} &middot; DOC: {doc}
            </span>
          </div>
        </div>
      )}

      <div className="card">
        <div className="page-header">
          <div>
            <h2 className="section-title">Ração hoje &mdash; {viveiro.nome}</h2>
            <p className="page-subtitle">DOC {doc} &middot; Densidade: {densidadeFormatada} &middot; Ciclo: {cicloFormatado}</p>
          </div>
        </div>

        {recomendacao.faixa ? (
          <>
            <div className="card-row">
              <strong>{recomendacao.faixa.fase}</strong>
              <span className="page-subtitle">{recomendacao.faixa.tipoRacao} &middot; {recomendacao.faixa.proteina}% proteína</span>
            </div>

            <div className="stat-grid">
              <div className="stat-tile stat-tile-accent">
                <span className="stat-value">{recomendacao.totalKg.toFixed(1)}<span className="stat-unit">kg/dia</span></span>
                <span className="stat-label">Recomendado</span>
              </div>
              <div className={`stat-tile ${alimentouHojeManha ? 'stat-tile-good' : 'stat-tile-warning'}`}>
                <span className="stat-value">{recomendacao.manhaKg.toFixed(1)}<span className="stat-unit">kg</span></span>
                <span className="stat-label">Manhã (40%)</span>
              </div>
              <div className={`stat-tile ${alimentouHojeTarde ? 'stat-tile-good' : 'stat-tile-warning'}`}>
                <span className="stat-value">{recomendacao.tardeKg.toFixed(1)}<span className="stat-unit">kg</span></span>
                <span className="stat-label">Tarde (60%)</span>
              </div>
            </div>

            <p className="page-subtitle">
              Taxa: <strong>{recomendacao.faixa.taxaAlimentacao}% da biomassa/dia</strong> &middot;
              {' '}Biomassa est.: {recomendacao.biomassaEstimadaKg.toFixed(0)} kg &middot;
              {' '}Peso: {recomendacao.pesoEstimadoG.toFixed(1)}g &middot;
              {' '}Pop.: {recomendacao.populacaoEstimada.toLocaleString()} camarões
            </p>

            {!registroHoje && (
              <button className="btn btn-primary btn-block" onClick={preencherRecomendacao}>
                Registrar ração de hoje
              </button>
            )}
          </>
        ) : (
          <div className="empty-state">Sem recomendação disponível. Verifique se o ciclo está ativo (DOC: {doc}).</div>
        )}
      </div>

      <div className="card">
        <h3 className="section-title">Indicadores de ração</h3>
        <div className="card-row">
          <div>
            <span className={`stat-value ${fcr > 0 ? '' : ''}`}>{fcr > 0 ? fcr.toFixed(2) : '-'}</span>
            {fcr > 0 && <span className={`pill ${fcrVariant(fcr)}`} style={{ marginLeft: 'var(--space-2)' }}>{fcrLabel(fcr)}</span>}
            <div className="stat-label">FCR</div>
          </div>
        </div>
        <div className="stat-grid">
          <div className="stat-tile">
            <span className="stat-value">{racaoTotal.toFixed(1)}<span className="stat-unit">kg</span></span>
            <span className="stat-label">Ração total</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">{biomassa > 0 ? biomassa.toFixed(0) : '-'}<span className="stat-unit">kg</span></span>
            <span className="stat-label">Biomassa est.</span>
          </div>
          <div className="stat-tile">
            <span className="stat-value">R$ {gastoRacao.toFixed(2)}</span>
            <span className="stat-label">Gasto total</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-row">
          <h3 className="section-title">Tabela de referência</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowTabela(!showTabela)}>
            {showTabela ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showTabela ? 'Ocultar' : 'Ver tabela'}
          </button>
        </div>
        {showTabela && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>DOC</th><th>Fase</th><th className="num">Peso (g)</th><th className="num">Taxa</th><th>Ração</th><th className="num">Prot.</th>
                </tr>
              </thead>
              <tbody>
                {TABELA_RACAO.map((f) => (
                  <tr key={f.docMin} className={doc >= f.docMin && doc <= f.docMax ? 'active-row' : ''}>
                    <td>{f.docMin}-{f.docMax}</td>
                    <td>{f.fase}</td>
                    <td className="num">{f.pesoMedioMin}-{f.pesoMedioMax}</td>
                    <td className="num">{f.taxaAlimentacao}%</td>
                    <td>{f.tipoRacao}</td>
                    <td className="num">{f.proteina}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-row">
          <h3 className="section-title">Histórico de arraçoamento</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Inserir
          </button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Data</th><th className="num">Manhã</th><th className="num">Tarde</th><th className="num">Total</th><th></th></tr>
            </thead>
            <tbody>
              {racao.length === 0 ? (
                <tr><td colSpan={5} className="text-center">Nenhum registro</td></tr>
              ) : (
                racao.slice().reverse().map((r) => (
                  <tr key={r.id}>
                    <td>{formatDate(r.data)}</td>
                    <td className="num">{r.qntManha} kg</td>
                    <td className="num">{r.qntTarde} kg</td>
                    <td className="num"><strong>{(r.qntManha + r.qntTarde).toFixed(1)} kg</strong></td>
                    <td className="num">
                      <button className="btn btn-ghost btn-sm" onClick={() => removerColeta(r.id)}>
                        <Trash2 size={14} />
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
        title="Registrar arraçoamento"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        {recomendacao.faixa && (
          <div className="alert alert-warning" style={{ borderLeftColor: 'var(--accent)', background: 'var(--accent-soft)' }}>
            <Info className="alert-icon" size={16} />
            <div className="alert-body">
              <strong>Recomendação para DOC {doc}</strong>
              <span>Manhã: {recomendacao.manhaKg.toFixed(1)} kg &middot; Tarde: {recomendacao.tardeKg.toFixed(1)} kg &middot; Total: {recomendacao.totalKg.toFixed(1)} kg</span>
            </div>
          </div>
        )}
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.data ? 'has-error' : ''}`}>Data</label>
          <input name="data" type="date" className={`form-control ${submitted && !form.data ? 'is-invalid' : ''}`} value={form.data} onChange={handleChange} />
          <FieldError show={submitted && !form.data} message="Insira uma data" />
        </div>
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.qntManha ? 'has-error' : ''}`}>Manhã (kg)</label>
          <input
            name="qntManha" type="number" step="0.1"
            className={`form-control ${submitted && !form.qntManha ? 'is-invalid' : ''}`}
            value={form.qntManha} onChange={handleChange}
            placeholder={recomendacao.manhaKg > 0 ? `Recomendado: ${recomendacao.manhaKg.toFixed(1)} kg` : ''}
          />
          <FieldError show={submitted && !form.qntManha} message="Insira a quantidade" />
        </div>
        <div className="form-group">
          <label className={`form-label required ${submitted && !form.qntTarde ? 'has-error' : ''}`}>Tarde (kg)</label>
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
