# Deploy em produção (AWS EC2)

References: <ref_file file="DEPLOY.md" />, <ref_file file="docker-compose.prod.yml" />, <ref_file file=".env.prod.example" />.

## Recursos AWS provisionados

> ⚠️ Preencher esta seção depois de rodar o provisionamento em <ref_file file="DEPLOY.md" /> — os
> valores abaixo são placeholders até a EC2 existir de fato.

- **Conta:** `<preencher>`
- **Região:** `sa-east-1` (São Paulo)
- **IAM user usado para deploys:** `<preencher>` (precisa de `AmazonEC2FullAccess` ou
  equivalente escopado — ver "Pontos conhecidos a melhorar" no DEPLOY.md)
- **EC2:** `t3.small`, Ubuntu 22.04, 20 GB gp3 — `<instance-id>`
- **Elastic IP:** `<ip-publico>` (associado à instância entre reboots)
- **Security Group:** `ecamarao-sg` — libera `22/tcp` (SSH) e `80/tcp` (HTTP) para `0.0.0.0/0`
- **Key Pair:** `ecamarao-key` — chave privada guardada localmente (não está no repo)

Para ver os IDs atuais:

```bash
aws ec2 describe-instances \
  --filters 'Name=tag:Project,Values=ecamarao' 'Name=instance-state-name,Values=running' \
  --query 'Reservations[].Instances[].[InstanceId,PublicIpAddress,State.Name]' \
  --output table

aws ec2 describe-addresses \
  --filters 'Name=tag:Project,Values=ecamarao' \
  --query 'Addresses[].[AllocationId,PublicIp,InstanceId]' \
  --output table
```

## Arquitetura em cima da EC2

```
Internet :80 → nginx (container frontend) → backend:8000 (Express) → postgres:5432
```

Tudo orquestrado por `docker-compose.prod.yml`. O nginx serve o SPA buildado e faz
proxy de `/api/*` e `/health`. Somente a porta 80 está exposta para fora; backend e
postgres ficam na rede interna do compose.

## Atualizar o deploy (fluxo padrão)

SSH na EC2 com a chave `ecamarao-key.pem` e, dentro de `~/ecamarao`:

```bash
git pull origin main
sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Para derrubar:

```bash
sudo docker compose -f docker-compose.prod.yml --env-file .env down
```

Logs:

```bash
sudo docker compose -f docker-compose.prod.yml logs -f backend
sudo docker compose -f docker-compose.prod.yml logs -f frontend
sudo docker compose -f docker-compose.prod.yml logs -f postgres
```

Backup do banco:

```bash
sudo docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U ecamarao ecamarao > backup-$(date +%F).sql
```

## Variáveis de ambiente de produção

O `.env` na EC2 (permissões `600`, não versionado) é baseado em <ref_file file=".env.prod.example" />.
Segredos obrigatórios:

- `DB_PASSWORD`
- `JWT_SECRET`

`CORS_ORIGIN` fica vazio enquanto o app só é acessado via nginx (mesma origem);
preencher quando algo (ex.: os apps mobile) precisar bater direto na API.

## Pontos conhecidos a melhorar

- Porta 443 / TLS: o deploy hoje é HTTP-only. Para produção real, adicionar
  Let's Encrypt (certbot + volume montado no nginx, igual ao
  `oficina-inteligente`) ou um ALB na frente, assim que houver domínio.
- Schema do banco: sem migrations; `users` e `viveiros` precisam existir antes
  do primeiro `POST /setup` (ver DEPLOY.md).
- Backup automático do Postgres: hoje é manual via `pg_dump`. Considerar um
  cron + S3 ou migrar para RDS.
- Credenciais IAM: usar Access Key de deploy com policy escopada em vez de
  `AmazonEC2FullAccess`.
