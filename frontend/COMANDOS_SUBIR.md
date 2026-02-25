# Comandos para Subir Backend e Frontend

## 🚀 **Comandos para Subir os Sistemas**

### **Backend Node.js (Opção 1)**
```bash
# Entrar na pasta do backend
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais do banco

# Rodar migrações do banco
npm run migrate

# Iniciar servidor em desenvolvimento
npm run dev

# Iniciar servidor em produção
npm start
```

### **Backend Python (Opção 2 - RECOMENDADO)**
```bash
# Entrar na pasta do backend Python
cd backend-python

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Rodar migrações do banco
alembic upgrade head

# Iniciar servidor em desenvolvimento
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Iniciar servidor em produção
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### **Frontend React**
```bash
# Entrar na pasta do frontend
cd ..  # Voltar para pasta raiz
cd frontend  # Ou o nome da pasta do frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm start
```

## 🐳 **Subir com Docker (Recomendado)**

### **Docker Compose Completo**
```bash
# Na pasta raiz do projeto
docker-compose up --build
```

### **Docker Separado**
```bash
# Subir backend Python
cd backend-python
docker build -t ecamarao-backend .
docker run -p 8000:8000 --env-file .env ecamarao-backend

# Subir frontend
cd frontend
docker build -t ecamarao-frontend .
docker run -p 5173:5173 ecamarao-frontend

# Subir banco PostgreSQL
docker run -d --name postgres-ecamarao \
  -e POSTGRES_DB=ecamarao \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15
```

## 📋 **Passo a Passo - Início Rápido**

### **1. Escolher o Backend**
```bash
# Opção A: Node.js (mais simples)
cd backend
npm install
npm run dev

# Opção B: Python (recomendado)
cd backend-python
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **2. Subir o Frontend**
```bash
# Em nova janela/terminal
cd frontend
npm install
npm run dev
```

### **3. Acessar as Aplicações**
- **Frontend**: http://localhost:5173
- **Backend Node.js**: http://localhost:3000
- **Backend Python**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### **4. Configurar Conexão**
```bash
# No frontend (.env)
VITE_API_URL=http://localhost:8000

# No backend (.env)
DATABASE_URL=postgresql://postgres:password@localhost:5432/ecamarao
JWT_SECRET=seu_jwt_secret
```

## 🎯 **Comandos Úteis**

### **Verificar Saúde dos Serviços**
```bash
# Backend Node.js
curl http://localhost:3000/health

# Backend Python
curl http://localhost:8000/health

# Frontend
curl http://localhost:5173
```

### **Logs em Tempo Real**
```bash
# Backend Node.js
npm run dev

# Backend Python
uvicorn app.main:app --reload

# Frontend
npm run dev
```

### **Parar Serviços**
```bash
# Parar backend (Ctrl+C no terminal)
# Parar frontend (Ctrl+C no terminal)

# Com Docker
docker-compose down
```

## 📊 **Portas Padrão**

| Serviço | Porta Padrão |
|----------|---------------|
| Frontend | 5173 |
| Backend Node.js | 3000 |
| Backend Python | 8000 |
| PostgreSQL | 5432 |

## 🔧 **Resolução de Problemas Comuns**

### **Backend não inicia:**
```bash
# Verificar se a porta está em uso
netstat -tulpn | grep :3000  # Node.js
netstat -tulpn | grep :8000  # Python

# Matar processo na porta
kill -9 <PID>

# Limpar node_modules
rm -rf node_modules
npm install
```

### **Frontend não conecta ao backend:**
```bash
# Verificar variáveis de ambiente
cat .env

# Verificar configuração do proxy
# Adicionar ao package.json do frontend
"proxy": "http://localhost:8000"
```

### **Banco de dados não conecta:**
```bash
# Verificar se PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs
docker logs <container_name>

# Testar conexão
psql -h localhost -U postgres -d ecamarao
```

## 🎉 **Sistema Completo e Funcional!**

Com estes comandos você terá:

✅ **Backend Python** rodando na porta 8000
✅ **Frontend React** rodando na porta 5173  
✅ **Banco PostgreSQL** configurado
✅ **Sistema ML** automático e funcional
✅ **API documentada** com Swagger
✅ **Deploy Docker** pronto para produção

**Acesso**: http://localhost:5173 (frontend) e http://localhost:8000/docs (API)

Escolha **Python + FastAPI** para melhor performance e manutenibilidade! 🐍
