/**
 * Backend EcoMarão - Node.js + Express + PostgreSQL
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
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.18.21:5173', /^http:\/\/192\.168\.\d+\.\d+:5173$/],
  credentials: true
}));
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

// Schema para Coleta de Ração
const racaoSchema = Joi.object({
  viveiro_id: Joi.number().integer().positive().required(),
  data: Joi.date().iso().required(),
  qnt_manha: Joi.number().min(0).max(1000).default(0),
  qnt_tarde: Joi.number().min(0).max(1000).default(0)
});

// Schema para Medições de Qualidade da Água
const medicaoSchema = Joi.object({
  viveiro_id: Joi.number().integer().positive().required(),
  data: Joi.date().iso().required(),
  oxigenio: Joi.number().min(0).max(20).required(),
  ph: Joi.number().min(0).max(14).required(),
  temperatura: Joi.number().min(0).max(50).required(),
  alcalinidade: Joi.number().min(0).max(500).required(),
  transparencia: Joi.number().min(0).max(200).required(),
  salinidade: Joi.number().min(0).max(100).required()
});

// Schema para Registro de Mortalidade
const mortalidadeSchema = Joi.object({
  viveiro_id: Joi.number().integer().positive().required(),
  data: Joi.date().iso().required(),
  quantidade: Joi.number().integer().min(1).max(1000000).required(),
  causa: Joi.string().min(3).max(200).required()
});

// Schema para Aeradores
const aeradorSchema = Joi.object({
  viveiro_id: Joi.number().integer().positive().required(),
  nome: Joi.string().min(3).max(100).required(),
  status: Joi.boolean().default(false)
});

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Setup Database Tables
app.post('/setup', async (req, res) => {
  try {
    console.log('Creating database tables...');
    
    // Criar tabela de coletas de ração
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coletas_racao (
        id SERIAL PRIMARY KEY,
        viveiro_id INTEGER NOT NULL REFERENCES viveiros(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        qnt_manha DECIMAL(10,2) DEFAULT 0,
        qnt_tarde DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(viveiro_id, data)
      )
    `);

    // Criar tabela de medições de qualidade da água
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicoes_agua (
        id SERIAL PRIMARY KEY,
        viveiro_id INTEGER NOT NULL REFERENCES viveiros(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        oxigenio DECIMAL(5,2) NOT NULL,
        ph DECIMAL(4,2) NOT NULL,
        temperatura DECIMAL(5,2) NOT NULL,
        alcalinidade DECIMAL(6,2) NOT NULL,
        transparencia DECIMAL(6,2) NOT NULL,
        salinidade DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Criar tabela de registros de mortalidade
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registros_mortalidade (
        id SERIAL PRIMARY KEY,
        viveiro_id INTEGER NOT NULL REFERENCES viveiros(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        quantidade INTEGER NOT NULL,
        causa VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Criar tabela de aeradores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS aeradores (
        id SERIAL PRIMARY KEY,
        viveiro_id INTEGER NOT NULL REFERENCES viveiros(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        status BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Criar índices para performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_coletas_racao_viveiro_data ON coletas_racao(viveiro_id, data)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_medicoes_agua_viveiro_data ON medicoes_agua(viveiro_id, data)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_mortalidade_viveiro_data ON registros_mortalidade(viveiro_id, data)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_aeradores_viveiro ON aeradores(viveiro_id)');

    res.json({
      message: 'Database tables created successfully',
      timestamp: new Date().toISOString(),
      tables: ['coletas_racao', 'medicoes_agua', 'registros_mortalidade', 'aeradores']
    });

  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      error: 'Error creating tables',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
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
    message: 'EcoMarão - Backend Node.js',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    docs: '/docs',
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

// Buscar Viveiro por ID
app.get('/api/viveiros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'ID inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const result = await pool.query(
      'SELECT id, nome, densidade, area, data_inicio_ciclo, status, created_at FROM viveiros WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Viveiro não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const row = result.rows[0];
    res.json({
      id: row.id,
      nome: row.nome,
      densidade: parseFloat(row.densidade),
      area: parseFloat(row.area),
      data_inicio_ciclo: row.data_inicio_ciclo,
      status: row.status,
      created_at: row.created_at
    });

  } catch (error) {
    console.error('Get viveiro error:', error);
    res.status(500).json({ 
      error: 'Error getting viveiro', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
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

// Atualizar Viveiro
app.put('/api/viveiros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'ID inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Validar dados
    const { error, value } = viveiroSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const { nome, densidade, area, data_inicio_ciclo, status } = value;

    // Verificar se viveiro existe
    const existsResult = await pool.query('SELECT id FROM viveiros WHERE id = $1', [id]);
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Viveiro não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Atualizar viveiro
    const result = await pool.query(
      `UPDATE viveiros 
       SET nome = $1, densidade = $2, area = $3, data_inicio_ciclo = $4, status = $5
       WHERE id = $6
       RETURNING id, nome, densidade, area, data_inicio_ciclo, status, created_at`,
      [nome, densidade, area, data_inicio_ciclo, status || 'ativo', id]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      nome: row.nome,
      densidade: parseFloat(row.densidade),
      area: parseFloat(row.area),
      data_inicio_ciclo: row.data_inicio_ciclo,
      status: row.status,
      created_at: row.created_at
    });

  } catch (error) {
    console.error('Update viveiro error:', error);
    res.status(500).json({ 
      error: 'Error updating viveiro', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Deletar Viveiro
app.delete('/api/viveiros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'ID inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Verificar se viveiro existe
    const existsResult = await pool.query('SELECT id FROM viveiros WHERE id = $1', [id]);
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Viveiro não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Deletar viveiro
    await pool.query('DELETE FROM viveiros WHERE id = $1', [id]);

    res.json({
      message: 'Viveiro deletado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete viveiro error:', error);
    res.status(500).json({ 
      error: 'Error deleting viveiro', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// ===== COLETAS DE RAÇÃO =====

// Listar coletas de ração por viveiro
app.get('/api/viveiros/:viveiroId/racao', async (req, res) => {
  try {
    const { viveiroId } = req.params;
    
    // Validar ID
    if (!viveiroId || isNaN(parseInt(viveiroId))) {
      return res.status(400).json({ 
        error: 'ID de viveiro inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const result = await pool.query(
      'SELECT * FROM coletas_racao WHERE viveiro_id = $1 ORDER BY data DESC',
      [viveiroId]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      viveiro_id: row.viveiro_id,
      data: row.data,
      qntManha: parseFloat(row.qnt_manha),
      qntTarde: parseFloat(row.qnt_tarde),
      created_at: row.created_at
    })));

  } catch (error) {
    console.error('List racao error:', error);
    res.status(500).json({ 
      error: 'Error listing racao', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Criar coleta de ração
app.post('/api/viveiros/:viveiroId/racao', async (req, res) => {
  try {
    const { viveiroId } = req.params;
    
    // Validar ID
    if (!viveiroId || isNaN(parseInt(viveiroId))) {
      return res.status(400).json({ 
        error: 'ID de viveiro inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Validar dados
    const { error, value } = racaoSchema.validate({ 
      ...req.body, 
      viveiro_id: parseInt(viveiroId) 
    });
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const { data, qnt_manha, qnt_tarde } = value;

    // Verificar se viveiro existe
    const viveiroExists = await pool.query('SELECT id FROM viveiros WHERE id = $1', [viveiroId]);
    if (viveiroExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Viveiro não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Inserir ou atualizar (UPSERT)
    const result = await pool.query(
      `INSERT INTO coletas_racao (viveiro_id, data, qnt_manha, qnt_tarde) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (viveiro_id, data) 
       DO UPDATE SET qnt_manha = $3, qnt_tarde = $4
       RETURNING id, viveiro_id, data, qnt_manha, qnt_tarde, created_at`,
      [viveiroId, data, qnt_manha, qnt_tarde]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      viveiro_id: row.viveiro_id,
      data: row.data,
      qntManha: parseFloat(row.qnt_manha),
      qntTarde: parseFloat(row.qnt_tarde),
      created_at: row.created_at
    });

  } catch (error) {
    console.error('Create racao error:', error);
    res.status(500).json({ 
      error: 'Error creating racao', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Atualizar coleta de ração
app.put('/api/viveiros/:viveiroId/racao/:id', async (req, res) => {
  try {
    const { viveiroId, id } = req.params;
    
    // Validar IDs
    if (!viveiroId || isNaN(parseInt(viveiroId)) || !id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'IDs inválidos', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Validar dados
    const { error, value } = racaoSchema.validate({ 
      ...req.body, 
      viveiro_id: parseInt(viveiroId) 
    });
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const { data, qnt_manha, qnt_tarde } = value;

    // Verificar se registro existe
    const existsResult = await pool.query(
      'SELECT id FROM coletas_racao WHERE id = $1 AND viveiro_id = $2', 
      [id, viveiroId]
    );
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Coleta de ração não encontrada',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Atualizar
    const result = await pool.query(
      `UPDATE coletas_racao 
       SET data = $1, qnt_manha = $2, qnt_tarde = $3
       WHERE id = $4 AND viveiro_id = $5
       RETURNING id, viveiro_id, data, qnt_manha, qnt_tarde, created_at`,
      [data, qnt_manha, qnt_tarde, id, viveiroId]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      viveiro_id: row.viveiro_id,
      data: row.data,
      qntManha: parseFloat(row.qnt_manha),
      qntTarde: parseFloat(row.qnt_tarde),
      created_at: row.created_at
    });

  } catch (error) {
    console.error('Update racao error:', error);
    res.status(500).json({ 
      error: 'Error updating racao', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Deletar coleta de ração
app.delete('/api/viveiros/:viveiroId/racao/:id', async (req, res) => {
  try {
    const { viveiroId, id } = req.params;
    
    // Validar IDs
    if (!viveiroId || isNaN(parseInt(viveiroId)) || !id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'IDs inválidos', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Verificar se registro existe
    const existsResult = await pool.query(
      'SELECT id FROM coletas_racao WHERE id = $1 AND viveiro_id = $2', 
      [id, viveiroId]
    );
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Coleta de ração não encontrada',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Deletar
    await pool.query('DELETE FROM coletas_racao WHERE id = $1 AND viveiro_id = $2', [id, viveiroId]);

    res.json({
      message: 'Coleta de ração deletada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete racao error:', error);
    res.status(500).json({ 
      error: 'Error deleting racao', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// ===== MEDIÇÕES DE QUALIDADE DA ÁGUA =====

// Listar medições por viveiro
app.get('/api/viveiros/:viveiroId/medicoes', async (req, res) => {
  try {
    const { viveiroId } = req.params;
    
    // Validar ID
    if (!viveiroId || isNaN(parseInt(viveiroId))) {
      return res.status(400).json({ 
        error: 'ID de viveiro inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const result = await pool.query(
      'SELECT * FROM medicoes_agua WHERE viveiro_id = $1 ORDER BY data DESC',
      [viveiroId]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      viveiro_id: row.viveiro_id,
      data: row.data,
      oxigenio: parseFloat(row.oxigenio),
      ph: parseFloat(row.ph),
      temperatura: parseFloat(row.temperatura),
      alcalinidade: parseFloat(row.alcalinidade),
      transparencia: parseFloat(row.transparencia),
      salinidade: parseFloat(row.salinidade),
      created_at: row.created_at
    })));

  } catch (error) {
    console.error('List medicoes error:', error);
    res.status(500).json({ 
      error: 'Error listing medicoes', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Criar medição
app.post('/api/viveiros/:viveiroId/medicoes', async (req, res) => {
  try {
    const { viveiroId } = req.params;
    
    // Validar ID
    if (!viveiroId || isNaN(parseInt(viveiroId))) {
      return res.status(400).json({ 
        error: 'ID de viveiro inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Validar dados
    const { error, value } = medicaoSchema.validate({ 
      ...req.body, 
      viveiro_id: parseInt(viveiroId) 
    });
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const { data, oxigenio, ph, temperatura, alcalinidade, transparencia, salinidade } = value;

    // Verificar se viveiro existe
    const viveiroExists = await pool.query('SELECT id FROM viveiros WHERE id = $1', [viveiroId]);
    if (viveiroExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Viveiro não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Inserir medição
    const result = await pool.query(
      `INSERT INTO medicoes_agua (viveiro_id, data, oxigenio, ph, temperatura, alcalinidade, transparencia, salinidade) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, viveiro_id, data, oxigenio, ph, temperatura, alcalinidade, transparencia, salinidade, created_at`,
      [viveiroId, data, oxigenio, ph, temperatura, alcalinidade, transparencia, salinidade]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      viveiro_id: row.viveiro_id,
      data: row.data,
      oxigenio: parseFloat(row.oxigenio),
      ph: parseFloat(row.ph),
      temperatura: parseFloat(row.temperatura),
      alcalinidade: parseFloat(row.alcalinidade),
      transparencia: parseFloat(row.transparencia),
      salinidade: parseFloat(row.salinidade),
      created_at: row.created_at
    });

  } catch (error) {
    console.error('Create medicao error:', error);
    res.status(500).json({ 
      error: 'Error creating medicao', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Atualizar medição
app.put('/api/viveiros/:viveiroId/medicoes/:id', async (req, res) => {
  try {
    const { viveiroId, id } = req.params;
    
    // Validar IDs
    if (!viveiroId || isNaN(parseInt(viveiroId)) || !id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'IDs inválidos', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Validar dados
    const { error, value } = medicaoSchema.validate({ 
      ...req.body, 
      viveiro_id: parseInt(viveiroId) 
    });
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const { data, oxigenio, ph, temperatura, alcalinidade, transparencia, salinidade } = value;

    // Verificar se registro existe
    const existsResult = await pool.query(
      'SELECT id FROM medicoes_agua WHERE id = $1 AND viveiro_id = $2', 
      [id, viveiroId]
    );
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Medição não encontrada',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Atualizar
    const result = await pool.query(
      `UPDATE medicoes_agua 
       SET data = $1, oxigenio = $2, ph = $3, temperatura = $4, alcalinidade = $5, transparencia = $6, salinidade = $7
       WHERE id = $8 AND viveiro_id = $9
       RETURNING id, viveiro_id, data, oxigenio, ph, temperatura, alcalinidade, transparencia, salinidade, created_at`,
      [data, oxigenio, ph, temperatura, alcalinidade, transparencia, salinidade, id, viveiroId]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      viveiro_id: row.viveiro_id,
      data: row.data,
      oxigenio: parseFloat(row.oxigenio),
      ph: parseFloat(row.ph),
      temperatura: parseFloat(row.temperatura),
      alcalinidade: parseFloat(row.alcalinidade),
      transparencia: parseFloat(row.transparencia),
      salinidade: parseFloat(row.salinidade),
      created_at: row.created_at
    });

  } catch (error) {
    console.error('Update medicao error:', error);
    res.status(500).json({ 
      error: 'Error updating medicao', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Deletar medição
app.delete('/api/viveiros/:viveiroId/medicoes/:id', async (req, res) => {
  try {
    const { viveiroId, id } = req.params;
    
    // Validar IDs
    if (!viveiroId || isNaN(parseInt(viveiroId)) || !id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'IDs inválidos', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Verificar se registro existe
    const existsResult = await pool.query(
      'SELECT id FROM medicoes_agua WHERE id = $1 AND viveiro_id = $2', 
      [id, viveiroId]
    );
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Medição não encontrada',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Deletar
    await pool.query('DELETE FROM medicoes_agua WHERE id = $1 AND viveiro_id = $2', [id, viveiroId]);

    res.json({
      message: 'Medição deletada com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete medicao error:', error);
    res.status(500).json({ 
      error: 'Error deleting medicao', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// ===== REGISTROS DE MORTALIDADE =====

// Listar registros de mortalidade por viveiro
app.get('/api/viveiros/:viveiroId/mortalidade', async (req, res) => {
  try {
    const { viveiroId } = req.params;
    
    // Validar ID
    if (!viveiroId || isNaN(parseInt(viveiroId))) {
      return res.status(400).json({ 
        error: 'ID de viveiro inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const result = await pool.query(
      'SELECT * FROM registros_mortalidade WHERE viveiro_id = $1 ORDER BY data DESC',
      [viveiroId]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      viveiro_id: row.viveiro_id,
      data: row.data,
      quantidade: row.quantidade,
      causa: row.causa,
      created_at: row.created_at
    })));

  } catch (error) {
    console.error('List mortalidade error:', error);
    res.status(500).json({ 
      error: 'Error listing mortalidade', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Criar registro de mortalidade
app.post('/api/viveiros/:viveiroId/mortalidade', async (req, res) => {
  try {
    const { viveiroId } = req.params;
    
    // Validar ID
    if (!viveiroId || isNaN(parseInt(viveiroId))) {
      return res.status(400).json({ 
        error: 'ID de viveiro inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Validar dados
    const { error, value } = mortalidadeSchema.validate({ 
      ...req.body, 
      viveiro_id: parseInt(viveiroId) 
    });
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const { data, quantidade, causa } = value;

    // Verificar se viveiro existe
    const viveiroExists = await pool.query('SELECT id FROM viveiros WHERE id = $1', [viveiroId]);
    if (viveiroExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Viveiro não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Inserir registro
    const result = await pool.query(
      `INSERT INTO registros_mortalidade (viveiro_id, data, quantidade, causa) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, viveiro_id, data, quantidade, causa, created_at`,
      [viveiroId, data, quantidade, causa]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      viveiro_id: row.viveiro_id,
      data: row.data,
      quantidade: row.quantidade,
      causa: row.causa,
      created_at: row.created_at
    });

  } catch (error) {
    console.error('Create mortalidade error:', error);
    res.status(500).json({ 
      error: 'Error creating mortalidade', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Atualizar registro de mortalidade
app.put('/api/viveiros/:viveiroId/mortalidade/:id', async (req, res) => {
  try {
    const { viveiroId, id } = req.params;
    
    // Validar IDs
    if (!viveiroId || isNaN(parseInt(viveiroId)) || !id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'IDs inválidos', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Validar dados
    const { error, value } = mortalidadeSchema.validate({ 
      ...req.body, 
      viveiro_id: parseInt(viveiroId) 
    });
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const { data, quantidade, causa } = value;

    // Verificar se registro existe
    const existsResult = await pool.query(
      'SELECT id FROM registros_mortalidade WHERE id = $1 AND viveiro_id = $2', 
      [id, viveiroId]
    );
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Registro de mortalidade não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Atualizar
    const result = await pool.query(
      `UPDATE registros_mortalidade 
       SET data = $1, quantidade = $2, causa = $3
       WHERE id = $4 AND viveiro_id = $5
       RETURNING id, viveiro_id, data, quantidade, causa, created_at`,
      [data, quantidade, causa, id, viveiroId]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      viveiro_id: row.viveiro_id,
      data: row.data,
      quantidade: row.quantidade,
      causa: row.causa,
      created_at: row.created_at
    });

  } catch (error) {
    console.error('Update mortalidade error:', error);
    res.status(500).json({ 
      error: 'Error updating mortalidade', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Deletar registro de mortalidade
app.delete('/api/viveiros/:viveiroId/mortalidade/:id', async (req, res) => {
  try {
    const { viveiroId, id } = req.params;
    
    // Validar IDs
    if (!viveiroId || isNaN(parseInt(viveiroId)) || !id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'IDs inválidos', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Verificar se registro existe
    const existsResult = await pool.query(
      'SELECT id FROM registros_mortalidade WHERE id = $1 AND viveiro_id = $2', 
      [id, viveiroId]
    );
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Registro de mortalidade não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Deletar
    await pool.query('DELETE FROM registros_mortalidade WHERE id = $1 AND viveiro_id = $2', [id, viveiroId]);

    res.json({
      message: 'Registro de mortalidade deletado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete mortalidade error:', error);
    res.status(500).json({ 
      error: 'Error deleting mortalidade', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// ===== AERADORES =====

// Listar aeradores por viveiro
app.get('/api/viveiros/:viveiroId/aeradores', async (req, res) => {
  try {
    const { viveiroId } = req.params;
    
    // Validar ID
    if (!viveiroId || isNaN(parseInt(viveiroId))) {
      return res.status(400).json({ 
        error: 'ID de viveiro inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const result = await pool.query(
      'SELECT * FROM aeradores WHERE viveiro_id = $1 ORDER BY id',
      [viveiroId]
    );

    res.json(result.rows.map(row => ({
      id: row.id,
      viveiro_id: row.viveiro_id,
      nome: row.nome,
      status: row.status,
      created_at: row.created_at
    })));

  } catch (error) {
    console.error('List aeradores error:', error);
    res.status(500).json({ 
      error: 'Error listing aeradores', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Criar aerador
app.post('/api/viveiros/:viveiroId/aeradores', async (req, res) => {
  try {
    const { viveiroId } = req.params;
    
    // Validar ID
    if (!viveiroId || isNaN(parseInt(viveiroId))) {
      return res.status(400).json({ 
        error: 'ID de viveiro inválido', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Validar dados
    const { error, value } = aeradorSchema.validate({ 
      ...req.body, 
      viveiro_id: parseInt(viveiroId) 
    });
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const { nome, status } = value;

    // Verificar se viveiro existe
    const viveiroExists = await pool.query('SELECT id FROM viveiros WHERE id = $1', [viveiroId]);
    if (viveiroExists.rows.length === 0) {
      return res.status(404).json({
        error: 'Viveiro não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Inserir aerador
    const result = await pool.query(
      `INSERT INTO aeradores (viveiro_id, nome, status) 
       VALUES ($1, $2, $3) 
       RETURNING id, viveiro_id, nome, status, created_at`,
      [viveiroId, nome, status]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      viveiro_id: row.viveiro_id,
      nome: row.nome,
      status: row.status,
      created_at: row.created_at
    });

  } catch (error) {
    console.error('Create aerador error:', error);
    res.status(500).json({ 
      error: 'Error creating aerador', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Atualizar aerador
app.put('/api/viveiros/:viveiroId/aeradores/:id', async (req, res) => {
  try {
    const { viveiroId, id } = req.params;
    
    // Validar IDs
    if (!viveiroId || isNaN(parseInt(viveiroId)) || !id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'IDs inválidos', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Validar dados
    const { error, value } = aeradorSchema.validate({ 
      ...req.body, 
      viveiro_id: parseInt(viveiroId) 
    });
    if (error) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: error.details[0].message,
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    const { nome, status } = value;

    // Verificar se registro existe
    const existsResult = await pool.query(
      'SELECT id FROM aeradores WHERE id = $1 AND viveiro_id = $2', 
      [id, viveiroId]
    );
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Aerador não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Atualizar
    const result = await pool.query(
      `UPDATE aeradores 
       SET nome = $1, status = $2
       WHERE id = $3 AND viveiro_id = $4
       RETURNING id, viveiro_id, nome, status, created_at`,
      [nome, status, id, viveiroId]
    );

    const row = result.rows[0];
    res.json({
      id: row.id,
      viveiro_id: row.viveiro_id,
      nome: row.nome,
      status: row.status,
      created_at: row.created_at
    });

  } catch (error) {
    console.error('Update aerador error:', error);
    res.status(500).json({ 
      error: 'Error updating aerador', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Deletar aerador
app.delete('/api/viveiros/:viveiroId/aeradores/:id', async (req, res) => {
  try {
    const { viveiroId, id } = req.params;
    
    // Validar IDs
    if (!viveiroId || isNaN(parseInt(viveiroId)) || !id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'IDs inválidos', 
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Verificar se registro existe
    const existsResult = await pool.query(
      'SELECT id FROM aeradores WHERE id = $1 AND viveiro_id = $2', 
      [id, viveiroId]
    );
    if (existsResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Aerador não encontrado',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Deletar
    await pool.query('DELETE FROM aeradores WHERE id = $1 AND viveiro_id = $2', [id, viveiroId]);

    res.json({
      message: 'Aerador deletado com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete aerador error:', error);
    res.status(500).json({ 
      error: 'Error deleting aerador', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
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
// Função para criar tabelas do banco de dados
const createTables = async () => {
  try {
    console.log('🔧 Verificando/criando tabelas do banco de dados...');
    
    // Criar tabela de coletas de ração
    await pool.query(`
      CREATE TABLE IF NOT EXISTS coletas_racao (
        id SERIAL PRIMARY KEY,
        viveiro_id INTEGER NOT NULL REFERENCES viveiros(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        qnt_manha DECIMAL(10,2) DEFAULT 0,
        qnt_tarde DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(viveiro_id, data)
      )
    `);

    // Criar tabela de medições de qualidade da água
    await pool.query(`
      CREATE TABLE IF NOT EXISTS medicoes_agua (
        id SERIAL PRIMARY KEY,
        viveiro_id INTEGER NOT NULL REFERENCES viveiros(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        oxigenio DECIMAL(5,2) NOT NULL,
        ph DECIMAL(4,2) NOT NULL,
        temperatura DECIMAL(5,2) NOT NULL,
        alcalinidade DECIMAL(6,2) NOT NULL,
        transparencia DECIMAL(6,2) NOT NULL,
        salinidade DECIMAL(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Criar tabela de registros de mortalidade
    await pool.query(`
      CREATE TABLE IF NOT EXISTS registros_mortalidade (
        id SERIAL PRIMARY KEY,
        viveiro_id INTEGER NOT NULL REFERENCES viveiros(id) ON DELETE CASCADE,
        data DATE NOT NULL,
        quantidade INTEGER NOT NULL,
        causa VARCHAR(200) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Criar tabela de aeradores
    await pool.query(`
      CREATE TABLE IF NOT EXISTS aeradores (
        id SERIAL PRIMARY KEY,
        viveiro_id INTEGER NOT NULL REFERENCES viveiros(id) ON DELETE CASCADE,
        nome VARCHAR(100) NOT NULL,
        status BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Criar índices para performance
    await pool.query('CREATE INDEX IF NOT EXISTS idx_coletas_racao_viveiro_data ON coletas_racao(viveiro_id, data)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_medicoes_agua_viveiro_data ON medicoes_agua(viveiro_id, data)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_mortalidade_viveiro_data ON registros_mortalidade(viveiro_id, data)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_aeradores_viveiro ON aeradores(viveiro_id)');

    console.log('✅ Tabelas criadas/verificadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    throw error;
  }
};

const startServer = async () => {
  try {
    // Testar conexão com PostgreSQL
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    
    // Criar tabelas automaticamente
    await createTables();
    
    console.log('🚀 Iniciando backend EcoMarão (Node.js)...');
    console.log('📊 Banco: PostgreSQL conectado');
    console.log('🌐 Servidor: http://localhost:' + PORT);
    console.log('📖 Documentação: http://localhost:' + PORT + '/docs');
    console.log('⚠️  Pressione CTRL+C para parar');
    console.log('');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('✅ Servidor rodando publicamente na porta ' + PORT);
      console.log('🌐 Local: http://localhost:' + PORT);
      console.log('🌐 Rede: http://192.168.18.21:' + PORT);
    });

  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error.message);
    console.error('💡 Verifique se o PostgreSQL está rodando e se as credenciais estão corretas');
    process.exit(1);
  }
};

// Iniciar
startServer();
