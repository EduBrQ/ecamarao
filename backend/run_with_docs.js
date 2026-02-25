#!/usr/bin/env node
/**
 * Iniciar backend EcoMarão com Swagger
 */

const { spawn } = require('child_process');

console.log('🚀 Iniciando backend EcoMarão (Node.js com Swagger)...');
console.log('📊 Banco: PostgreSQL');
console.log('🌐 Servidor: http://localhost:8000');
console.log('📖 Documentação: http://localhost:8000/api-docs');
console.log('⚠️  Pressione CTRL+C para parar');
console.log('');

// Iniciar servidor com nodemon para desenvolvimento
const server = spawn('nodemon', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

server.on('close', (code) => {
  console.log(`Servidor parado com código: ${code}`);
});

server.on('error', (error) => {
  console.error('Erro ao iniciar servidor:', error);
});
