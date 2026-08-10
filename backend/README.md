# Backend ecamarao — NestJS + TypeORM + PostgreSQL

API REST para o sistema de gestão de viveiros de camarão ecamarao.

## Tecnologias

- **NestJS** + TypeScript
- **TypeORM** + PostgreSQL
- **Passport JWT** + bcryptjs — autenticação
- **class-validator** — validação de DTOs

## Estrutura

```
backend/
├── src/
│   ├── auth/           # login, JWT strategy, guard
│   ├── users/
│   ├── viveiros/
│   ├── racao/           # coletas de ração (upsert por viveiro+data)
│   ├── medicoes/        # qualidade da água
│   ├── mortalidade/
│   ├── aeradores/
│   ├── dashboard/       # agregado da fazenda (biomassa, FCR, recomendação de ração)
│   ├── database/        # transformer numérico + seed do admin inicial
│   ├── app.module.ts
│   └── main.ts
└── package.json
```

## Desenvolvimento local

```bash
cp .env.example .env   # ajuste DB_* e SEED_ADMIN_PASSWORD
npm install
npm run start:dev
```

A API sobe em `http://localhost:8000`, com prefixo `/api` em todas as rotas
exceto `/health`. `DB_SYNCHRONIZE=true` (default local) cria o schema
automaticamente a partir das entidades — não precisa rodar migrations à mão.

No primeiro boot com o banco vazio, um usuário admin é criado a partir de
`SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD` (ver `.env.example`). É esse
usuário que faz login em `POST /api/auth/login`.

## Endpoints principais

```
POST   /api/auth/login
GET    /api/auth/me                (autenticado)

GET    /api/viveiros
POST   /api/viveiros
GET    /api/viveiros/:id
PUT    /api/viveiros/:id
DELETE /api/viveiros/:id

GET    /api/viveiros/:viveiroId/racao
POST   /api/viveiros/:viveiroId/racao        (upsert por data)
GET    /api/viveiros/:viveiroId/medicoes
GET    /api/viveiros/:viveiroId/mortalidade
GET    /api/viveiros/:viveiroId/aeradores

GET    /api/dashboard    # agregado da fazenda: biomassa, FCR, ração recomendada
GET    /api/stats
GET    /health             # sem prefixo /api, usado pelo healthcheck do compose
```

Todas as rotas acima (exceto `/api/auth/login` e `/health`) exigem
`Authorization: Bearer <token>`.

## Build / produção

```bash
npm run build
npm run start:prod
```

Ver `../DEPLOY.md` para o fluxo de deploy em produção (EC2 + docker-compose).
