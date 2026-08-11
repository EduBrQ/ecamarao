import { useEffect, useState } from 'react'
import { Sprout, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { Card, Button, Input, Alert, Spinner, Modal, EmptyState } from '@edubrq/design-system'
import { auth, backendApi, getErrorMessage, AuthUser } from '../services/backendApi'
import { useToastGlobal } from '../hooks/useToastGlobal'

const CONFIRMACAO_LIMPAR = 'LIMPAR'

function Configuracoes() {
  const toast = useToastGlobal()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [seedModalOpen, setSeedModalOpen] = useState(false)
  const [clearModalOpen, setClearModalOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    auth.me().then(setUser).catch(() => setUser(null)).finally(() => setLoadingUser(false))
  }, [])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const resultado = await backendApi.seedDemoData()
      toast.success(
        'Dados de demonstração criados',
        `${resultado.viveiros} viveiros, ${resultado.racoes} registros de ração, ${resultado.mortalidades} de mortalidade e ${resultado.medicoes} medições de água.`,
      )
      setSeedModalOpen(false)
    } catch (err) {
      toast.error('Erro ao gerar dados', getErrorMessage(err, 'Não foi possível gerar os dados de demonstração'))
    } finally {
      setSeeding(false)
    }
  }

  const handleClear = async () => {
    if (confirmText !== CONFIRMACAO_LIMPAR) return
    setClearing(true)
    try {
      await backendApi.clearData()
      toast.success('Base de dados limpa', 'Todos os viveiros e registros foram removidos.')
      setClearModalOpen(false)
      setConfirmText('')
    } catch (err) {
      toast.error('Erro ao limpar dados', getErrorMessage(err, 'Não foi possível limpar a base de dados'))
    } finally {
      setClearing(false)
    }
  }

  if (loadingUser) {
    return <div className="page fade-in"><Card className="text-center"><Spinner /> Carregando...</Card></div>
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="page fade-in">
        <Card>
          <EmptyState icon={<ShieldAlert size={28} />} title="Acesso restrito" description="Esta página é exclusiva para administradores." />
        </Card>
      </div>
    )
  }

  return (
    <div className="page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurações</h1>
          <p className="page-subtitle">Ferramentas administrativas</p>
        </div>
      </div>

      <Card>
        <h3 className="section-title"><Sprout size={16} /> Dados de demonstração</h3>
        <p className="page-subtitle">
          Popula a base com 10 viveiros fictícios simulando um ano de operação de uma fazenda de
          camarão cinza (L. vannamei) no Nordeste: ciclos de 75-95 dias com despesca entre 8-10g,
          povoamento de 80 a 150 mil pós-larvas por viveiro (conforme a área) e cerca de 2 semanas de
          preparo entre um ciclo e o próximo. Inclui histórico de ração, mortalidade, qualidade da
          água e aeradores. <strong>Isso substitui todos os dados atuais.</strong>
        </p>
        <Button onClick={() => setSeedModalOpen(true)}>
          <Sprout size={16} /> Popular com dados de demonstração
        </Button>
      </Card>

      <Card style={{ borderColor: 'var(--danger)' }}>
        <h3 className="section-title"><AlertTriangle size={16} /> Zona de risco</h3>
        <p className="page-subtitle">
          Remove permanentemente todos os viveiros e seus registros de ração, mortalidade, qualidade
          da água e aeradores. O login de administrador não é afetado. Esta ação não pode ser desfeita.
        </p>
        <Button variant="danger" onClick={() => setClearModalOpen(true)}>
          <Trash2 size={16} /> Limpar base de dados
        </Button>
      </Card>

      <Modal
        open={seedModalOpen}
        onClose={() => !seeding && setSeedModalOpen(false)}
        title="Popular dados de demonstração"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSeedModalOpen(false)} disabled={seeding}>Cancelar</Button>
            <Button onClick={handleSeed} disabled={seeding}>
              {seeding ? <><Spinner size="sm" /> Gerando...</> : 'Confirmar'}
            </Button>
          </>
        }
      >
        <Alert tone="warning" icon={<AlertTriangle size={16} />} title="Isso é produção.">
          Todos os viveiros e registros existentes serão apagados e substituídos pelos dados fictícios. Confirma?
        </Alert>
      </Modal>

      <Modal
        open={clearModalOpen}
        onClose={() => {
          if (clearing) return
          setClearModalOpen(false)
          setConfirmText('')
        }}
        title="Limpar base de dados"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setClearModalOpen(false); setConfirmText('') }} disabled={clearing}>Cancelar</Button>
            <Button variant="danger" onClick={handleClear} disabled={clearing || confirmText !== CONFIRMACAO_LIMPAR}>
              {clearing ? <><Spinner size="sm" /> Limpando...</> : 'Limpar tudo'}
            </Button>
          </>
        }
      >
        <Alert tone="danger" icon={<AlertTriangle size={16} />} title="Isso é produção — ação irreversível.">
          Todos os viveiros e seus registros serão apagados permanentemente.
        </Alert>
        <Input
          label={<>Digite <strong>{CONFIRMACAO_LIMPAR}</strong> para confirmar</>}
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoFocus
        />
      </Modal>
    </div>
  )
}

export default Configuracoes
