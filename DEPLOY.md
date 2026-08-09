# Deploy em produção (EC2 único + docker-compose)

Este guia segue o mesmo padrão usado no **oficina-inteligente**: uma única EC2
rodando `docker compose` com três containers — **nginx (frontend)**, **backend
(Express)** e **postgres** — e deploy automático via GitHub Actions (rsync +
SSH) a cada push na `main`.

## Arquitetura

```
                   ┌──────────────────────────────────────────────┐
                   │                EC2 (sa-east-1)               │
 Internet ─ :80 ──►│  nginx/frontend ─► backend:8000 ─► postgres  │
                   └──────────────────────────────────────────────┘
```

- `frontend` (nginx) expõe a porta 80, serve o SPA buildado em
  `/usr/share/nginx/html` e faz proxy de `/api/*` e `/health` para o backend
  interno.
- `backend` (Express) escuta em `8000` dentro da rede Docker.
- `postgres` guarda os dados em um volume `ecamarao-pgdata` (persistente).

Só a porta 80 é exposta para a internet; backend e postgres ficam na rede
interna do compose.

## 1. Provisionar a infraestrutura AWS

Este ambiente de execução não tem credenciais AWS reais nem o `aws` CLI
instalado, então o provisionamento abaixo precisa ser feito por você (local ou
CloudShell), com uma conta/IAM user com permissão de EC2.

```bash
# Variáveis de conveniência — ajuste a região/AMI se quiser outra
REGION=sa-east-1
AMI_ID=ami-041683bf0171a34ff   # Ubuntu 22.04 LTS em sa-east-1 — confirme a atual
KEY_NAME=ecamarao-key
SG_NAME=ecamarao-sg

# Key pair (guarde o .pem com segurança, ele NÃO deve ir para o repo)
aws ec2 create-key-pair --region $REGION --key-name $KEY_NAME \
  --query 'KeyMaterial' --output text > $KEY_NAME.pem
chmod 400 $KEY_NAME.pem

# Security group liberando só 22 (SSH) e 80 (HTTP)
VPC_ID=$(aws ec2 describe-vpcs --region $REGION --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SG_ID=$(aws ec2 create-security-group --region $REGION --group-name $SG_NAME \
  --description "ecamarao deploy" --vpc-id $VPC_ID --query 'GroupId' --output text)
aws ec2 authorize-security-group-ingress --region $REGION --group-id $SG_ID \
  --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --region $REGION --group-id $SG_ID \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

# EC2 t3.small, 20 GB gp3, tag Project=ecamarao
INSTANCE_ID=$(aws ec2 run-instances --region $REGION \
  --image-id $AMI_ID --instance-type t3.small --key-name $KEY_NAME \
  --security-group-ids $SG_ID \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3}' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=ecamarao},{Key=Project,Value=ecamarao}]' \
  --query 'Instances[0].InstanceId' --output text)

# Elastic IP — mantém o IP público fixo entre reboots
ALLOC_ID=$(aws ec2 allocate-address --region $REGION --domain vpc --query 'AllocationId' --output text)
aws ec2 associate-address --region $REGION --instance-id $INSTANCE_ID --allocation-id $ALLOC_ID

aws ec2 describe-addresses --region $REGION --allocation-ids $ALLOC_ID \
  --query 'Addresses[0].PublicIp' --output text
```

Guarde o `InstanceId`, o `AllocationId` e o IP público — vão ser usados nos
secrets do GitHub Actions e em consultas futuras:

```bash
aws ec2 describe-instances --region sa-east-1 \
  --filters 'Name=tag:Project,Values=ecamarao' 'Name=instance-state-name,Values=running' \
  --query 'Reservations[].Instances[].[InstanceId,PublicIpAddress,State.Name]' \
  --output table
```

## 2. Preparar o host (Docker)

```bash
ssh -i ecamarao-key.pem ubuntu@<IP-DA-EC2>

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
```

> Use o repositório oficial do Docker (acima) — o pacote `docker-compose-plugin`
> do repositório padrão do Ubuntu não existe.

## 3. Subir a stack pela primeira vez

```bash
git clone https://github.com/EduBrQ/ecamarao.git
cd ecamarao

cp .env.prod.example .env
vim .env   # ajuste DB_PASSWORD, JWT_SECRET, CORS_ORIGIN

sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

A UI fica acessível em `http://<IP-DA-EC2>/` e a API em
`http://<IP-DA-EC2>/api/`.

## 4. Configurar o deploy automático (GitHub Actions)

Em Settings → Secrets and variables → Actions, no repositório `ecamarao`,
crie:

- `EC2_HOST`: IP público (ou domínio) da instância
- `EC2_USER`: `ubuntu`
- `EC2_SSH_KEY`: conteúdo do `ecamarao-key.pem`

A cada push/merge na `main`, o workflow `.github/workflows/deploy.yml`
sincroniza o código via `rsync` (preservando o `.env` remoto) e roda
`docker compose up -d --build` na EC2. Também pode ser disparado manualmente
em Actions → "Deploy to AWS EC2" → "Run workflow".

## Atualizações manuais (sem CI)

```bash
cd ~/ecamarao
git pull origin main
sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## Logs e troubleshooting

```bash
sudo docker compose -f docker-compose.prod.yml logs -f backend
sudo docker compose -f docker-compose.prod.yml logs -f frontend
sudo docker compose -f docker-compose.prod.yml logs -f postgres
```

## Backup do banco

```bash
sudo docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U ecamarao ecamarao > backup-$(date +%F).sql
```

## Variáveis obrigatórias no `.env`

- `DB_PASSWORD`
- `JWT_SECRET` (ex.: `openssl rand -hex 48`)

As demais (`DB_USER`, `DB_NAME`, `CORS_ORIGIN`) têm defaults sensatos — ver
`.env.prod.example`.

## Pontos conhecidos a melhorar

- **Porta 443 / TLS**: o deploy é HTTP-only por enquanto. Quando houver um
  domínio, adicionar Let's Encrypt (certbot + volume montado no container
  nginx, igual ao `oficina-inteligente`) ou colocar um ALB na frente.
- **Schema do banco**: o backend não tem migrations. `POST /setup` (ou
  `node setup_db.js` apontando para o host certo) cria só `coletas_racao`,
  `medicoes_agua`, `registros_mortalidade` e `aeradores` — as tabelas `users`
  e `viveiros` não são criadas em lugar nenhum do código e precisam existir
  no banco antes do primeiro uso (hoje isso é feito manualmente via
  `setup_database.html`/SQL direto). Vale formalizar isso como uma migration
  única antes de guardar dados reais.
- **Apps mobile**: `mobile/android` e `mobile/ios` apontam para uma URL fixa
  (`WEB_APP_URL`) — atualizar para `http://<IP-da-EC2>/` (ou o domínio, quando
  existir) depois do primeiro deploy.
- **Credenciais IAM**: usar um Access Key de deploy com policy escopada
  (`ec2:Describe*`, `ec2:*Address*` na instância específica) em vez de
  `AmazonEC2FullAccess`.
