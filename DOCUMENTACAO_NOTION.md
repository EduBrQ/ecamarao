# 🦐 AquaFarm - Sistema de Gerenciamento de Viveiros

## 📋 Visão Geral
Sistema completo para gestão de viveiros de camarão com dashboard em tempo real, controle de alimentação e métricas de cultivo.

---

## ✅ Status das Funcionalidades

### 📱 Frontend
| Funcionalidade | Status | Detalhes |
|---|---|---|
| Home | ✅ | Cards interativos de viveiros |
| Dashboard Fazenda | ✅ | Visão aggregada com métricas |
| Viveiro Individual | ✅ | Detalhes completos |
| Ração | ✅ | Controle diário de alimentação |
| Mortalidade | ✅ | Registro de mortalidade |
| Anotações | ✅ | Notas e observações |
| Aeradores | ✅ | Gestão de aeradores |
| Ciclo | ✅ | Informações do ciclo |

### 🎨 UI/UX
| Componente | Status | Implementação |
|---|---|---|
| Toast Global | ✅ | Sistema de notificações |
| Modal Confirmação | ✅ | Delete confirmation |
| Loading States | ✅ | Feedback visual |
| Error Handling | ✅ | Tratamento amigável |
| Responsive Design | ✅ | Mobile + Desktop |

### ⚙️ Backend
| Endpoint | Status | Método |
|---|---|---|
| /api/viveiros | ✅ | CRUD completo |
| /api/fazenda/dashboard | ✅ | Dashboard aggregado |
| /api/viveiros/:id/racao | ✅ | Ração CRUD |
| /api/viveiros/:id/mortalidade | ✅ | Mortalidade CRUD |
| Validações | ✅ | Joi schemas |
| Error Handling | ✅ | Respostas consistentes |

### 🗄️ Database
| Tabela | Status | Relacionamentos |
|---|---|---|
| viveiros | ✅ | PK id |
| coletas_racao | ✅ | FK viveiros |
| registros_mortalidade | ✅ | FK viveiros |
| Migrations | ✅ | Auto-criação |
| Índices | ✅ | Performance |

### 🚀 Infraestrutura
| Serviço | Status | Provider |
|---|---|---|
| Frontend Hosting | ✅ | AWS S3 |
| CDN | ✅ | CloudFront |
| Backend | ✅ | EC2 + PM2 |
| Database | ✅ | PostgreSQL |
| CI/CD | ✅ | Scripts automatizados |

---

## 🏗️ Arquitetura

### 📁 Estrutura de Pastas

```
ecamarao/
├── frontend/
│   ├── src/
│   │   ├── components/     # Modal, Toast, Header, Footer
│   │   ├── pages/         # Home, Dashboard, Racao, etc.
│   │   ├── services/      # backendApi.ts
│   │   ├── hooks/         # useToastGlobal.tsx
│   │   ├── models/        # types.ts
│   │   └── styles/        # CSS global
│   └── dist/             # Build produção
├── backend/
│   ├── server_with_docs.js  # API + Swagger
│   ├── server.js          # Dev server
│   └── package.json
└── docs/
    └── DOCUMENTACAO_NOTION.md
```

### 🔄 Fluxo de Dados

```
Frontend React App
    ↓ HTTP/REST API
Backend Express.js
    ↓ SQL Queries
PostgreSQL Database
    ↓ Response JSON
Frontend Update UI
```

---

## 🎯 Funcionalidades Principais

### Dashboard da Fazenda
- **Métricas**: Viveiros ativos, ração hoje, biomassa, FCR
- **Status**: Alimentação (completo/parcial/pendente)
- **Actions**: Quick feed buttons
- **Export**: CSV download

### Sistema de Toast
- **Tipos**: Success ✅, Error ❌, Warning ⚠️, Info ℹ️
- **Duração**: 5s auto-dismiss
- **Posição**: Top-right fixo
- **Animações**: Slide-in/out

### Modal de Confirmação
- **Trigger**: Delete actions
- **Design**: Backdrop + centered modal
- **Conteúdo**: Ícone 🗑️ + warning text
- **Actions**: Cancelar (cinza) / Deletar (vermelho)

---

## 🔧 API Endpoints

### Viveiros
```
GET    /api/viveiros              # Listar todos
GET    /api/viveiros/:id          # Detalhes
POST   /api/viveiros              # Criar
PUT    /api/viveiros/:id          # Atualizar
DELETE /api/viveiros/:id          # Deletar
```

### Dashboard
```
GET /api/fazenda/dashboard         # Metrics aggregadas
```

### Ração
```
GET    /api/viveiros/:id/racao    # Histórico
POST   /api/viveiros/:id/racao    # Nova coleta
PUT    /api/viveiros/:id/racao/:id # Update
DELETE /api/viveiros/:id/racao/:id # Delete
```

---

## 🗄️ Database Schema

### viveiros
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL | Primary Key |
| nome | VARCHAR(100) | Nome do viveiro |
| densidade | DECIMAL(10,2) | Larvas/m² |
| area | DECIMAL(10,2) | Área m² |
| data_inicio_ciclo | DATE | Início cultivo |
| status | VARCHAR(20) | ativo/inativo/manutencao |
| created_at | TIMESTAMP | Criação |

### coletas_racao
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL | Primary Key |
| viveiro_id | INTEGER | FK viveiros |
| data | DATE | Data da coleta |
| qnt_manha | DECIMAL(10,2) | Quantidade manhã |
| qnt_tarde | DECIMAL(10,2) | Quantidade tarde |

### registros_mortalidade
| Campo | Tipo | Descrição |
|---|---|---|
| id | SERIAL | Primary Key |
| viveiro_id | INTEGER | FK viveiros |
| data | DATE | Data do registro |
| quantidade | INTEGER | Número de mortos |
| causa | VARCHAR(100) | Causa da morte |
| observacoes | TEXT | Observações |

---

## 🎨 Design System

### Cores
| Variável | Valor | Uso |
|---|---|---|
| --primary | #667eea | Botões principais |
| --success | #10b981 | Success states |
| --warning | #f59e0b | Warning messages |
| --danger | #ef4444 | Error/danger |
| --info | #3b82f6 | Info messages |
| --text | #1f2937 | Texto principal |
| --text-light | #6b7280 | Texto secundário |

### Componentes
- **Modal**: Backdrop + content custom
- **Toast**: Global notifications
- **Cards**: Viveiro status cards
- **Buttons**: Primary/secondary/danger

---

## 🚀 Deploy Process

### Frontend
```bash
npm run build
aws s3 sync dist/ s3://aquafarm-app-1772761451/ --delete
aws cloudfront create-invalidation --distribution-id E25WC5F9DBJYEH --paths "/*"
```

### Backend
```bash
scp -i ~/.ssh/aquafarm-key.pem server_with_docs.js ubuntu@ec2-18-229-126-89.sa-east-1.compute.amazonaws.com:/home/ubuntu/backend/
ssh -i ~/.ssh/aquafarm-key.pem ubuntu@ec2-18-229-126-89.sa-east-1.compute.amazonaws.com "cd ~/backend && pm2 restart ecamarao-backend"
```

---

## 📊 Performance Metrics

### Bundle Size
| Componente | Size | Gzipped |
|---|---|---|
| Total | ~290KB | ~88KB |
| CSS | ~22KB | ~4KB |
| JS | ~290KB | ~88KB |

### API Response Times
| Endpoint | Tempo |
|---|---|
| GET /api/viveiros | ~200ms |
| GET /api/fazenda/dashboard | ~300ms |
| POST /api/viveiros | ~150ms |
| DELETE /api/viveiros/:id | ~250ms |

---

## 🎯 Roadmap

### Short Term (1-2 semanas)
- [ ] Medições CRUD completo
- [ ] Aeradores control
- [ ] Gráficos históricos
- [ ] Filtros avançados

### Medium Term (2-4 semanas)
- [ ] Relatórios PDF
- [ ] Notificações automáticas
- [ ] Offline mode (PWA)
- [ ] Dark mode

### Long Term (1-2 meses)
- [ ] Mobile app (React Native)
- [ ] IoT integration
- [ ] ML predictions
- [ ] Multi-tenant

---

## 🐛 Known Issues

### Frontend
- [ ] Loading states pendentes
- [ ] Error boundaries
- [ ] Accessibility improvements
- [ ] Performance optimization

### Backend
- [ ] Type strictness
- [ ] Test coverage
- [ ] Code splitting
- [ ] Caching strategy

---

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- React Router (routing)
- Axios (HTTP client)
- CSS Variables (design)

### Backend
- Node.js + Express
- PostgreSQL (database)
- Joi (validation)
- Swagger (docs)
- PM2 (process manager)

### Infrastructure
- AWS S3 (static hosting)
- CloudFront (CDN)
- EC2 (backend server)
- GitHub (version control)

---

## 📈 Business Value

### Problemas Resolvidos
- ✅ Gestão centralizada
- ✅ Métricas em tempo real
- ✅ Otimização de ração
- ✅ Rastreabilidade completa
- ✅ Acesso mobile

### ROI Esperado
- 💰 Redução custos: 15-20% ração
- 📈 Produtividade: 10-15% biomassa
- ⏰ Economia tempo: 2-3h/dia
- 🦐 Qualidade: Redução mortalidade

---

## 📞 Contato

**Produção**: https://d1px7ovdnymfyn.cloudfront.net  
**API Docs**: https://d1px7ovdnymfyn.cloudfront.net/api-docs  
**Status**: ✅ Produção Ativa  
**Versão**: 1.0.0  
**Última atualização**: 07/03/2026
