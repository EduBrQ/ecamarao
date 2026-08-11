import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { Card, Input, Button, Alert } from '@edubrq/design-system'
import { auth } from '../services/backendApi'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await auth.login(username, password)
      navigate('/home-page')
    } catch {
      setError('Usuário ou senha inválidos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page fade-in">
      <div className="login-card">
        <div className="login-brand">
          <img src="/img/shrimp.svg" alt="" width={40} height={40} />
          <span className="header-title" style={{ fontSize: '1.3rem' }}>ecamarao</span>
        </div>

        <form onSubmit={handleSubmit}>
          <Card style={{ gap: 'var(--space-4)' }}>
            <Input
              label="Usuário"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <Input
              type="password"
              label="Senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <Alert tone="danger">{error}</Alert>}
            <Button type="submit" className="btn-block" disabled={loading}>
              <LogIn size={16} />
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </Card>
        </form>
      </div>
    </div>
  )
}

export default Login
