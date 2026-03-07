#!/bin/bash
# Deploy Backend para EC2 (sem Docker)

echo "🚀 Deploy Backend para EC2..."

# Variáveis
EC2_USER="ubuntu"
EC2_IP="52.67.181.96"  # Substituir pelo IP do seu EC2
KEY_FILE="~/.ssh/aquafarm-key.pem"  # Sua chave SSH

# 1. Copiar arquivos para EC2
echo "📦 Enviando arquivos para EC2..."
scp -i $KEY_FILE -r ../backend $EC2_USER@$EC2_IP:/home/$EC2_USER/

# 2. Configurar ambiente no EC2
echo "🔧 Configurando ambiente no EC2..."
ssh -i $KEY_FILE $EC2_USER@$EC2_IP << 'EOF'
    # Atualizar sistema
    sudo apt update -y
    sudo apt upgrade -y
    
    # Instalar Node.js
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Instalar PostgreSQL
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Configurar banco de dados
    sudo -u postgres psql -c "CREATE DATABASE ecamarao;"
    sudo -u postgres psql -c "CREATE USER aquafarm WITH PASSWORD 'admin123';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ecamarao TO aquafarm;"
    
    # Configurar PostgreSQL para aceitar conexões
    sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" /etc/postgresql/14/main/postgresql.conf
    sudo sh -c 'echo "host all all 0.0.0.0/0 md5" >> /etc/postgresql/14/main/pg_hba.conf'
    sudo systemctl restart postgresql
    
    # Abrir portas no firewall
    sudo ufw allow 8000
    sudo ufw allow 5432
    sudo ufw --force enable
    
    echo "✅ Ambiente configurado!"
EOF

# 3. Instalar dependências e subir backend
echo "🚀 Subindo backend..."
ssh -i $KEY_FILE $EC2_USER@$EC2_IP << 'EOF'
    cd backend
    
    # Instalar dependências
    npm install
    
    # Criar arquivo .env
    cat > .env << EOL
DATABASE_URL=postgresql://aquafarm:admin123@localhost:5432/ecamarao
PORT=8000
NODE_ENV=production
HOST=0.0.0.0
DEBUG=false
EOL
    
    # Iniciar backend com PM2
    sudo npm install -g pm2
    pm2 start server_with_docs.js --name "aquafarm-backend"
    pm2 save
    pm2 startup
    
    # Verificar status
    pm2 status
    pm2 logs aquafarm-backend
EOF

echo "✅ Backend deployado!"
echo ""
echo "🌐 URLs de acesso:"
echo "Backend API: http://$EC2_IP:8000"
echo "Health Check: http://$EC2_IP:8000/health"
echo "Swagger Docs: http://$EC2_IP:8000/api-docs"
echo ""
echo "🔧 Para conectar frontend:"
echo "API_URL: http://$EC2_IP:8000"
