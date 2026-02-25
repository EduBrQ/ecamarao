# Deploy no Render - Passo a Passo

## 🚀 Deploy Automático com Render

### Pré-requisitos
- Conta no Render (criada com GitHub)
- Projeto no GitHub com todo o código
- Variáveis de ambiente configuradas

### Passo 1: Preparar Repositório

1. **Commitar tudo**:
   ```bash
   git add .
   git commit -m "feat: add render deployment config"
   git push
   ```

2. **Verificar arquivos criados**:
   - `render.yaml` (configuração do Render)
   - `docker-compose.prod.yml` (produção)
   - `.env.example` (variáveis de ambiente)

### Passo 2: Configurar no Render

1. **Acessar**: [dashboard.render.com](https://dashboard.render.com)
2. **Clicar**: "New +" → "Web Service"
3. **Conectar**: GitHub repository
4. **Selecionar**: Repositório `ecamarao`
5. **Usar**: Configuração existente (detecta `render.yaml`)

### Passo 3: Configurar Variáveis de Ambiente

No painel do Render, adicionar:

**Para o Backend**:
```
NODE_ENV=production
DATABASE_URL=postgresql://ecamarao_user:senha@db:5432/ecamarao_prod
JWT_SECRET=sua_jwt_secret
SESSION_SECRET=sua_session_secret
```

**Para o Frontend**:
```
VITE_API_URL=
```

### Passo 4: Configurar Banco de Dados

1. **Criar**: "New +" → "PostgreSQL"
2. **Nome**: `ecamarao-db`
3. **Plano**: Free (ok para começar)
4. **Copiar**: Connection string
5. **Colar**: nas variáveis do backend

### Passo 5: Ajustar URLs

Após deploy, atualize:
- `render.yaml` com domínios corretos
- Frontend apontando para backend real

### Passo 6: Testar

1. **Backend**: `https://seu-backend.onrender.com/health`
2. **Frontend**: `https://seu-app.onrender.com`
3. **API**: `https://seu-app.onrender.com/api/viveiros`

## 🔧 Deploy Manual (Alternativa)

### Usando Docker Compose

1. **No servidor**:
   ```bash
   # Clonar repositório
   git clone https://github.com/EduBrQ/ecamarao.git
   cd ecamarao
   
   # Configurar variáveis
   cp .env.example .env
   # Editar .env com senhas reais
   
   # Subir serviços
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Configurar Nginx** (se necessário):
   ```nginx
   server {
       listen 80;
       server_name seu-dominio.com;
       
       location /api/ {
           proxy_pass http://localhost:8000;
       }
       
       location / {
           proxy_pass http://localhost:3000;
       }
   }
   ```

## 📱 Deploy dos Apps Móveis

### Android
1. **Atualizar URL** em `MainActivity.kt`:
   ```kotlin
   private const val WEB_APP_URL = "https://seu-app.onrender.com"
   ```

2. **Build de produção**:
   ```bash
   cd mobile/android
   ./gradlew assembleRelease
   ```

### iOS
1. **Atualizar URL** em `EcamaraoApp.swift`:
   ```swift
   guard let url = URL(string: "https://seu-app.onrender.com") else { return }
   ```

2. **Build via Xcode**: Product → Archive

## 🛠️ Troubleshooting

### Problemas Comuns

1. **CORS em produção**:
   - Verifique se `VITE_API_URL` está vazia
   - Confirme proxy do Nginx

2. **Database connection failed**:
   - Verifique string de conexão
   - Confirme se banco está rodando

3. **Build falha**:
   - Verifique `render.yaml`
   - Confirme Dockerfiles

4. **App não carrega**:
   - Verifique logs no Render
   - Teste URLs individualmente

### Comandos Úteis

```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

## 🎯 Próximos Passos

- [ ] Configurar domínio personalizado
- [ ] Adicionar SSL (já vem no Render)
- [ ] Configurar backup automático
- [ ] Monitoramento e alertas
- [ ] CI/CD automatizado
