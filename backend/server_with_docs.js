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
  nome: Joi.string().min(1).max(100).required(), // Mínimo 1 caractere (aceita qualquer tamanho)
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

// Deletar Viveiro
app.delete('/api/viveiros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se viveiro existe
    const viveiroExists = await pool.query('SELECT id FROM viveiros WHERE id = $1', [id]);
    if (viveiroExists.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Viveiro não encontrado' 
      });
    }
    
    // Deletar registros relacionados (verificando se tabelas existem)
    try {
      await pool.query('DELETE FROM coletas_racao WHERE viveiro_id = $1', [id]);
    } catch (e) {
      console.log('Tabela coletas_racao não existe, ignorando...');
    }
    
    try {
      await pool.query('DELETE FROM medicoes WHERE viveiro_id = $1', [id]);
    } catch (e) {
      console.log('Tabela medicoes não existe, ignorando...');
    }
    
    try {
      await pool.query('DELETE FROM registros_mortalidade WHERE viveiro_id = $1', [id]);
    } catch (e) {
      console.log('Tabela registros_mortalidade não existe, ignorando...');
    }
    
    // Deletar viveiro
    await pool.query('DELETE FROM viveiros WHERE id = $1', [id]);
    
    res.status(200).json({
      message: 'Viveiro deletado com sucesso',
      id: parseInt(id)
    });
    
  } catch (error) {
    console.error('Delete viveiro error:', error);
    res.status(500).json({ 
      error: 'Error deleting viveiro', 
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
    res.status(500).json({ 
      error: 'Erro ao buscar viveiro',
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Endpoint para deletar coleta de ração específica
app.delete('/api/viveiros/:id/racao/:racaoId', async (req, res) => {
  try {
    const { id, racaoId } = req.params;
    
    // Verificar se viveiro existe
    const viveiroResult = await pool.query(
      'SELECT id FROM viveiros WHERE id = $1',
      [id]
    );
    
    if (viveiroResult.rows.length === 0) {
      return res.status(404).json({ error: 'Viveiro não encontrado' });
    }
    
    // Verificar se o registro de ração existe
    const racaoRecord = await pool.query(
      'SELECT id FROM coletas_racao WHERE viveiro_id = $1 AND id = $2',
      [id, racaoId]
    );
    
    if (racaoRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de ração não encontrado' });
    }
    
    // Deletar o registro de ração
    await pool.query(
      'DELETE FROM coletas_racao WHERE viveiro_id = $1 AND id = $2',
      [id, racaoId]
    );
    
    res.status(200).json({
      message: 'Coleta de ração deletada com sucesso',
      id: parseInt(racaoId)
    });
    
  } catch (error) {
    console.error('Erro ao deletar coleta de ração:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar coleta de ração', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
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

// Helper: calcular biomassa (kg)
function calcularBiomassa(densidadePorM2, area, mortalidadeTotal, pesoMedioG) {
  const populacaoInicial = densidadePorM2 * area;
  const vivos = populacaoInicial - mortalidadeTotal;
  return Math.max(0, (vivos * pesoMedioG) / 1000);
}

// Helper: calcular FCR
function calcularFCR(racaoTotalKg, biomassaKg) {
  if (biomassaKg <= 0) return 0;
  return racaoTotalKg / biomassaKg;
}

// Funções auxiliares para cálculo de ração (mesmas do frontend)

// Tabela de ração com faixas por DOC
const TABELA_RACAO = [
  { docMin: 1, docMax: 15, fase: 'Berçário I', pesoMedioMin: 0.015, pesoMedioMax: 2, taxaAlimentacao: 12, tipoRacao: 'PL/F1', proteina: 45 },
  { docMin: 16, docMax: 30, fase: 'Berçário II', pesoMedioMin: 2, pesoMedioMax: 5, taxaAlimentacao: 10, tipoRacao: 'F1', proteina: 40 },
  { docMin: 31, docMax: 45, fase: 'Engorda I', pesoMedioMin: 5, pesoMedioMax: 10, taxaAlimentacao: 8, tipoRacao: 'F2', proteina: 35 },
  { docMin: 46, docMax: 60, fase: 'Engorda I', pesoMedioMin: 10, pesoMedioMax: 15, taxaAlimentacao: 7, tipoRacao: 'F2', proteina: 35 },
  { docMin: 61, docMax: 75, fase: 'Engorda II', pesoMedioMin: 15, pesoMedioMax: 20, taxaAlimentacao: 6, tipoRacao: 'F3', proteina: 32 },
  { docMin: 76, docMax: 90, fase: 'Engorda II', pesoMedioMin: 20, pesoMedioMax: 25, taxaAlimentacao: 5, tipoRacao: 'F3', proteina: 32 },
  { docMin: 91, docMax: 105, fase: 'Engorda III', pesoMedioMin: 25, pesoMedioMax: 30, taxaAlimentacao: 4, tipoRacao: 'F4', proteina: 30 },
  { docMin: 106, docMax: 120, fase: 'Engorda III', pesoMedioMin: 30, pesoMedioMax: 35, taxaAlimentacao: 3.5, tipoRacao: 'F4', proteina: 30 }
];

function getFaixaRacao(doc) {
  return TABELA_RACAO.find(faixa => doc >= faixa.docMin && doc <= faixa.docMax) || null;
}

// Dados de PL por tamanho
const PL_DATA = {
  'PL5': { pl: 'PL5', pesoMedioMg: 0.005, fonte: 'Laboratório' },
  'PL8': { pl: 'PL8', pesoMedioMg: 0.008, fonte: 'Laboratório' },
  'PL10': { pl: 'PL10', pesoMedioMg: 0.010, fonte: 'Laboratório' },
  'PL12': { pl: 'PL12', pesoMedioMg: 0.012, fonte: 'Laboratório' },
  'PL15': { pl: 'PL15', pesoMedioMg: 0.015, fonte: 'Laboratório' }
};

function getPLData(pl) {
  return PL_DATA[pl] || null;
}

// Prever peso atual baseado no DOC (curva de crescimento padrão)
function preverPesoAtual(doc) {
  if (doc <= 0) return 0.015; // PL padrão
  
  // Curva de crescimento não-linear baseada em dados acadêmicos
  if (doc <= 30) {
    // Berçário: crescimento mais lento inicial
    return 0.015 + (doc * 0.35); // ~0.35g/dia
  } else if (doc <= 60) {
    // Engorda I: crescimento acelerado
    return 10.5 + ((doc - 30) * 0.5); // ~0.5g/dia
  } else if (doc <= 90) {
    // Engorda II: crescimento moderado
    return 25.5 + ((doc - 60) * 0.35); // ~0.35g/dia
  } else {
    // Engorda III: crescimento desacelerando
    return 36 + ((doc - 90) * 0.2); // ~0.2g/dia
  }
}

// Prever peso atual usando dados de PL
function preverPesoAtualComPL(doc, plInicial) {
  const plData = getPLData(plInicial);
  if (!plData) return preverPesoAtual(doc);
  
  const pesoInicialG = plData.pesoMedioMg;
  
  // Ajustar curva de crescimento baseado no peso inicial
  if (doc <= 30) {
    return pesoInicialG + (doc * 0.35);
  } else if (doc <= 60) {
    const pesoDia30 = pesoInicialG + (30 * 0.35);
    return pesoDia30 + ((doc - 30) * 0.5);
  } else if (doc <= 90) {
    const pesoDia30 = pesoInicialG + (30 * 0.35);
    const pesoDia60 = pesoDia30 + (30 * 0.5);
    return pesoDia60 + ((doc - 60) * 0.35);
  } else {
    const pesoDia30 = pesoInicialG + (30 * 0.35);
    const pesoDia60 = pesoDia30 + (30 * 0.5);
    const pesoDia90 = pesoDia60 + (30 * 0.35);
    return pesoDia90 + ((doc - 90) * 0.2);
  }
}

// Estimar população atual considerando mortalidade
function estimarPopulacaoAtual(densidadeMilLarvas, doc, registrosMortalidade) {
  // População inicial
  const populacaoInicial = densidadeMilLarvas * 1000;
  
  // Calcular mortalidade total
  const mortalidadeTotal = registrosMortalidade.reduce((acc, m) => acc + m.quantidade, 0);
  
  // População estimada atual
  const populacaoAtual = populacaoInicial - mortalidadeTotal;
  
  return Math.max(0, populacaoAtual);
}

// Helper: calcular ração diária avançada (mesma fórmula do frontend)
function calcularRacaoDiariaAvancada(densidadeMilLarvas, doc, registrosMortalidade, pesoRegistradoG, plInicial, densidadeApiRacao) {
  console.log('calcularRacaoDiariaAvancada - Entrada:', {
    densidadeMilLarvas,
    doc,
    registrosMortalidade: registrosMortalidade.length,
    pesoRegistradoG,
    plInicial,
    densidadeApiRacao
  });

  // Validate inputs
  if (!densidadeMilLarvas || densidadeMilLarvas <= 0) {
    console.warn('calcularRacaoDiariaAvancada - Densidade inválida:', densidadeMilLarvas);
    return { 
      totalKg: 0, 
      manhaKg: 0, 
      tardeKg: 0, 
      pesoEstimadoG: 0,
      populacaoEstimada: 0,
      biomassaEstimadaKg: 0,
      faixa: null 
    };
  }

  const faixa = getFaixaRacao(doc);
  console.log('calcularRacaoDiariaAvancada - Faixa encontrada:', faixa);
  
  if (!faixa) { 
    console.log('calcularRacaoDiariaAvancada - Sem faixa para DOC:', doc);
    return { 
      totalKg: 0, 
      manhaKg: 0, 
      tardeKg: 0, 
      pesoEstimadoG: 0,
      populacaoEstimada: 0,
      biomassaEstimadaKg: 0,
      faixa: null 
    };
  }
  
  // Get PL data if available
  const plData = plInicial ? getPLData(plInicial) : undefined;
  
  // Predict current weight - use PL data if available, then registered weight, then fallback
  let pesoEstimadoG;
  if (pesoRegistradoG && pesoRegistradoG > 0) {
    pesoEstimadoG = pesoRegistradoG;
  } else if (plData) {
    pesoEstimadoG = preverPesoAtualComPL(doc, plInicial);
  } else {
    pesoEstimadoG = preverPesoAtual(doc);
  }
  
  console.log('calcularRacaoDiariaAvancada - Peso estimado:', pesoEstimadoG, 'PL:', plData?.pl);
  
  // Estimate current population - usar densidade da API de ração se disponível
  let populacaoEstimada;
  if (densidadeApiRacao && densidadeApiRacao > 0) {
    // Usar densidade da API de ração diretamente (já é o número total de camarões)
    populacaoEstimada = densidadeApiRacao * 1000;
    console.log('calcularRacaoDiariaAvancada - População estimada:', populacaoEstimada, '(usando densidade da API ração)');
  } 
  
  // Validate population
  if (populacaoEstimada <= 0) {
    console.warn('calcularRacaoDiariaAvancada - População estimada inválida:', populacaoEstimada);
    return { 
      totalKg: 0, 
      manhaKg: 0, 
      tardeKg: 0, 
      pesoEstimadoG,
      populacaoEstimada: 0,
      biomassaEstimadaKg: 0,
      faixa,
      plData
    };
  }
  
  // Calculate estimated biomass
  const biomassaEstimadaKg = (populacaoEstimada * pesoEstimadoG) / 1000;
  console.log('calcularRacaoDiariaAvancada - Biomassa calculada:', biomassaEstimadaKg);
  
  // Validate biomass
  if (biomassaEstimadaKg <= 0) {
    console.warn('calcularRacaoDiariaAvancada - Biomassa estimada inválida:', biomassaEstimadaKg);
    return { 
      totalKg: 0, 
      manhaKg: 0, 
      tardeKg: 0, 
      pesoEstimadoG,
      populacaoEstimada,
      biomassaEstimadaKg: 0,
      faixa,
      plData
    };
  }
  
  // Calculate feed based on estimated biomass
  const totalKg = (biomassaEstimadaKg * faixa.taxaAlimentacao) / 100;
  const manhaKg = totalKg * 0.4;
  const tardeKg = totalKg * 0.6;
  
  console.log('calcularRacaoDiariaAvancada - Resultado:', {
    totalKg,
    manhaKg,
    tardeKg,
    taxaAlimentacao: faixa.taxaAlimentacao
  });

  return { 
    totalKg: Math.round(totalKg * 100) / 100, 
    manhaKg: Math.round(manhaKg * 100) / 100, 
    tardeKg: Math.round(tardeKg * 100) / 100,
    pesoEstimadoG,
    populacaoEstimada,
    biomassaEstimadaKg: Math.round(biomassaEstimadaKg * 100) / 100,
    faixa,
    plData: plData ?? undefined
  };
}

// Endpoint para dashboard geral da fazenda
app.get('/api/fazenda/dashboard', async (req, res) => {
  try {
    // Buscar todos os viveiros
    const viveirosResult = await pool.query('SELECT * FROM viveiros ORDER BY nome');
    
    // Buscar dados de todos os viveiros em paralelo
    const dashboardData = await Promise.all(
      viveirosResult.rows.map(async (viveiro) => {
        // Criar tabelas se não existirem
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
        
        await pool.query(`
          CREATE TABLE IF NOT EXISTS registros_mortalidade (
            id SERIAL PRIMARY KEY,
            viveiro_id INTEGER REFERENCES viveiros(id),
            data DATE NOT NULL,
            quantidade INTEGER NOT NULL,
            causa TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Buscar dados de ração
        const racaoResult = await pool.query(
          'SELECT id, data, qnt_manha as "qntManha", qnt_tarde as "qntTarde" FROM coletas_racao WHERE viveiro_id = $1 ORDER BY data DESC',
          [viveiro.id]
        );
        
        // Buscar dados de mortalidade
        const mortalidadeResult = await pool.query(
          'SELECT id, data, quantidade, causa FROM registros_mortalidade WHERE viveiro_id = $1 ORDER BY data DESC',
          [viveiro.id]
        );
        
        // Calcular métricas
        const doc = calcularDOC(viveiro.data_inicio_ciclo);
        const densidade = parseFloat(viveiro.densidade) || 0;
        const area = parseFloat(viveiro.area) || 0;
        const pesoMedio = 0.015; // 15g estimado
        
        console.log('Dashboard - Dados do Viveiro:', {
          id: viveiro.id,
          nome: viveiro.nome,
          densidade: densidade,
          area: area,
          doc: doc,
          dataInicio: viveiro.data_inicio_ciclo
        });
        
        const mortTotal = mortalidadeResult.rows.reduce((acc, m) => acc + m.quantidade, 0);
        const racaoAcumulada = racaoResult.rows.reduce((acc, r) => acc + (parseFloat(r.qntManha) || 0) + (parseFloat(r.qntTarde) || 0), 0);
        const biomassa = calcularBiomassa(densidade, area, mortTotal, pesoMedio);
        const fcr = calcularFCR(racaoAcumulada, biomassa);
        
        // Verificar alimentação hoje
        const hoje = new Date().toISOString().split('T')[0];
        const registroHoje = racaoResult.rows.find(r => r.data === hoje);
        
        // Calcular totais do dia
        const racaoHojeManha = registroHoje ? (parseFloat(registroHoje.qntManha) || 0) : 0;
        const racaoHojeTarde = registroHoje ? (parseFloat(registroHoje.qntTarde) || 0) : 0;
        const racaoHojeTotal = racaoHojeManha + racaoHojeTarde;
        
        // Calcular recomendação
        const densidadeMilLarvas = (densidade * area) / 1000; // converter para milhar de larvas
        console.log('Dashboard - Cálculo de densidade:', {
          densidadePorM2: densidade,
          area: area,
          densidadeMilLarvas,
          explicacao: `${densidade} larvas/m² × ${area} m² ÷ 1000 = ${densidadeMilLarvas} milhar larvas`
        });
        
        // Buscar dados da API de ração para obter densidade
        let densidadeApiRacao = 0;
        try {
          const racaoApi = await pool.query(
            'SELECT densidade FROM viveiros WHERE id = $1',
            [viveiro.id]
          );
          if (racaoApi.rows.length > 0) {
            densidadeApiRacao = parseFloat(racaoApi.rows[0].densidade) || 0;
          }
        } catch (error) {
          console.warn('Erro ao buscar densidade da API de ração:', error);
        }
        
        const calculoAvancado = calcularRacaoDiariaAvancada(
          densidadeMilLarvas,
          doc,
          mortalidadeResult.rows,
          undefined, // pesoMedio não disponível no backend ainda
          undefined,  // plInicial não disponível no backend ainda
          densidadeApiRacao // densidade da API de ração
        );
        
        return {
          viveiro: {
            id: viveiro.id,
            nome: viveiro.nome,
            densidade: densidade,
            area: viveiro.area,
            data_inicio_ciclo: viveiro.data_inicio_ciclo,
            status: viveiro.status
          },
          doc,
          racaoHojeTotal: racaoHojeTotal,
          racaoHojeManha: racaoHojeManha,
          racaoHojeTarde: racaoHojeTarde,
          recomendadoTotal: calculoAvancado.totalKg,
          recomendadoManha: calculoAvancado.manhaKg,
          recomendadoTarde: calculoAvancado.tardeKg,
          fase: calculoAvancado.faixa?.fase || 'N/A',
          fcrAtual: fcr,
          racaoAcumulada,
          biomassa,
          alimentouManha: racaoHojeManha > 0,
          alimentouTarde: racaoHojeTarde > 0,
          pesoEstimadoG: calculoAvancado.pesoEstimadoG,
          populacaoEstimada: calculoAvancado.populacaoEstimada,
          biomassaEstimadaKg: calculoAvancado.biomassaEstimadaKg,
          usandoPesoReal: false,
          // Campos da nova calculadora
          usandoNovaCalculadora: true,
          faixaPeso: `${calculoAvancado.faixa?.docMin || 0}-${calculoAvancado.faixa?.docMax || 0} dias`,
          faseCultivo: calculoAvancado.faixa?.fase || 'Não determinada',
          taxaAlimentacaoDecimal: (calculoAvancado.faixa?.taxaAlimentacao || 0) / 100,
          // Adicionar dados detalhados de ração
          racoes: racaoResult.rows.map(r => ({
            id: r.id,
            data: r.data,
            qntManha: parseFloat(r.qntManha) || 0,
            qntTarde: parseFloat(r.qntTarde) || 0,
            total: (parseFloat(r.qntManha) || 0) + (parseFloat(r.qntTarde) || 0)
          }))
        };
      })
    );
    
    // Calcular totais da fazenda
    const totais = {
      totalViveiros: viveirosResult.rows.length,
      totalRacaoHoje: dashboardData.reduce((acc, v) => acc + v.racaoHojeTotal, 0),
      totalRecomendado: dashboardData.reduce((acc, v) => acc + v.recomendadoTotal, 0),
      totalBiomassa: dashboardData.reduce((acc, v) => acc + v.biomassa, 0),
      totalRacaoAcumulada: dashboardData.reduce((acc, v) => acc + v.racaoAcumulada, 0),
      fcrMedio: dashboardData.reduce((acc, v) => acc + v.fcrAtual, 0) / dashboardData.length || 0,
      viveirosAlimentados: dashboardData.filter(v => v.alimentouManha && v.alimentouTarde).length,
      viveirosParciais: dashboardData.filter(v => v.alimentouManha || v.alimentouTarde).length - dashboardData.filter(v => v.alimentouManha && v.alimentouTarde).length,
      viveirosPendentes: dashboardData.filter(v => !v.alimentouManha && !v.alimentouTarde).length
    };
    
    res.json({
      viveiros: dashboardData,
      totais,
      atualizado: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao buscar dashboard da fazenda:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dashboard da fazenda',
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

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
    const densidade = parseFloat(viveiroResult.rows[0].densidade) || 0;
    
    res.json({
      racoes: racaoData,
      peso_medio: pesoMedioEstimado,
      dias_cultivo: diasCultivo,
      densidade: densidade
    });
  } catch (error) {
    console.error('Erro ao buscar dados de ração:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar dados de ração',
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
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
    
    // Criar tabela se não existir (sem constraint UNIQUE para evitar erros)
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
    
    // Verificar se já existe registro para este viveiro e data
    const existingRecord = await pool.query(
      'SELECT id FROM coletas_racao WHERE viveiro_id = $1 AND data = $2',
      [id, data]
    );
    
    let record;
    
    if (existingRecord.rows.length > 0) {
      // Atualizar registro existente
      const updateResult = await pool.query(
        'UPDATE coletas_racao SET qnt_manha = $1, qnt_tarde = $2, created_at = CURRENT_TIMESTAMP WHERE viveiro_id = $3 AND data = $4 RETURNING id, data, qnt_manha as "qntManha", qnt_tarde as "qntTarde"',
        [qnt_manha, qnt_tarde, id, data]
      );
      record = updateResult.rows[0];
    } else {
      // Inserir novo registro
      const insertResult = await pool.query(
        'INSERT INTO coletas_racao (viveiro_id, data, qnt_manha, qnt_tarde) VALUES ($1, $2, $3, $4) RETURNING id, data, qnt_manha as "qntManha", qnt_tarde as "qntTarde"',
        [id, data, qnt_manha, qnt_tarde]
      );
      record = insertResult.rows[0];
    }
    
    // Converter para garantir que valores numéricos sejam numbers
    const formattedRecord = {
      ...record,
      qntManha: parseFloat(record.qntManha) || 0,
      qntTarde: parseFloat(record.qntTarde) || 0,
      data: new Date(record.data).toISOString().split('T')[0] // Formatar data como YYYY-MM-DD
    };
    
    // Criar colunas se não existirem
    await pool.query(`
      ALTER TABLE viveiros 
      ADD COLUMN IF NOT EXISTS quantidade_racao DECIMAL(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS data_ultima_alimentacao DATE
    `);
    
    // Atualizar quantidade de ração no viveiro
    const totalRacao = qnt_manha + qnt_tarde;
    await pool.query(
      'UPDATE viveiros SET quantidade_racao = $1, data_ultima_alimentacao = $2 WHERE id = $3',
      [totalRacao, data, id]
    );
    
    // Retornar o registro atualizado/criado
    res.status(200).json(formattedRecord);
  } catch (error) {
    console.error('Erro ao criar coleta de ração:', error);
    res.status(500).json({ 
      error: 'Erro ao criar coleta de ração', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
  }
});

// Endpoint para atualizar coleta de ração
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

    const { data, qnt_manha, qnt_tarde } = req.body;

    // Validar dados básicos
    if (!data || qnt_manha === undefined || qnt_tarde === undefined) {
      return res.status(400).json({ 
        error: 'Dados inválidos', 
        details: 'Campos data, qnt_manha e qnt_tarde são obrigatórios',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }

    // Verificar se viveiro existe
    const viveiroResult = await pool.query(
      'SELECT id FROM viveiros WHERE id = $1',
      [viveiroId]
    );
    
    if (viveiroResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Viveiro não encontrado',
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

    // Atualizar
    const result = await pool.query(
      `UPDATE coletas_racao 
       SET data = $1, qnt_manha = $2, qnt_tarde = $3
       WHERE id = $4 AND viveiro_id = $5
       RETURNING id, viveiro_id, data, qnt_manha, qnt_tarde, created_at`,
      [data, qnt_manha, qnt_tarde, id, viveiroId]
    );

    const row = result.rows[0];
    
    // Formatar resposta
    const formattedRecord = {
      id: row.id,
      viveiro_id: row.viveiro_id,
      data: new Date(row.data).toISOString().split('T')[0],
      qntManha: parseFloat(row.qnt_manha) || 0,
      qntTarde: parseFloat(row.qnt_tarde) || 0,
      created_at: row.created_at
    };

    res.json(formattedRecord);
    
  } catch (error) {
    console.error('Erro ao atualizar coleta de ração:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar coleta de ração', 
      details: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
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
