# CLAUDE.md

Guidance for Claude Code (and any dev) working in this repository.

## O que é o projeto

**EcoMarão / AquaFarm** — sistema de gerenciamento de viveiros de camarão
(aquicultura): dashboard, controle de ração, mortalidade, aeradores,
medições de água e relatórios.

## Estrutura do repositório

```
ecamarao/
├── backend/     # Node.js + Express + PostgreSQL (API REST)
├── frontend/    # React + TypeScript + Vite (SPA)
├── mobile/      # Apps Android (Kotlin) e iOS (Swift) via WebView do frontend
├── nginx/       # Config de proxy usada em deploy
├── deploy/      # Scripts de deploy
└── specs/       # Especificações de features (metodologia SDD, ver abaixo)
```

### Backend (`backend/`)
- Stack: Express, `pg` (PostgreSQL), Joi (validação), bcryptjs/JWT (auth),
  Helmet/CORS/Morgan, Swagger (`swagger-jsdoc` + `swagger-ui-express`).
- Entradas alternativas: `server.js` (dev), `server_final.js` (main),
  `server_with_docs.js` (com Swagger) — checar qual está em uso antes de editar.
- Scripts: `npm run dev` (nodemon-like via `server.js`), `npm start` (via
  `start.js`), `npm test` (jest).
- Tabelas principais: `viveiros`, `coletas_racao`, `registros_mortalidade`
  (FKs com `ON DELETE CASCADE` para `viveiro_id`).

### Frontend (`frontend/`)
- Stack: React 18 + TypeScript + Vite, React Router, Axios, Chart.js,
  TensorFlow.js.
- Estrutura em `src/`: `components/`, `pages/`, `services/` (`backendApi.ts`),
  `hooks/`, `models/types.ts`, `styles/`.
- Scripts: `npm run dev`, `npm run build` (`tsc -b && vite build`),
  `npm run lint`, `npm run preview`.

### Mobile (`mobile/`)
- Wrappers nativos (WebView/WKWebView) que carregam o frontend web — não é
  um app nativo completo. Ver `mobile/README.md` para pontes JS↔nativo.

## Convenções

- Nomes de domínio (rotas, colunas, variáveis de negócio) em **português**
  (`viveiro`, `racao`, `mortalidade`, `aerador`) — manter consistência com o
  que já existe em vez de traduzir para inglês.
- Endpoints REST seguem o padrão `/api/<recurso>` e `/api/viveiros/:id/<sub-recurso>`.
- Documentação solta (`DOCUMENTACAO_COMPLETA.md`, `DOCUMENTACAO_NOTION.md`,
  `DEPLOY.md`, READMEs por pasta) é histórica/informativa. Para **novas
  features**, a fonte de verdade passa a ser `specs/` (ver abaixo) — não
  duplicar decisões de design nesses arquivos soltos.

## Metodologia SDD (Spec-Driven Development) — a partir de agora

A partir desta branch, toda **feature nova** (não bugfix pequeno, não
ajuste trivial) segue este fluxo antes de codar:

1. **Spec** — descrever o problema e o comportamento esperado em
   `specs/<nome-da-feature>/spec.md` (requisitos, escopo, critérios de
   aceite). Sem detalhe de implementação.
2. **Plan** — `specs/<nome-da-feature>/plan.md`: decisões técnicas
   (endpoints, schema, componentes, contratos entre frontend/backend).
3. **Tasks** — `specs/<nome-da-feature>/tasks.md`: lista de tarefas
   pequenas e verificáveis derivadas do plano.
4. **Implementação** — codar seguindo as tasks, atualizando a spec/plano se
   a realidade exigir mudança (a spec é viva, não descartável).

Use `specs/TEMPLATE/` como ponto de partida para uma feature nova. Veja
`specs/README.md` para o processo completo.

Escopo desta adoção: aplica-se a features novas daqui para frente. Não é
necessário retroagir documentando funcionalidades já existentes.

## Comandos úteis

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Lint frontend
cd frontend && npm run lint

# Build frontend
cd frontend && npm run build
```
