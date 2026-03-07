#!/bin/bash

# Script para configurar behaviors do CloudFront para AquaFarm
# Uso: ./setup-cloudfront-behaviors.sh

set -e

# Configurações
DISTRIBUTION_ID="E25WC5F9DBJYEH"
EC2_ORIGIN="ec2-18-229-126-89.sa-east-1.compute.amazonaws.com"
EC2_ORIGIN_PORT="8000"
S3_ORIGIN="S3-aquafarm-app-1772761451"

echo "🔧 Configurando behaviors do CloudFront para AquaFarm..."

# Obter configuração atual da distribuição
echo "📥 Obtendo configuração atual..."
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID > dist-config.json

# Extrair ETag para atualização
ETAG=$(jq -r '.ETag' dist-config.json)
DIST_CONFIG=$(jq '.DistributionConfig' dist-config.json)

# Backup do config original
cp dist-config.json dist-config-backup.json

echo "🔨 Criando behaviors..."

# Preparar novo array de behaviors
BEHAVIORS='[
    {
        "PathPattern": "api/viveiros/*",
        "TargetOriginId": "ecamarao-backend-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 7,
            "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
            "CachedMethods": {
                "Quantity": 3,
                "Items": ["GET", "HEAD", "OPTIONS"]
            }
        },
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "all"
            }
        },
        "MinTTL": 0,
        "Compress": true,
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "OriginRequestPolicyId": "6872f5b2-ebe2-46a7-bd9f-0ae7d69b072f"
    },
    {
        "PathPattern": "api/*",
        "TargetOriginId": "ecamarao-backend-origin",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 7,
            "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
            "CachedMethods": {
                "Quantity": 3,
                "Items": ["GET", "HEAD", "OPTIONS"]
            }
        },
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "all"
            }
        },
        "MinTTL": 0,
        "Compress": true,
        "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
        "OriginRequestPolicyId": "6872f5b2-ebe2-46a7-bd9f-0ae7d69b072f"
    },
    {
        "PathPattern": "*",
        "TargetOriginId": "'$S3_ORIGIN'",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["GET", "HEAD"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "ForwardedValues": {
            "QueryString": true,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 86400,
        "Compress": true
    }
]'

# Verificar se origem EC2 já existe
EC2_ORIGIN_EXISTS=$(echo $DIST_CONFIG | jq '.Origins.Items[] | select(.Id == "ecamarao-backend-origin") | .Id')

if [ "$EC2_ORIGIN_EXISTS" = "ecamarao-backend-origin" ]; then
    echo "✅ Origem EC2 já existe"
    UPDATED_CONFIG=$(echo $DIST_CONFIG | jq "
        .CacheBehaviors.Items = [] |
        .DefaultCacheBehavior.TargetOriginId = \"$S3_ORIGIN\" |
        .DefaultCacheBehavior.CachePolicyId = \"4135ea2d-6df8-44a3-9df3-4b5a84be39ad\" |
        .CacheBehaviors = {\"Quantity\": 2, \"Items\": $BEHAVIORS[0:2]}
    ")
else
    echo "🔧 Adicionando origem EC2..."
    UPDATED_CONFIG=$(echo $DIST_CONFIG | jq "
        .Origins.Items += [
            {
                \"Id\": \"ecamarao-backend-origin\",
                \"DomainName\": \"$EC2_ORIGIN\",
                \"CustomOriginConfig\": {
                    \"HTTPPort\": $EC2_ORIGIN_PORT,
                    \"HTTPSPort\": 443,
                    \"OriginProtocolPolicy\": \"http-only\",
                    \"OriginSslProtocols\": {
                        \"Quantity\": 0,
                        \"Items\": []
                    }
                }
            }
        ] |
        .CacheBehaviors.Items = [] |
        .DefaultCacheBehavior.TargetOriginId = \"$S3_ORIGIN\" |
        .DefaultCacheBehavior.CachePolicyId = \"4135ea2d-6df8-44a3-9df3-4b5a84be39ad\" |
        .CacheBehaviors = {\"Quantity\": 2, \"Items\": $BEHAVIORS[0:2]}
    ")
fi

# Criar arquivo de configuração atualizado
echo $UPDATED_CONFIG | jq '.' > updated-config.json

# Atualizar distribuição
echo "📤 Atualizando distribuição $DISTRIBUTION_ID..."
aws cloudfront update-distribution \
    --id $DISTRIBUTION_ID \
    --distribution-config file://updated-config.json \
    --if-match $ETAG

echo "✅ Configuração atualizada!"
echo ""
echo "⏳ Aguardando deploy (5-10 minutos)..."
echo ""
echo "🧪 Teste após o deploy:"
echo "curl https://d1px7ovdnymfyn.cloudfront.net/api/health"
echo "curl https://d1px7ovdnymfyn.cloudfront.net/api/viveiros"
echo "curl https://d1px7ovdnymfyn.cloudfront.net/api/viveiros/2"
echo "curl https://d1px7ovdnymfyn.cloudfront.net/api/viveiros/3/racao"
echo ""
echo "🌐 Frontend: https://d1px7ovdnymfyn.cloudfront.net"

# Limpar arquivos temporários
rm -f dist-config.json updated-config.json
