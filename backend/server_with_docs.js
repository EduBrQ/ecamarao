/**
 * Backend EcoMarão - Node.js + Express + PostgreSQL + Swagger
 * Simples, robusto e sem problemas de encoding
 */

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Configuração
const PORT = process.env.PORT || 8000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:admin@localhost:5432/ecamarao';

// Pool de conexão PostgreSQL
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Schema de validação
const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('user', 'admin', 'operador', 'tecnico').default('user')
});

const viveiroSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  densidade: Joi.number().min(1).max(1000).required(),
  area: Joi.number().min(1).max(100000).required(),
  data_inicio_ciclo: Joi.date().iso().required(),
  status: Joi.string().valid('ativo', 'inativo', 'manutencao').default('ativo')
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Configuração do Swagger
const options = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoMarão API',
      version: '1.0.0',
      description: 'API para gerenciamento de viveiros e usuários',
    },
    servers: [
      {
        url: 'http://localhost:8000',
      },
    ],
  },
  apis: ['./server_with_docs.js'],
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// Health Check
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'PostgreSQL conectado',
      server_time: result.rows[0].current_time
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'PostgreSQL erro',
      error: error.message
    });
  }
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'EcoMarão - Backend Node.js com Swagger',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    docs: '/api-docs',
    database: 'PostgreSQL'
  });
});

// Registrar Usuário
app.post('/api/users/register', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details 
      });
    }

    const { username, email, password, role } = value;

    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Username already exists' 
      });
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Inserir usuário
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING id, username, email, role, created_at`,
      [username, email, hashedPassword, role || 'user']
    );

    res.status(201).json({
      id: result.rows[0].id,
      username: result.rows[0].username,
      email: result.rows[0].email,
      role: result.rows[0].role,
      created_at: result.rows[0].created_at
    });

  } catch (error) {
    console.error('Register user error:', error);
    res.status(500).json({ 
      error: 'Error creating user', 
      details: error.message 
    });
  }
});

// Listar Usuários
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );

    res.json(result.rows);

  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ 
      error: 'Error listing users', 
      details: error.message 
    });
  }
});

// Criar Viveiro
app.post('/api/viveiros', async (req, res) => {
  try {
    // Validar dados
    const { error, value } = viveiroSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details 
      });
    }

    const { nome, densidade, area, data_inicio_ciclo, status } = value;

    // Inserir viveiro
    const result = await pool.query(
      `INSERT INTO viveiros (nome, densidade, area, data_inicio_ciclo, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, nome, densidade, area, data_inicio_ciclo, status, created_at`,
      [nome, densidade, area, data_inicio_ciclo, status || 'ativo']
    );

    res.status(201).json({
      id: result.rows[0].id,
      nome: result.rows[0].nome,
      densidade: parseFloat(result.rows[0].densidade),
      area: parseFloat(result.rows[0].area),
      data_inicio_ciclo: result.rows[0].data_inicio_ciclo,
      status: result.rows[0].status,
      created_at: result.rows[0].created_at
    });

  } catch (error) {
    console.error('Create viveiro error:', error);
    res.status(500).json({ 
      error: 'Error creating viveiro', 
      details: error.message 
    });
  }
});

// Listar Viveiros
app.get('/api/viveiros', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, densidade, area, data_inicio_ciclo, status, created_at FROM viveiros ORDER BY created_at DESC'
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      nome: row.nome,
      densidade: parseFloat(row.densidade),
      area: parseFloat(row.area),
      data_inicio_ciclo: row.data_inicio_ciclo,
      status: row.status,
      created_at: row.created_at
    })));

  } catch (error) {
    console.error('List viveiros error:', error);
    res.status(500).json({ 
      error: 'Error listing viveiros', 
      details: error.message 
    });
  }
});

// Após a linha 236 (GET /api/viveiros)
app.get('/api/viveiros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM viveiros WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Viveiro não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar viveiro:', error);
    res.status(500).json({ error: 'Erro ao buscar viveiro' });
  }
});

// Helper: calcular dias de cultivo (DOC)
function calcularDOC(dataInicio) {
  if (!dataInicio) return 0;
  const inicio = new Date(dataInicio);
  const hoje = new Date();
  const diff = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// Endpoint para dados de ração de um viveiro
app.get('/api/viveiros/:id/racao', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se viveiro existe
    const viveiroResult = await pool.query(
      'SELECT * FROM viveiros WHERE id = $1',
      [id]
    );
    
    if (viveiroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Viveiro não encontrado' });
    }
    
    // Criar tabela se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coletas_racao (
        id SERIAL PRIMARY KEY,
        viveiro_id INTEGER REFERENCES viveiros(id),
        data DATE NOT NULL,
        qnt_manha DECIMAL(10,2) NOT NULL,
        qnt_tarde DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Buscar todos os registros de ração do viveiro
    const racaoResult = await pool.query(
      'SELECT id, data, qnt_manha as "qntManha", qnt_tarde as "qntTarde" FROM coletas_racao WHERE viveiro_id = $1 ORDER BY data DESC',
      [id]
    );
    
    // Converter para garantir que valores numéricos sejam numbers
    const racaoData = racaoResult.rows.map(row => ({
      ...row,
      qntManha: parseFloat(row.qntManha) || 0,
      qntTarde: parseFloat(row.qntTarde) || 0,
      data: new Date(row.data).toISOString().split('T')[0] // Formatar data como YYYY-MM-DD
    }));
    
    // Adicionar dados simulados para cálculo de FCR (implementação real: criar tabela de pesagens)
    const pesoMedioEstimado = 0.015; // 15g em média (valor estimado)
    const diasCultivo = calcularDOC(viveiroResult.rows[0].data_inicio_ciclo);
    
    res.json({
      racoes: racaoData,
      peso_medio: pesoMedioEstimado,
      dias_cultivo: diasCultivo
    });
  } catch (error) {
    console.error('Erro ao buscar dados de ração:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de ração' });
  }
});

// Endpoint para criar coleta de ração
app.post('/api/viveiros/:id/racao', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, qnt_manha, qnt_tarde } = req.body;
    
    // Verificar se viveiro existe
    const viveiroResult = await pool.query(
      'SELECT * FROM viveiros WHERE id = $1',
      [id]
    );
    
    if (viveiroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Viveiro não encontrado' });
    }
    
    // Criar tabela se não existir
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coletas_racao (
        id SERIAL PRIMARY KEY,
        viveiro_id INTEGER REFERENCES viveiros(id),
        data DATE NOT NULL,
        qnt_manha DECIMAL(10,2) NOT NULL,
        qnt_tarde DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Inserir novo registro de ração
    const insertResult = await pool.query(
      'INSERT INTO coletas_racao (viveiro_id, data, qnt_manha, qnt_tarde) VALUES ($1, $2, $3, $4) RETURNING id, data, qnt_manha as "qntManha", qnt_tarde as "qntTarde"',
      [id, data, qnt_manha, qnt_tarde]
    );
    
    // Converter para garantir que valores numéricos sejam numbers
    const newRecord = {
      ...insertResult.rows[0],
      qntManha: parseFloat(insertResult.rows[0].qntManha) || 0,
      qntTarde: parseFloat(insertResult.rows[0].qntTarde) || 0,
      data: new Date(insertResult.rows[0].data).toISOString().split('T')[0] // Formatar data como YYYY-MM-DD
    };
    
    // Atualizar quantidade de ração no viveiro (opcional)
    const totalRacao = qnt_manha + qnt_tarde;
    await pool.query(
      'UPDATE viveiros SET quantidade_racao = $1, data_ultima_alimentacao = $2 WHERE id = $3',
      [totalRacao, data, id]
    );
    
    // Retornar o registro criado
    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Erro ao criar coleta de ração:', error);
    res.status(500).json({ error: 'Erro ao criar coleta de ração' });
  }
});

// Endpoint para dados de mortalidade de um viveiro
app.get('/api/viveiros/:id/mortalidade', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se viveiro existe
    const viveiroResult = await pool.query(
      'SELECT * FROM viveiros WHERE id = $1',
      [id]
    );
    
    if (viveiroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Viveiro não encontrado' });
    }
    
    // Retornar array vazio por enquanto (implementar tabela real depois)
    // Frontend espera array de RegistroMortalidade[]
    const mortalidadeData = [];
    
    res.json(mortalidadeData);
  } catch (error) {
    console.error('Erro ao buscar dados de mortalidade:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de mortalidade' });
  }
});

// Estatísticas
app.get('/api/stats', async (req, res) => {
  try {
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const viveirosResult = await pool.query('SELECT COUNT(*) as count FROM viveiros');

    res.json({
      users: parseInt(usersResult.rows[0].count),
      viveiros: parseInt(viveirosResult.rows[0].count),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ 
      error: 'Error getting stats', 
      details: error.message 
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    details: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    timestamp: new Date().toISOString(),
    path: req.path
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Testar conexão com PostgreSQL
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    console.log('🚀 Iniciando backend EcoMarão (Node.js com Swagger)...');
    console.log('📊 Banco: PostgreSQL conectado');
    console.log('🌐 Servidor: http://localhost:' + PORT);
    console.log('📖 Documentação: http://localhost:' + PORT + '/api-docs');
    console.log('⚠️  Pressione CTRL+C para parar');
    console.log('');

    app.listen(PORT, () => {
      console.log('✅ Servidor rodando na porta ' + PORT);
    });

  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
    console.error('💡 Verifique se o PostgreSQL está rodando e se as credenciais estão corretas');
    process.exit(1);
  }
};

// Iniciar
startServer();
