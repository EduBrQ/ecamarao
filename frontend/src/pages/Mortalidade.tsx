import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { Card, StatTile, Table, Button, IconButton, Input, Select, EmptyState, Spinner, Alert } from '@edubrq/design-system'
import Modal from '../components/Modal'
import { backendApi, getErrorMessage, Viveiro, RegistroMortalidade } from '../services/backendApi'
import { calcularSobrevivencia } from '../models/types'

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return date.toLocaleDateString('pt-BR')
}

function sobrevivenciaVariant(val: number): string {
  if (val >= 80) return 'stat-tile-good'
  if (val >= 60) return 'stat-tile-warning'
  return 'stat-tile-critical'
}

const CAUSAS = [
  'Estresse térmico', 'Baixo oxigênio', 'Doença (WSSV)', 'Doença (Vibrio)',
  'Doença (EMS/AHPND)', 'Predadores', 'Qualidade da água', 'Manejo inadequado',
  'Causa desconhecida', 'Outra',
]

function Mortalidade() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [registros, setRegistros] = useState<RegistroMortalidade[]>([])
  const [viveiro, setViveiro] = useState<Viveiro | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ data: '', quantidade: '', causa: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!viveiroId) return
      try {
        setLoading(true)
        setError(null)
        const [viveiroData, registrosData] = await Promise.all([
          backendApi.getViveiroById(viveiroId),
          backendApi.getRegistrosMortalidade(viveiroId),
        ])
        setViveiro(viveiroData)
        setRegistros(registrosData)
      } catch (err) {
        console.error('Erro ao carregar dados de mortalidade:', err)
        setError('Erro ao carregar dados do viveiro')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [viveiroId])

  if (loading) {
    return <div className="page fade-in"><Card className="text-center"><Spinner /> Carregando dados de mortalidade...</Card></div>
  }
  if (error) {
    return <div className="page fade-in"><Alert tone="danger">{error}</Alert></div>
  }
  if (!viveiro) {
    return <div className="page fade-in"><EmptyState title="Viveiro não encontrado" /></div>
  }

  const mortalidadeTotal = registros.reduce((acc, r) => acc + r.quantidade, 0)
  const densidade = viveiro?.densidade ?? 0
  const area = viveiro?.area ?? 0
  const populacaoInicial = densidade * area
  const sobrevivencia = calcularSobrevivencia(densidade, area, mortalidadeTotal)
  const vivos = populacaoInicial - mortalidadeTotal

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSubmitted(true)
    if (!form.data || !form.quantidade || !form.causa) return
    try {
      await backendApi.createRegistroMortalidade(viveiroId!, {
        data: form.data,
        quantidade: Number(form.quantidade),
        causa: form.causa,
      })
      setRegistros(await backendApi.getRegistrosMortalidade(viveiroId!))
      setModalOpen(false)
      setSubmitted(false)
      setForm({ data: '', quantidade: '', causa: '' })
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao salvar registro de mortalidade'))
    }
  }

  const removerRegistro = async (itemId: number) => {
    try {
      await backendApi.deleteRegistroMortalidade(viveiroId!, itemId.toString())
      setRegistros(await backendApi.getRegistrosMortalidade(viveiroId!))
    } catch (err) {
      setError(getErrorMessage(err, 'Erro ao deletar registro de mortalidade'))
    }
  }

  return (
    <div className="page fade-in">
      <Card>
        <h2 className="section-title">Mortalidade &mdash; {viveiro.nome}</h2>
        <div className="stat-grid">
          <StatTile className={sobrevivenciaVariant(sobrevivencia)} label="Sobrevivência" value={sobrevivencia.toFixed(1)} unit="%" />
          <StatTile label="Pop. inicial" value={populacaoInicial.toLocaleString('pt-BR')} />
          <StatTile className="stat-tile-critical" label="Mortalidade" value={mortalidadeTotal.toLocaleString('pt-BR')} />
          <StatTile className="stat-tile-good" label="Vivos est." value={vivos.toLocaleString('pt-BR')} />
        </div>
      </Card>

      <Card>
        <div className="card-row">
          <h3 className="section-title">Registros</h3>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Registrar
          </Button>
        </div>

        {registros.length === 0 ? (
          <EmptyState title="Nenhum registro de mortalidade. Isso é bom!" />
        ) : (
          <div className="table-wrapper">
            <Table>
              <Table.Head>
                <Table.Row><Table.Th>Data</Table.Th><Table.Th className="num">Qtd</Table.Th><Table.Th>Causa</Table.Th><Table.Th></Table.Th></Table.Row>
              </Table.Head>
              <Table.Body>
                {registros.slice().reverse().map((r) => (
                  <Table.Row key={r.id}>
                    <Table.Td>{formatDate(r.data)}</Table.Td>
                    <Table.Td className="num">{r.quantidade.toLocaleString('pt-BR')}</Table.Td>
                    <Table.Td>{r.causa}</Table.Td>
                    <Table.Td className="num">
                      <IconButton variant="ghost" size="sm" onClick={() => removerRegistro(r.id)} aria-label="Excluir" icon={<Trash2 size={14} />} />
                    </Table.Td>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </Card>

      <Modal
        title="Registrar mortalidade"
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSubmitted(false) }}
        onSave={handleSave}
      >
        <Input
          name="data" type="date" label="Data" required
          value={form.data} onChange={handleChange}
          error={submitted && !form.data ? 'Insira a data' : undefined}
        />
        <Input
          name="quantidade" type="number" label="Quantidade" required
          value={form.quantidade} onChange={handleChange}
          placeholder="Número de camarões mortos"
          error={submitted && !form.quantidade ? 'Insira a quantidade' : undefined}
        />
        <Select
          name="causa" label="Causa provável" required
          value={form.causa} onChange={handleChange}
          placeholder="Selecione..."
          options={CAUSAS.map((c) => ({ value: c, label: c }))}
          error={submitted && !form.causa ? 'Selecione a causa' : undefined}
        />
      </Modal>
    </div>
  )
}

export default Mortalidade
