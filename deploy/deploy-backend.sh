#!/bin/bash
# Deploy Backend para AWS EC2

echo "🚀 Deploy Backend para EC2..."

# Variáveis
EC2_USER="ec2-user"
EC2_IP="SEU_EC2_PUBLIC_IP"  # Substituir pelo IP do seu EC2
KEY_FILE="~/.ssh/aquafarm-key.pem"  # Sua chave SSH

# 1. Copiar arquivos para EC2
echo "📦 Enviando arquivos para EC2..."
scp -i $KEY_FILE -r ../backend $EC2_USER@$EC2_IP:/home/$EC2_USER/
scp -i $KEY_FILE ../docker-compose.yml $EC2_USER@$EC2_IP:/home/$EC2_USER/

# 2. Configurar ambiente no EC2
echo "🔧 Configurando ambiente no EC2..."
ssh -i $KEY_FILE $EC2_USER@$EC2_IP << 'EOF'
    # Atualizar sistema
    sudo apt update -y
    sudo apt upgrade -y
    
    # Instalar Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ec2-user
    
    # Instalar Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Criar rede Docker
    docker network create aquafarm-network
    
    # Abrir portas no firewall
    sudo ufw allow 8000
    sudo ufw allow 5432
    
    echo "✅ Ambiente configurado!"
EOF

# 3. Subir backend
echo "🚀 Subindo backend..."
ssh -i $KEY_FILE $EC2_USER@$EC2_IP << 'EOF'
    cd backend
    docker-compose up -d
    
    # Verificar status
    docker ps
    docker logs aquafarm-backend
EOF

echo "✅ Backend deployado!"
echo ""
echo "🌐 URLs de acesso:"
echo "Backend API: http://$EC2_IP:8000"
echo "Health Check: http://$EC2_IP:8000/health"
echo "Swagger Docs: http://$EC2_IP:8000/api-docs"
echo ""
echo "🔧 Para conectar frontend:"
echo "Atualizar API_URL para: http://$EC2_IP:8000"
