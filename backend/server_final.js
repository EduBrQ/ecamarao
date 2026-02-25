/**
 * Backend EcoMarão - Node.js + Express + PostgreSQL + Swagger
 * Versão final corrigida e funcional
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

// Configuração do Swagger/OpenAPI
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EcoMarão - Backend API',
      version: '1.0.0',
      description: 'Backend simples para gestão de viveiros de camarão',
      contact: {
        name: 'EcoMarão Team',
        email: 'contato@ecamarao.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor de desenvolvimento'
      }
    ],
    components: {
      schemas: {
        UserCreate: userSchema.describe(),
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'admin' },
            email: { type: 'string', example: 'admin@ecamarao.com' },
            role: { type: 'string', example: 'admin' },
            created_at: { type: 'string', example: '2024-01-15T10:30:00Z' }
          }
        },
        ViveiroCreate: viveiroSchema.describe(),
        ViveiroResponse: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nome: { type: 'string', example: 'Viveiro Principal' },
            densidade: { type: 'number', example: 80.0 },
            area: { type: 'number', example: 2000.0 },
            data_inicio_ciclo: { type: 'string', example: '2024-01-15' },
            status: { type: 'string', example: 'ativo' },
            created_at: { type: 'string', example: '2024-01-15T10:30:00Z' }
          }
        }
      }
    }
  },
  apis: [
    {
      description: 'Operações de usuários',
      name: 'users',
      paths: {
        '/api/users/register': {
          post: {
            summary: 'Registrar novo usuário',
            description: 'Cria um novo usuário no sistema',
            tags: ['users'],
            requestBody: {
              description: 'Dados do usuário',
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UserCreate' }
                }
              }
            },
            responses: {
              201: {
                description: 'Usuário criado com sucesso',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/UserResponse' }
                  }
                }
              },
              400: {
                description: 'Dados inválidos ou usuário já existe'
              },
              500: {
                description: 'Erro interno do servidor'
              }
            }
          }
        },
        '/api/users': {
          get: {
            summary: 'Listar todos os usuários',
            description: 'Retorna a lista de todos os usuários cadastrados',
            tags: ['users'],
            responses: {
              200: {
                description: 'Lista de usuários',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/UserResponse' }
                    }
                  }
                }
              },
              500: {
                description: 'Erro interno do servidor'
              }
            }
          }
        }
      },
      {
        description: 'Operações de viveiros',
        name: 'viveiros',
        paths: {
          '/api/viveiros': {
            post: {
              summary: 'Criar novo viveiro',
              description: 'Cria um novo viveiro no sistema',
              tags: ['viveiros'],
              requestBody: {
                description: 'Dados do viveiro',
                required: true,
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/ViveiroCreate' }
                  }
                }
              },
              responses: {
                201: {
                  description: 'Viveiro criado com sucesso',
                  content: {
                    'application/json': {
                      schema: { $ref: '#/components/schemas/ViveiroResponse' }
                  }
                }
              },
              400: {
                description: 'Dados inválidos'
              },
              500: {
                description: 'Erro interno do servidor'
              }
            }
          }
        },
        '/api/viveiros': {
          get: {
            summary: 'Listar todos os viveiros',
            description: 'Retorna a lista de todos os viveiros cadastrados',
            tags: ['viveiros'],
            responses: {
              200: {
                description: 'Lista de viveiros',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/ViveiroResponse' }
                    }
                  }
                }
              },
              500: {
                description: 'Erro interno do servidor'
              }
            }
          }
        }
      },
      {
        description: 'Operações do sistema',
        name: 'system',
        paths: {
          '/health': {
            get: {
              summary: 'Health check do sistema',
              description: 'Verifica se o sistema está funcionando',
              tags: ['system'],
              responses: {
                200: {
                  description: 'Sistema saudável',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          status: { type: 'string', example: 'healthy' },
                          timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' },
                          version: { type: 'string', example: '1.0.0' },
                          database: { type: 'string', example: 'PostgreSQL conectado' }
                        }
                      }
                    }
                  }
                },
                500: {
                  description: 'Erro interno do servidor'
                }
              }
            }
          },
          '/api/stats': {
            get: {
              summary: 'Estatísticas do sistema',
              description: 'Retorna estatísticas gerais do sistema',
              tags: ['system'],
              responses: {
                200: {
                  description: 'Estatísticas do sistema',
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        properties: {
                          users: { type: 'integer', example: 10 },
                          viveiros: { type: 'integer', example: 5 },
                          timestamp: { type: 'string', example: '2024-01-15T10:30:00Z' }
                        }
                      }
                    }
                  }
                },
                500: {
                  description: 'Erro interno do servidor'
                }
              }
            }
          }
        }
      }
    ]
  }
};

// Adicionar Swagger UI em múltiplas rotas
const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve);
app.use('/docs', swaggerUi.serve);
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
    console.log('📖 Alternativa: http://localhost:' + PORT + '/docs');
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
