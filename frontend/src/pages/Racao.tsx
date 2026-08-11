import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Info, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Card, StatTile, Badge, Table, Button, IconButton, Input, Alert, EmptyState, Spinner,
  type BadgeTone,
} from '@edubrq/design-system'
import { backendApi, getErrorMessage, Viveiro } from '../services/backendApi'
import { useToastGlobal } from '../hooks/useToastGlobal'
import Modal from '../components/Modal'
import {
  ColetaRacao, RegistroMortalidade,
  calcularFCR, calcularDOC,
  calcularRacaoDiariaAvancada, TABELA_RACAO,
} from '../models/types'

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function fcrTone(val: number): BadgeTone {
  if (val <= 0) return 'neutral'
  if (val <= 1.5) return 'success'
  if (val <= 2.0) return 'warning'
  return 'danger'
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viveiroId])

  if (loading) {
    return <div className="page fade-in"><Card className="text-center"><Spinner /> Carregando dados de ração...</Card></div>
  }
  if (error) {
    return <div className="page fade-in"><Alert tone="danger">{error}</Alert></div>
  }
  if (!viveiro) {
    return <div className="page fade-in"><EmptyState title="Viveiro não encontrado" /></div>
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
        <Alert tone="warning" icon={<AlertTriangle size={16} />} title="Dados essenciais faltando">
          {!viveiro?.densidade && 'Densidade (camarões/m²). '}
          {!viveiro?.data_inicio_ciclo && 'Data de início do ciclo. '}
          Sem isso não é possível calcular a recomendação de ração. Densidade: {densidadeFormatada} &middot; Ciclo: {cicloFormatado} &middot; DOC: {doc}
        </Alert>
      )}

      <Card>
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
              <StatTile className="stat-tile-accent" label="Recomendado" value={recomendacao.totalKg.toFixed(1)} unit="kg/dia" />
              <StatTile className={alimentouHojeManha ? 'stat-tile-good' : 'stat-tile-warning'} label="Manhã (40%)" value={recomendacao.manhaKg.toFixed(1)} unit="kg" />
              <StatTile className={alimentouHojeTarde ? 'stat-tile-good' : 'stat-tile-warning'} label="Tarde (60%)" value={recomendacao.tardeKg.toFixed(1)} unit="kg" />
            </div>

            <p className="page-subtitle">
              Taxa: <strong>{recomendacao.faixa.taxaAlimentacao}% da biomassa/dia</strong> &middot;
              {' '}Biomassa est.: {recomendacao.biomassaEstimadaKg.toFixed(0)} kg &middot;
              {' '}Peso: {recomendacao.pesoEstimadoG.toFixed(1)}g &middot;
              {' '}Pop.: {recomendacao.populacaoEstimada.toLocaleString()} camarões
            </p>

            {!registroHoje && (
              <Button className="btn-block" onClick={preencherRecomendacao}>
                Registrar ração de hoje
              </Button>
            )}
          </>
        ) : (
          <EmptyState title={`Sem recomendação disponível. Verifique se o ciclo está ativo (DOC: ${doc}).`} />
        )}
      </Card>

      <Card>
        <h3 className="section-title">Indicadores de ração</h3>
        <div className="card-row">
          <div>
            <span className="stat-value">{fcr > 0 ? fcr.toFixed(2) : '-'}</span>
            {fcr > 0 && <Badge tone={fcrTone(fcr)} style={{ marginLeft: 'var(--space-2)' }}>{fcrLabel(fcr)}</Badge>}
            <div className="stat-label">FCR</div>
          </div>
        </div>
        <div className="stat-grid">
          <StatTile label="Ração total" value={racaoTotal.toFixed(1)} unit="kg" />
          <StatTile label="Biomassa est." value={biomassa > 0 ? biomassa.toFixed(0) : '-'} unit="kg" />
          <StatTile label="Gasto total" value={`R$ ${gastoRacao.toFixed(2)}`} />
        </div>
      </Card>

      <Card>
        <div className="card-row">
          <h3 className="section-title">Tabela de referência</h3>
          <Button variant="secondary" size="sm" onClick={() => setShowTabela(!showTabela)}>
            {showTabela ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showTabela ? 'Ocultar' : 'Ver tabela'}
          </Button>
        </div>
        {showTabela && (
          <div className="table-wrapper">
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Th>DOC</Table.Th><Table.Th>Fase</Table.Th><Table.Th className="num">Peso (g)</Table.Th><Table.Th className="num">Taxa</Table.Th><Table.Th>Ração</Table.Th><Table.Th className="num">Prot.</Table.Th>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {TABELA_RACAO.map((f) => (
                  <Table.Row key={f.docMin} className={doc >= f.docMin && doc <= f.docMax ? 'active-row' : ''}>
                    <Table.Td>{f.docMin}-{f.docMax}</Table.Td>
                    <Table.Td>{f.fase}</Table.Td>
                    <Table.Td className="num">{f.pesoMedioMin}-{f.pesoMedioMax}</Table.Td>
                    <Table.Td className="num">{f.taxaAlimentacao}%</Table.Td>
                    <Table.Td>{f.tipoRacao}</Table.Td>
                    <Table.Td className="num">{f.proteina}%</Table.Td>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </Card>

      <Card>
        <div className="card-row">
          <h3 className="section-title">Histórico de arraçoamento</h3>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Inserir
          </Button>
        </div>
        <div className="table-wrapper">
          <Table>
            <Table.Head>
              <Table.Row><Table.Th>Data</Table.Th><Table.Th className="num">Manhã</Table.Th><Table.Th className="num">Tarde</Table.Th><Table.Th className="num">Total</Table.Th><Table.Th></Table.Th></Table.Row>
            </Table.Head>
            <Table.Body>
              {racao.length === 0 ? (
                <Table.Row><Table.Td colSpan={5} className="text-center">Nenhum registro</Table.Td></Table.Row>
              ) : (
                racao.slice().reverse().map((r) => (
                  <Table.Row key={r.id}>
                    <Table.Td>{formatDate(r.data)}</Table.Td>
                    <Table.Td className="num">{r.qntManha} kg</Table.Td>
                    <Table.Td className="num">{r.qntTarde} kg</Table.Td>
                    <Table.Td className="num"><strong>{(r.qntManha + r.qntTarde).toFixed(1)} kg</strong></Table.Td>
                    <Table.Td className="num">
                      <IconButton variant="ghost" size="sm" onClick={() => removerColeta(r.id)} aria-label="Excluir" icon={<Trash2 size={14} />} />
                    </Table.Td>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>
      </Card>

      <Modal
        title="Registrar arraçoamento"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        {recomendacao.faixa && (
          <Alert tone="accent" icon={<Info size={16} />} title={`Recomendação para DOC ${doc}`}>
            Manhã: {recomendacao.manhaKg.toFixed(1)} kg &middot; Tarde: {recomendacao.tardeKg.toFixed(1)} kg &middot; Total: {recomendacao.totalKg.toFixed(1)} kg
          </Alert>
        )}
        <Input
          name="data" type="date" label="Data" required
          value={form.data} onChange={handleChange}
          error={submitted && !form.data ? 'Insira uma data' : undefined}
        />
        <Input
          name="qntManha" type="number" step="0.1" label="Manhã (kg)" required
          value={form.qntManha} onChange={handleChange}
          placeholder={recomendacao.manhaKg > 0 ? `Recomendado: ${recomendacao.manhaKg.toFixed(1)} kg` : ''}
          error={submitted && !form.qntManha ? 'Insira a quantidade' : undefined}
        />
        <Input
          name="qntTarde" type="number" step="0.1" label="Tarde (kg)" required
          value={form.qntTarde} onChange={handleChange}
          placeholder={recomendacao.tardeKg > 0 ? `Recomendado: ${recomendacao.tardeKg.toFixed(1)} kg` : ''}
          error={submitted && !form.qntTarde ? 'Insira a quantidade' : undefined}
        />
      </Modal>
    </div>
  )
}

export default Racao
