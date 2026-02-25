# 🐳 Docker EcoMarão - Guia Rápido

## 🚀 Iniciar Tudo
```bash
# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

## 🛠️ Comandos Úteis
```bash
# Parar tudo
docker-compose down

# Reconstruir imagens
docker-compose build --no-cache

# Reiniciar serviço específico
docker-compose restart backend

# Acessar container
docker-compose exec backend sh
docker-compose exec frontend sh

# Backup do banco
docker-compose exec postgres pg_dump -U postgres ecamarao > backup.sql

# Restaurar banco
docker-compose exec -T postgres psql -U postgres ecamarao < backup.sql
```

## 📊 Acessos
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Banco**: localhost:5432
- **Nginx (produção)**: http://localhost:80

## 🔧 Desenvolvimento
```bash
# Modo desenvolvimento (com hot-reload)
docker-compose -f docker-compose.dev.yml up

# Produção
docker-compose -f docker-compose.prod.yml up -d
```

## 📱 Deploy em Produção
```bash
# Build para produção
docker-compose -f docker-compose.prod.yml build

# Subir para produção
docker-compose -f docker-compose.prod.yml up -d

# Escalar frontend
docker-compose -f docker-compose.prod.yml up -d --scale frontend=3
```

## 🐛 Debug
```bash
# Ver logs de erro
docker-compose logs backend

# Ver recursos
docker stats

# Limpar tudo
docker-compose down -v --rmi all
