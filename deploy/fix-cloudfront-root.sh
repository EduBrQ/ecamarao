#!/bin/bash
# Corrigir CloudFront para servir /ecamarao/ como raiz

echo "🔧 Corrigindo CloudFront para /ecamarao/..."

# Variáveis
BUCKET="aquafarm-app-1772761451"
REGION="sa-east-1"
DISTRIBUTION_ID="E25WC5F9DBJYEH"

# 1. Mover arquivos para raiz do bucket
echo "📦 Movendo arquivos para raiz..."
cd frontend
npm run build

aws s3 sync dist/ s3://$BUCKET/ --delete --region $REGION

# 2. Atualizar CloudFront para servir raiz
echo "⚡ Atualizando CloudFront..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --region $REGION > current-config.json

# Remover DefaultRootObject e configurar para raiz
sed -i 's/"DefaultRootObject": "index.html"/"DefaultRootObject": "index.html"/g' current-config.json > new-config.json

# Atualizar distribuição
aws cloudfront update-distribution \
  --id $DISTRIBUTION_ID \
  --distribution-config file://new-config.json \
  --if-match E23ZP02F085DFQ

# 3. Invalidar cache
echo "⚡ Invalidando cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*" \
  --region $REGION

echo "✅ CloudFront corrigido!"
echo "🌐 URLs:"
echo "CloudFront: https://d1px7ovdnymfyn.cloudfront.net/"
echo "S3: https://$BUCKET.s3-website-$REGION.amazonaws.com/"
