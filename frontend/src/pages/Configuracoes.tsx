import { useEffect, useState } from 'react'
import { Sprout, Trash2, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react'
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
    return <div className="page fade-in"><div className="card text-center"><Loader2 className="spinner" size={20} />Carregando...</div></div>
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="page fade-in">
        <div className="card text-center">
          <ShieldAlert size={28} style={{ marginBottom: 'var(--space-2)' }} />
          <strong>Acesso restrito</strong>
          <p className="page-subtitle">Esta página é exclusiva para administradores.</p>
        </div>
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

      <div className="card">
        <h3 className="section-title"><Sprout size={16} /> Dados de demonstração</h3>
        <p className="page-subtitle">
          Popula a base com 10 viveiros fictícios simulando um ano de operação de uma fazenda de
          camarão cinza (L. vannamei) no Nordeste: ciclos de 75-95 dias com despesca entre 8-10g,
          povoamento de 80 a 150 mil pós-larvas por viveiro (conforme a área) e cerca de 2 semanas de
          preparo entre um ciclo e o próximo. Inclui histórico de ração, mortalidade, qualidade da
          água e aeradores. <strong>Isso substitui todos os dados atuais.</strong>
        </p>
        <button className="btn btn-primary" onClick={() => setSeedModalOpen(true)}>
          <Sprout size={16} /> Popular com dados de demonstração
        </button>
      </div>

      <div className="card" style={{ borderColor: 'var(--danger)' }}>
        <h3 className="section-title"><AlertTriangle size={16} /> Zona de risco</h3>
        <p className="page-subtitle">
          Remove permanentemente todos os viveiros e seus registros de ração, mortalidade, qualidade
          da água e aeradores. O login de administrador não é afetado. Esta ação não pode ser desfeita.
        </p>
        <button className="btn btn-danger" onClick={() => setClearModalOpen(true)}>
          <Trash2 size={16} /> Limpar base de dados
        </button>
      </div>

      {seedModalOpen && (
        <div className="modal-overlay" onClick={() => !seeding && setSeedModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Popular dados de demonstração</h3>
            </div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <AlertTriangle className="alert-icon" size={16} />
                <div className="alert-body">
                  <strong>Isso é produção.</strong>
                  <span>Todos os viveiros e registros existentes serão apagados e substituídos pelos dados fictícios. Confirma?</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSeedModalOpen(false)} disabled={seeding}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSeed} disabled={seeding}>
                {seeding ? <><Loader2 className="spinner" size={14} /> Gerando...</> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {clearModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (clearing) return
            setClearModalOpen(false)
            setConfirmText('')
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Limpar base de dados</h3>
            </div>
            <div className="modal-body">
              <div className="alert alert-critical">
                <AlertTriangle className="alert-icon" size={16} />
                <div className="alert-body">
                  <strong>Isso é produção — ação irreversível.</strong>
                  <span>Todos os viveiros e seus registros serão apagados permanentemente.</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Digite <strong>{CONFIRMACAO_LIMPAR}</strong> para confirmar</label>
                <input
                  className="form-control"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setClearModalOpen(false); setConfirmText('') }} disabled={clearing}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleClear} disabled={clearing || confirmText !== CONFIRMACAO_LIMPAR}>
                {clearing ? <><Loader2 className="spinner" size={14} /> Limpando...</> : 'Limpar tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Configuracoes
