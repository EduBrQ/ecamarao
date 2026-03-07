# Deploy AWS - AquaFarm

## 🚀 **Setup Rápido (30 minutos)**

### **1. Instalar AWS CLI**
```bash
# Windows: Baixe de https://aws.amazon.com/cli/
# Ou via winget: winget install Amazon.AWSCLI

# Verificar instalação
aws --version

# Configurar credenciais
aws configure
```

### **2. Criar Infraestrutura**
```bash
# Tornar executáveis
chmod +x deploy/*.sh

# Setup inicial (cria S3 + CloudFront)
./deploy/aws-setup.sh
```

### **3. Deploy Frontend**
```bash
./deploy/deploy-frontend.sh
```

### **4. Deploy Backend**
```bash
# 1. Criar EC2 instance no Console AWS
#    - Ubuntu/Amazon Linux 2
#    - t2.micro (free tier)
#    - Security Group: HTTP (80), HTTPS (443), SSH (22)

# 2. Configurar IP público no deploy-backend.sh
#    Editar EC2_HOST="SEU_EC2_PUBLIC_IP"

# 3. Deploy
./deploy/deploy-backend.sh
```

## 📋 **Serviços AWS Criados**

### **Frontend:**
- ✅ **S3 Bucket** - `aquafarm-app`
- ✅ **CloudFront** - CDN global (HTTPS)
- ✅ **Route 53** - DNS (opcional)

### **Backend:**
- ✅ **EC2 t2.micro** - Servidor backend
- ✅ **Docker** - Containerização
- ✅ **Security Groups** - Firewall

### **Banco de Dados:**
- ✅ **RDS PostgreSQL** - Managed database
- ✅ **Backup automático**
- ✅ **Multi-AZ** (opcional)

## 🔧 **Comandos Úteis**

### **Frontend:**
```bash
# Verificar status
aws s3 ls s3://aquafarm-app

# Limpar e re-deploy
aws s3 rm s3://aquafarm-app --recursive
./deploy/deploy-frontend.sh
```

### **Backend:**
```bash
# Acessar servidor
ssh -i ~/.ssh/aquafarm-key.pem ec2-user@SEU_IP

# Verificar containers
docker ps

# Ver logs
docker logs aquafarm-backend

# Reiniciar
docker-compose restart
```

### **Monitoramento:**
```bash
# Verificar custos
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY

# CloudWatch logs
aws logs tail /ec2/aquafarm-backend --follow
```

## 💰 **Custos Estimados (Free Tier)**

### **Primeiro Ano:**
- **S3**: ~$0 (5GB grátis)
- **CloudFront**: ~$0 (50GB grátis)
- **EC2**: ~$0 (750h/mês grátis)
- **RDS**: ~$0 (750h/mês grátis)
- **Total**: **$0/mês**

### **Após Free Tier:**
- **EC2 t2.micro**: $8.47/mês
- **RDS db.t2.micro**: $13.84/mês
- **S3**: $0.023/GB
- **CloudFront**: $0.085/GB
- **Total**: ~$25-50/mês

## 🚨 **Troubleshooting**

### **Permissões S3:**
```bash
# Se der erro 403
aws s3api put-bucket-policy --bucket aquafarm-app --policy file://bucket-policy.json
```

### **CloudFront não atualiza:**
```bash
# Forçar invalidação
aws cloudfront create-invalidation --distribution-id ID_DISTRIBUTION --paths "/*"
```

### **Backend não sobe:**
```bash
# Verificar logs no EC2
ssh -i key.pem ec2-user@IP
docker logs aquafarm-backend
```

## 🎯 **Próximos Passos**

1. ✅ **Setup AWS CLI**
2. ✅ **Criar infraestrutura**
3. ✅ **Deploy frontend**
4. ✅ **Deploy backend**
5. ✅ **Configurar domínio**
6. ✅ **Monitoramento**

**Suporte**: Se precisar de ajuda, verifique os logs ou execute os comandos de troubleshooting acima.
