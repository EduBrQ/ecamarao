#!/bin/bash
# Deploy final do AquaFarm para AWS

echo "🚀 Deploy AquaFarm para AWS..."

# Variáveis
BUCKET="aquafarm-app-1772761451"
REGION="sa-east-1"
CLOUDFRONT_DOMAIN="d1px7ovdnymfyn.cloudfront.net"

# 1. Build frontend
echo "🔨 Build frontend..."
cd frontend
npm run build

# 2. Upload para S3 (raiz)
echo "📦 Upload para S3..."
aws s3 sync dist/ s3://$BUCKET/ --delete --region $REGION

# 3. Invalidar cache CloudFront
echo "⚡ Invalidando cache CloudFront..."
aws cloudfront create-invalidation \
  --distribution-id E25WC5F9DBJYEH \
  --paths "/*" \
  --region $REGION

echo "✅ Deploy concluído!"
echo ""
echo "🌐 URLs de acesso:"
echo "S3: https://$BUCKET.s3-website-$REGION.amazonaws.com/"
echo "CloudFront: https://$CLOUDFRONT_DOMAIN/"
echo ""
echo "🎯 Acesse agora:"
echo "https://d1px7ovdnymfyn.cloudfront.net/"
