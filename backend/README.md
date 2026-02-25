# Backend EcoMarão - Node.js + Express + PostgreSQL

Backend simples, robusto e sem problemas de encoding para o sistema EcoMarão.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web minimalista
- **PostgreSQL** - Banco de dados relacional
- **pg** - Driver PostgreSQL para Node.js
- **bcryptjs** - Hash de senhas
- **Joi** - Validação de dados
- **JWT** - Autenticação (futuro)

## 📋 Estrutura do Projeto

```
backend/
├── package.json          # Dependências e scripts
├── server.js            # Servidor principal
├── .env                 # Variáveis de ambiente
├── README.md            # Este arquivo
└── setup.sql            # Script de criação do banco
```

## 🔧 Configuração

### 1. Variáveis de Ambiente (.env)

```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/ecamarao
PORT=8000
NODE_ENV=development
HOST=localhost
DEBUG=true
```

### 2. Dependências

```bash
npm install
```

### 3. Banco de Dados

O PostgreSQL precisa estar rodando com o banco `ecamarao` criado.

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Iniciar Servidor

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

### 3. Acessar API

- **Servidor**: http://localhost:8000
- **Health Check**: http://localhost:8000/health
- **Documentação**: http://localhost:8000/docs

## 📋 Endpoints

### Health Check

```http
GET /health
```

### Usuários

```http
POST /api/users/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@ecamarao.com",
  "password": "admin123",
  "role": "admin"
}
```

```http
GET /api/users
```

### Viveiros

```http
POST /api/viveiros
Content-Type: application/json

{
  "nome": "Viveiro Principal",
  "densidade": 80.0,
  "area": 2000.0,
  "data_inicio_ciclo": "2024-01-15",
  "status": "ativo"
}
```

```http
GET /api/viveiros
```

### Estatísticas

```http
GET /api/stats
```

## 🧪 Testes

### Health Check

```bash
curl http://localhost:8000/health
```

### Registrar Usuário

```bash
curl -X POST "http://localhost:8000/api/users/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@ecamarao.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### Listar Usuários

```bash
curl http://localhost:8000/api/users
```

### Criar Viveiro

```bash
curl -X POST "http://localhost:8000/api/viveiros" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Viveiro Teste",
    "densidade": 80.0,
    "area": 2000.0,
    "data_inicio_ciclo": "2024-01-15",
    "status": "ativo"
  }'
```

## 🎯 Vantagens

✅ **Sem Encoding Problems**: Node.js lida melhor com UTF-8  
✅ **Performance**: Node.js + Express é muito rápido  
✅ **Simplicidade**: Código limpo e fácil de entender  
✅ **Robusto**: Tratamento completo de erros  
✅ **Escalável**: Fácil de expandir e manter  
✅ **Padrão**: Usa tecnologias consolidadas  

## 🔄 Deploy

### 1. Produção

```bash
NODE_ENV=production npm start
```

### 2. PM2 (Process Manager)

```bash
npm install -g pm2
pm2 start server.js --name "ecamarao-backend"
```

## 📝 Logs

O backend usa Morgan para logs HTTP no formato combined.

## 🔐 Segurança

- **Helmet**: Headers de segurança
- **CORS**: Configurado para desenvolvimento
- **bcrypt**: Hash de senhas com salt rounds
- **JWT**: Tokens para autenticação (implementar)

## 🚀 Performance

- **Connection Pool**: Reutiliza conexões PostgreSQL
- **Async/Await**: Operações não bloqueantes
- **JSON Limit**: 10MB para uploads
- **Timeout**: Configurado para 30s

---

**Backend EcoMarão - Simples, Robusto e Funcional!** 🎉
