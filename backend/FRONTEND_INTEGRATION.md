# Integração Frontend + Backend Node.js

## 🚀 Tecnologias

### Backend
- **Node.js** + Express + PostgreSQL
- **API REST**: Endpoints para usuários e viveiros
- **Swagger/OpenAPI**: Documentação completa em `/api-docs`

### Frontend
- **React** + TypeScript + Vite
- **Axios** ou **Fetch**: Para requisições HTTP
- **React Router**: Para navegação

## 📋 Endpoints do Backend

### Autenticação
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@ecamarao.com",
  "password": "admin123",
  "role": "admin"
}
```

### Usuários
```http
GET /api/users
Response:
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@ecamarao.com",
    "role": "admin",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### Viveiros
```http
POST /api/viveiros
Content-Type: application/json

{
  "nome": "Viveiro Teste",
  "densidade": 80.0,
  "area": 2000.0,
  "data_inicio_ciclo": "2024-01-15",
  "status": "ativo"
}
```

```http
GET /api/viveiros
Response:
[
  {
    "id": 2,
    "nome": "Viveiro Teste",
    "densidade": 80.0,
    "area": 2000.0,
    "data_inicio_ciclo": "2024-01-15",
    "status": "ativo",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### Estatísticas
```http
GET /api/stats
Response:
{
  "users": 1,
  "viveiros": 2,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔧 Integração React + Backend

### 1. Configurar Axios no Frontend

```bash
# No diretório do frontend
npm install axios
```

### 2. Criar Serviço de API

```javascript
// src/services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // Registrar usuário
  registerUser: async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/users/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw error;
    }
  },

  // Listar usuários
  getUsers: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }
  },

  // Criar viveiro
  createViveiro: async (viveiroData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/viveiros`, viveiroData);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar viveiro:', error);
      throw error;
    }
  },

  // Listar viveiros
  getViveiros: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/viveiros`);
      return response.data;
    } catch (error) {
      console.error('Erro ao listar viveiros:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Erro no health check:', error);
      throw error;
    }
  }
};
```

### 3. Exemplo de Componente React

```jsx
// src/components/UserForm.jsx
import React, { useState } from 'react';
import { api } from '../services/api';

const UserForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.registerUser(formData);
      alert('Usuário criado com sucesso!');
      setFormData({ username: '', email: '', password: '', role: 'user' });
    } catch (error) {
      alert('Erro ao criar usuário: ' + error.message);
    }
  };

  return (
    <div>
      <h2>Registrar Usuário</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        <select
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          <option value="user">Usuário</option>
          <option value="operador">Operador</option>
          <option value="tecnico">Técnico</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
};

export default UserForm;
```

### 4. Exemplo de Lista de Usuários

```jsx
// src/components/UserList.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userData = await api.getUsers();
        setUsers(userData);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h2>Lista de Usuários</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.username} - {user.email} - {user.role}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
```

## 🎯 Próximos Passos

### 1. Configurar Frontend
```bash
# No diretório do frontend
cd ../frontend

# Instalar dependências
npm install axios

# Iniciar frontend
npm run dev
```

### 2. Testar Integração
- Acesse o formulário de registro
- Crie um novo usuário
- Verifique se aparece na lista
- Teste criação de viveiros

### 3. Documentação
- Swagger UI: http://localhost:8000/api-docs
- OpenAPI JSON: http://localhost:8000/api-docs.json

## 🎉 Vantagens

✅ **Backend Node.js**: Rápido, robusto, sem encoding  
✅ **Frontend React**: Moderno, TypeScript, componentes reutilizáveis  
✅ **API REST**: Padrão da indústria  
✅ **Documentação**: Swagger/OpenAPI completa  
✅ **Integração**: Axios para requisições HTTP  
✅ **Escalável**: Fácil de expandir e manter  

## 🚀 Sistema EcoMarão Completo!

**Backend Node.js + PostgreSQL + Frontend React** está pronto para produção! 🎉
