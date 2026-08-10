# Proposta de reestruturação — ecamarao

> Documento de proposta técnica. Não implementa nada ainda — é a base para
> decidirmos juntos o que entra e o que fica de fora antes de eu começar a
> migrar código.

## 1. Resumo executivo

O ecamarao hoje é um sistema funcional, mas acumulou dívida técnica típica de
protótipo que virou produção sem parar para reorganizar: 5 arquivos de
servidor concorrentes, zero autenticação real, páginas e sistemas de UI
duplicados, dependências mortas de ~vários MB, e uma infra de deploy espalhada
entre três provedores diferentes (Render, S3/CloudFront, GitHub Pages) — nenhum
deles efetivamente em uso.

A proposta é reescrever backend e frontend num stack **idêntico ao usado no
oficina-inteligente** (NestJS + TypeORM + PostgreSQL no backend, React +
Vite + TypeScript no frontend, deploy em EC2 única com docker-compose). Isso
não é só "seguir o padrão por padrão" — é reaproveitar decisões já validadas
em produção no projeto irmão, reduzir o número de stacks que você precisa
manter na cabeça, e resolver de graça os maiores buracos atuais (autenticação
inexistente, schema sem migrations).

## 2. Diagnóstico do estado atual

### 2.1 Backend — `backend/`

- **5 arquivos de servidor concorrentes**: `server.js` (1581 linhas, é o que
  roda de fato — `start.js` → `server.js`), `server_final.js` (547 linhas),
  `server_with_docs.js` (739 linhas), `run_with_docs.js`. Três
  implementações parcialmente distintas da mesma API, divergindo em CORS,
  schemas e rotas. Não há como saber, olhando o repo, qual é a fonte da
  verdade sem ler `package.json`.
- **Sem autenticação real**: existe `POST /api/users/register` e
  `GET /api/users` (lista todos os usuários publicamente, sem token), mas
  **não existe rota de login em lugar nenhum do código**, nem middleware que
  valide o JWT em qualquer endpoint. `jsonwebtoken` está no `package.json`
  mas `jwt.verify` nunca é chamado. Ou seja: toda a API de viveiros,
  ração, medições, mortalidade e aeradores está aberta para qualquer um.
- **Schema do banco criado à mão**: `POST /setup` cria só 4 das 6 tabelas
  (`coletas_racao`, `medicoes_agua`, `registros_mortalidade`, `aeradores`).
  `users` e `viveiros` não são criadas em lugar nenhum do código — precisam
  existir previamente via SQL manual. Sem migrations, sem versionamento de
  schema.
- **SQL cru em toda parte**: cada rota monta a query manualmente com
  `pool.query`. Funciona, mas não há checagem de tipos entre schema e
  código, e mudanças de schema exigem caçar todos os lugares que tocam a
  tabela.
- **Duplicação interna**: `server.js` chega a repetir os mesmos `CREATE
  TABLE IF NOT EXISTS` duas vezes dentro do próprio arquivo (linhas ~111 e
  ~1492).

### 2.2 Frontend — `frontend/`

- **Dois componentes raiz**: `App.tsx` (usado de fato, importado por
  `main.tsx`) e `AppWithToast.tsx` (órfão — nada importa esse arquivo,
  reimplementa o mesmo roteamento com um sistema de toast diferente).
- **Páginas duplicadas**: `Viveiro.tsx` (304 linhas) vs `ViveiroBackend.tsx`
  (256 linhas), e uma segunda lista de viveiros em
  `ViveirosListBackend.tsx` além da lógica que já mora em `Home.tsx` (581
  linhas — um componente fazendo lista, dashboard agregado e modais, tudo
  junto).
- **Sistema de mocks embutido no bundle de produção**: `mocks/` (dois
  datasets fixos de "viveiro de 60 dias") e `MockLoader.tsx`, um widget
  flutuante que injeta dados fake no `localStorage` — não fica atrás de
  nenhuma flag de ambiente.
- **Duas dependências mortas e pesadas**: `@tensorflow/tfjs` (~/vários MB) e
  `chart.js` + `react-chartjs-2` — nenhuma delas é importada em nenhum
  arquivo de `src/`. Puro peso morto no `node_modules` e risco de entrar no
  bundle final por engano.
- **`models/types.ts` fora de sincronia com o backend**: campos como
  `laboratorio`, `proprietario`, `plInicial` em `ViveiroDTO` não existem no
  schema real do backend (`nome`, `densidade`, `area`,
  `data_inicio_ciclo`, `status`).

### 2.3 Mobile — `mobile/`

- Android e iOS são **shells WebView puros**: o app inteiro é uma
  `WebView`/`WKWebView` carregando uma URL. `MainActivity.kt` e
  `EcamaraoApp.swift` apontam para `http://localhost:3000` **hardcoded**,
  sem variável de build para produção.
- Não há nenhuma funcionalidade nativa real usada (a ponte JS↔nativo do iOS
  só tem `showToast`/`vibrate`, não conectados a nada no frontend web).
- Manter isso significa manter dois toolchains inteiros (Gradle/Kotlin e
  Xcode/Swift) só para reabrir uma URL — cada mudança visual no site exigiria
  rebuild + republish em duas lojas de app para zero ganho funcional.

### 2.4 Infra / deploy

- Já resolvido na sessão anterior: removi Render (`render.yaml`), o setup
  antigo de S3+CloudFront (`deploy/`, `bucket-policy*.json`) e o workflow do
  GitHub Pages, substituindo por Dockerfiles + `docker-compose.prod.yml` +
  GitHub Actions no mesmo padrão do oficina-inteligente (EC2 única). Esse
  pedaço **não precisa mudar** com esta proposta — só fica mais simples,
  porque passa a existir um único processo backend compilado, igual ao
  oficina.

## 3. Arquitetura proposta

```
┌─────────────────────────────────────────────────────┐
│                   EC2 (sa-east-1)                    │
│                                                       │
│  nginx (frontend)  ──►  backend (NestJS)  ──►  postgres │
│    SPA + PWA              :3000 (JWT auth)      :5432 │
└─────────────────────────────────────────────────────┘
```

Mesmo desenho de infraestrutura que já está no repo hoje — o que muda é o
que roda dentro de cada container.

### 3.1 Backend: Express solto → NestJS + TypeORM

Por quê NestJS especificamente (e não só "arrumar o Express"): é o mesmo
framework do oficina-inteligente. Isso significa que você (ou eu, numa
sessão futura) não precisa alternar de cabeça entre dois jeitos diferentes
de estruturar rota, validação e autenticação — é o mesmo módulo de auth,
a mesma forma de definir entidade, o mesmo Dockerfile.

- **Módulos por domínio**, espelhando as tabelas atuais:
  `auth`/`users`, `viveiros`, `racao`, `medicoes`, `mortalidade`,
  `aeradores`, `dashboard` (o agregado que hoje é `/api/fazenda/dashboard`).
- **TypeORM** com entidades tipadas — schema sincronizado via
  `DB_SYNCHRONIZE=true` no MVP (igual ao oficina hoje), migrations reais
  quando o projeto tiver dados de verdade em produção.
- **Autenticação de verdade**: `@nestjs/passport` + `passport-jwt` +
  `bcryptjs`, com rota de login (que hoje simplesmente não existe) e um
  `AuthGuard` protegendo as rotas de escrita. Resolve o maior risco do
  sistema atual de graça, porque é o pacote que o oficina já usa.
- **DTOs com `class-validator`** no lugar dos schemas Joi espalhados —
  validação e tipo TypeScript no mesmo lugar.
- **Swagger via `@nestjs/swagger`** (decorators), substituindo o
  `swagger-jsdoc` manual do `server_with_docs.js`.
- Mesma superfície de rotas REST (`/api/viveiros`, `/api/viveiros/:id/racao`,
  etc.) — o contrato com o frontend não muda, só a implementação por trás.

### 3.2 Frontend: consolidar, não reescrever

O frontend já usa React + TypeScript + Vite — mesma base do oficina, não há
motivo pra trocar de framework aqui. A proposta é **cortar duplicação e peso
morto**, não reescrever do zero:

- Remover `AppWithToast.tsx`, `ViveiroBackend.tsx`,
  `ViveirosListBackend.tsx` — consolidar num único fluxo por entidade,
  usando sempre o backend real (nunca mock).
- Remover `mocks/`, `MockLoader.tsx` e as dependências `@tensorflow/tfjs`,
  `chart.js`, `react-chartjs-2` (não usadas em lugar nenhum).
- Se precisar de gráficos de verdade nas telas de dashboard/medições, usar
  **`recharts`** — é o que o oficina já usa, então vira uma dependência a
  menos para você acompanhar (patches de segurança, breaking changes etc.)
  em vez de duas bibliotecas de gráfico diferentes entre os dois projetos.
- Ícones: trocar emojis inline por **`lucide-react`** (mesma lib do
  oficina) onde fizer sentido — cosmético, não bloqueante.
- Alinhar `models/types.ts` com o schema real do backend (remover campos
  fantasma como `laboratorio`, `proprietario`, `plInicial`).

### 3.3 Mobile: WebView nativo → PWA

Trocar as duas pastas `mobile/android` e `mobile/ios` por um
**Progressive Web App**: `manifest.json` + service worker no próprio
`frontend/`. Na prática, o usuário toca em "Adicionar à tela inicial" no
navegador e fica com ícone, splash screen e modo standalone — mesmo
resultado visual do WebView atual, sem precisar:

- manter Gradle/Kotlin e Xcode/Swift funcionando;
- publicar em duas lojas de app (com todo o processo de review) toda vez
  que o site mudar;
- resolver o hardcode de `localhost:3000` que os apps atuais têm.

Se no futuro surgir uma necessidade real de recurso nativo (push
notification, câmera, GPS em background), aí sim entra React Native ou
Capacitor — não antes disso.

### 3.4 Banco de dados

Continua **PostgreSQL**, mesmas 6 entidades (`users`, `viveiros`,
`coletas_racao`, `medicoes_agua`, `registros_mortalidade`, `aeradores`).
O que muda é como o schema é criado: via entidades TypeORM em vez de SQL
manual + `POST /setup` incompleto.

## 4. Estrutura de pastas alvo

```
ecamarao/
├── backend/
│   └── src/
│       ├── auth/           # login, JWT strategy, guards
│       ├── users/
│       ├── viveiros/
│       ├── racao/
│       ├── medicoes/
│       ├── mortalidade/
│       ├── aeradores/
│       ├── dashboard/
│       └── database/       # config TypeORM
├── frontend/
│   └── src/
│       ├── pages/          # uma página por rota, sem duplicata "Backend"
│       ├── components/
│       ├── services/       # backendApi.ts tipado
│       ├── hooks/
│       └── manifest.json + sw.ts   # PWA
├── docker-compose.prod.yml     # já existe, muda pouco
├── DEPLOY.md                   # já existe
└── .agents/skills/aws-deploy/  # já existe
```

## 5. Plano de migração em fases

Cada fase é um PR independente e revisável — nada de "big bang".

1. **Fase 0 — Limpeza** (baixo risco, rápido): apagar
   `AppWithToast.tsx`, `ViveiroBackend.tsx`, `ViveirosListBackend.tsx`,
   `mocks/`, `MockLoader.tsx`, dependências mortas
   (`@tensorflow/tfjs`, `chart.js`, `react-chartjs-2`), e os arquivos de
   servidor não usados (`server_final.js`, `server_with_docs.js`,
   `run_with_docs.js`). Não muda comportamento, só remove ruído.
2. **Fase 1 — Backend NestJS**: recriar os 7 módulos listados acima,
   mesma superfície de rotas, com login/JWT funcionando de verdade e
   schema via TypeORM. Frontend continua apontando pro mesmo
   contrato de API, então essa fase não quebra a Fase 2.
3. **Fase 2 — Frontend consolidado**: eliminar duplicação de páginas,
   alinhar tipos com o backend novo, opcionalmente trocar biblioteca de
   gráfico.
4. **Fase 3 — PWA**: manifest + service worker; arquivar (ou remover) as
   pastas `mobile/android` e `mobile/ios`.
5. **Fase 4 — Deploy**: ajustar `backend/Dockerfile` para o build NestJS
   (fica igual ao Dockerfile do oficina — `npm run build` + `dist/main.js`)
   e revalidar o `docker-compose.prod.yml` já existente.

## 6. O que NÃO muda

- Contrato de rotas REST (`/api/viveiros/...`) — mantém compatibilidade
  durante a transição.
- Banco continua PostgreSQL, mesmas entidades de domínio.
- Padrão de deploy (EC2 única + docker-compose + GitHub Actions) — já
  está pronto na branch `claude/ecamarao-aws-deploy-7sv5ly`.

## 7. Riscos e trade-offs

- **Reescrever o backend é o item de maior esforço** desta proposta — não é
  um refactor incremental, é trocar de framework. Em troca, resolve de uma
  vez a ausência de autenticação, que hoje é uma falha de segurança real
  (qualquer pessoa pode ler/criar/apagar dados de qualquer viveiro).
- **Descontinuar os apps nativos** é uma decisão de produto, não só técnica
  — se já existirem usuários com o app instalado via APK/TestFlight fora
  das lojas oficiais, vale confirmar antes de tirar o suporte.
- Não encontrei testes automatizados em nenhuma das duas camadas hoje;
  esta proposta não adiciona suíte de testes por padrão — se quiser, dá pra
  incluir como fase adicional (o oficina-inteligente já tem `jest` rodando
  no CI do backend, então também seria só replicar o padrão).

## 8. Próximos passos

Este documento é só a proposta — nenhuma dessas mudanças foi aplicada
ainda. Preciso que você confirme:

1. Topo a virada para NestJS/TypeORM no backend, ou prefere só limpar o
   Express atual (Fase 0) e manter o resto?
2. Tudo bem descontinuar os apps nativos Android/iOS em favor de PWA?
3. Prefere que eu implemente fase a fase (PR por PR, revisando antes de
   seguir) ou tudo de uma vez numa branch só?
