#!/bin/bash
# Deploy completo do AquaFarm (Frontend + Backend)

echo "🚀 Deploy completo AquaFarm..."

# Variáveis
EC2_IP="52.67.181.96"
KEY_FILE="~/.ssh/aquafarm-key.pem"
BUCKET="aquafarm-app-1772761451"
REGION="sa-east-1"
CLOUDFRONT_DOMAIN="d1px7ovdnymfyn.cloudfront.net"

# 1. Deploy Backend
echo "🔧 Deploy Backend..."
chmod +x deploy/deploy-backend-simple.sh
./deploy/deploy-backend-simple.sh

# 2. Atualizar Frontend com IP do Backend
echo "📝 Atualizando frontend..."
sed -i "s/SEU_EC2_PUBLIC_IP/$EC2_IP/g" frontend/src/services/backendApi.ts

# 3. Deploy Frontend
echo "📦 Deploy Frontend..."
cd frontend
npm run build

aws s3 sync dist/ s3://$BUCKET/ --delete --region $REGION

# 4. Invalidar cache CloudFront
echo "⚡ Invalidando cache CloudFront..."
aws cloudfront create-invalidation \
  --distribution-id E25WC5F9DBJYEH \
  --paths "/*" \
  --region $REGION

echo "✅ Deploy completo!"
echo ""
echo "🌐 URLs:"
echo "Frontend: https://$CLOUDFRONT_DOMAIN/"
echo "Backend: http://$EC2_IP:8000"
echo "API Docs: http://$EC2_IP:8000/api-docs"
echo ""
echo "🎯 Teste:"
echo "1. Frontend: https://d1px7ovdnymfyn.cloudfront.net/"
echo "2. Backend Health: http://$EC2_IP:8000/health"
