#!/bin/bash
# Script para rodar frontend e backend em paralelo

# Caminhos relativos
FRONTEND_DIR="frontend"
BACKEND_DIR="backend"

# Rodar frontend e backend em paralelo
(
  cd "$FRONTEND_DIR"
  echo "Iniciando frontend..."
  npm run dev
) &

(
  cd "$BACKEND_DIR"
  echo "Iniciando backend..."
  npm run dev
) &

# Espera ambos terminarem (Ctrl+C para parar)
wait
