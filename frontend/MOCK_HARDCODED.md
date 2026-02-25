# 🦐 Mock Hardcoded - Viveiro 60 Dias

## 🎯 Objetivo
Mock hardcoded diretamente no código para facilitar testes e desenvolvimento do sistema ecamarão com dados realistas.

## 📁 Arquivos Criados

### 1. `src/mocks/mockViveiro60Dias.ts`
- **Dados completos** do viveiro com 60 dias
- **Funções** para carregar/limpar dados
- **Exportações** TypeScript para uso seguro

### 2. `src/components/MockLoader.tsx`
- **Componente React** para interface visual
- **Botões** para carregar/limpar mock
- **Status** visual do mock carregado

### 3. Integração na Home
- **MockLoader** adicionado à página Home
- **Acesso rápido** diretamente na interface

## 🚀 Como Usar

### Método 1: Interface Visual (Recomendado)
1. **Inicie o aplicativo:** `npm run dev`
2. **Abra a página Home:** O MockLoader aparece no canto superior direito
3. **Clique em "🚀 Carregar Mock"**
4. **Aguarde o recarregamento automático**
5. **Navegue** pelo sistema com os dados carregados

### Método 2: Console do Navegador
```javascript
// No console do navegador (F12)
import('./src/mocks/mockViveiro60Dias.js').then(module => {
  module.carregarMockViveiro60Dias();
  location.reload();
});
```

### Método 3: Direto no Código
```typescript
// Importar em qualquer componente
import { carregarMockViveiro60Dias } from '../mocks/mockViveiro60Dias';

// Usar onde precisar
const handleLoadMock = () => {
  carregarMockViveiro60Dias();
  // recarregar página ou atualizar estado
};
```

## 📊 Dados do Mock

### Viveiro
```typescript
{
  id: 1,
  densidade: 60,           // 60 larvas/m² = 60.000 camarões
  laboratorio: 'AquaTec',
  proprietario: 'João Silva',
  dataInicioCiclo: '2024-12-01',
  pesoMedioAtual: 8.5,     // peso medido recentemente
  precoRacaoKg: 3.50,
  plInicial: 'PL10-PL12'    // pós-larva comum (3mg)
}
```

### Mortalidade (4 registros)
```typescript
[
  { id: 1, data: '2024-12-15', quantidade: 500, causa: 'Doença (WSSV)' },
  { id: 2, data: '2024-12-28', quantidade: 300, causa: 'Predação' },
  { id: 3, data: '2025-01-10', quantidade: 200, causa: 'Estresse térmico' },
  { id: 4, data: '2025-01-20', quantidade: 150, causa: 'Baixa oxigenação' }
]
// Total: 1.150 camarões (1.92% de mortalidade)
```

### Ração (30 registros - janeiro)
```typescript
[
  { id: 1, data: '2025-01-01', qntManha: 2.5, qntTarde: 3.8 },
  // ... 30 dias de registros progressivos
  { id: 30, data: '2025-01-30', qntManha: 5.4, qntTarde: 6.7 }
]
// Total acumulado: 218.4kg
```

### Medições (5 registros)
```typescript
[
  { id: 1, data: '2025-01-01', oxigenio: 6.5, ph: 7.8, temperatura: 28, ... },
  // ... medições semanais
]
```

### Aeradores (4 equipamentos)
```typescript
[
  { id: 1, nome: 'Aerador - 1', status: true },
  { id: 2, nome: 'Aerador - 2', status: true },
  { id: 3, nome: 'Aerador - 3', status: false },
  { id: 4, nome: 'Aerador - 4', status: true }
]
```

## 📈 Métricas Calculadas

### Indicadores de Desempenho
- **DOC:** 60 dias (Crescimento II)
- **População:** 58.850 camarões (98.08% sobrevivência)
- **Biomassa:** 500.23kg
- **Peso médio:** 8.5g
- **FCR:** 0.44 (Excelente)
- **Ração diária:** 25.01kg (10kg manhã + 15.01kg tarde)
- **Gasto total:** R$764.40

### Cálculos Esperados
```typescript
{
  doc: 60,
  fase: 'Crescimento II',
  mortalidadeTotal: 1150,
  populacaoEstimada: 58850,
  pesoEstimado: 8.5,
  biomassaEstimada: 500.23,
  taxaAlimentacao: 5,        // 5% para fase Crescimento II
  racaoDiaria: 25.01,
  racaoManha: 10.00,       // 40% do total
  racaoTarde: 15.01,       // 60% do total
  racaoAcumulada: 218.4,
  fcr: 0.44,
  sobrevivencia: 98.08,
  gastoTotal: 764.40
}
```

## 🔍 Cenários de Teste

### 1. Teste de Recomendação de Ração
- **Entrada:** DOC 60, PL10-PL12, densidade 60
- **Processamento:** Usa `preverPesoAtualComPL()` + `calcularRacaoDiariaAvancada()`
- **Saída:** 25.01kg/dia (baseado em biomassa real)
- **Verificação:** Taxa 5% adequada para fase Crescimento II

### 2. Teste de Interface
- **Página Home:** Deve mostrar viveiro com status "Crescimento II"
- **Página Ração:** Recomendações precisas com informações do PL
- **Página Fazenda:** Resumo geral com dados corretos
- **Dashboard:** KPIs calculados corretamente

### 3. Teste de Cálculos
- **Peso:** 8.5g (baseado PL + crescimento)
- **População:** 58.850 (considerando mortalidade real)
- **Biomassa:** 500.23kg (população × peso)
- **FCR:** 0.44 (excelente, < 1.5)

## 🛠️ Funções Disponíveis

### `carregarMockViveiro60Dias()`
```typescript
// Carrega todos os dados no localStorage
carregarMockViveiro60Dias();
```

### `limparTodosDados()`
```typescript
// Limpa completamente o localStorage
limparTodosDados();
```

### `verificarMockCarregado()`
```typescript
// Verifica se o mock já está carregado
const isLoaded = verificarMockCarregado();
```

### `mockCompleto`
```typescript
// Objeto completo com todos os dados
import { mockCompleto } from '../mocks/mockViveiro60Dias';
console.log(mockCompleto.calculosEsperados);
```

## 🎨 Interface do MockLoader

### Visual
- **Posição:** Fixo no canto superior direito
- **Status:** Indicador visual de carregado/não carregado
- **Dados resumidos:** Informações principais do mock
- **Botões:** Carregar Mock e Limpar Dados

### Comportamento
- **Carregar:** Salva dados + recarrega página automaticamente
- **Limpar:** Confirmação + limpeza + recarregamento
- **Status:** Atualizado automaticamente ao montar

## 📚 Base Científica

### Fontes Utilizadas
1. **PL10-PL12:** 3mg (FAO Technical Paper 583, 2013)
2. **Crescimento:** Curva baseada em Wu et al. (2020)
3. **Taxas:** Samocha et al. (2017) para diferentes fases
4. **Mortalidade:** Toni et al. (2021) para estimativas

### Validação
- ✅ **Peso PL:** 3mg dentro do esperado (2-4mg)
- ✅ **Crescimento 60 dias:** 8.5g (curva realista)
- ✅ **Taxa 5%:** Adequada para fase Crescimento II
- ✅ **FCR 0.44:** Excelente (ideal < 1.5)
- ✅ **Sobrevivência 98%:** Excelente (> 90%)

## 🚨 Importante

### Ambiente de Desenvolvimento
- **Use apenas** para testes e desenvolvimento
- **Não use** em produção com dados reais
- **Backup** seus dados antes de usar

### Compatibilidade
- **TypeScript:** Totalmente tipado
- **React:** Componentes funcionais
- **LocalStorage:** Persistência automática
- **Hot reload:** Funciona com desenvolvimento

## 🔧 Personalização

### Alterar Valores
Edite `src/mocks/mockViveiro60Dias.ts`:
```typescript
export const mockViveiro: ViveiroDTO = {
  densidade: 80,        // Mudar densidade
  plInicial: 'PL16-PL20', // Mudar PL
  pesoMedioAtual: 12.0,  // Mudar peso
  // ... outros campos
};
```

### Adicionar Mais Dados
```typescript
export const mockRacao: ColetaRacao[] = [
  // ... dados existentes
  { id: 31, data: '2025-01-31', qntManha: 5.5, qntTarde: 6.8 },
  { id: 32, data: '2025-02-01', qntManha: 5.6, qntTarde: 6.9 }
];
```

## 📞 Suporte

### Problemas Comuns
1. **Mock não carrega:** Verifique o console para erros
2. **Dados não aparecem:** Recarregue a página
3. **TypeScript errors:** Verifique as importações
4. **Interface bug:** Limpe o localStorage e recarregue

### Debug
```typescript
// Verifique no console os logs:
console.log('🚀 Carregando mock hardcoded...');
console.log('✅ Viveiro salvo:', mockViveiro);
console.log('📊 Cálculos esperados:', calculosEsperados);
```

---

**Criado em:** 24/01/2025  
**Versão:** 2.0 (Hardcoded)  
**Sistema:** ecamarão v0.2.0  
**Tipo:** Mock de desenvolvimento
