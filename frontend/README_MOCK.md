# 📋 Mock de Referência - Viveiro com 60 Dias

## 🎯 Objetivo
Este mock serve como referência completa para testar e demonstrar todas as funcionalidades do sistema ecamarão com dados realistas de um viveiro em fase de crescimento.

## 📊 Dados do Viveiro

### Informações Principais
- **ID:** 1
- **Densidade:** 60 larvas/m² (60.000 camarões)
- **PL Inicial:** PL10-PL12 (3mg - pós-larva comum)
- **Dias de Cultivo:** 60 dias
- **Fase Atual:** Crescimento II
- **Peso Médio:** 8.5g
- **Data Início:** 01/12/2024

### Desempenho
- **Sobrevivência:** 98.08% (excelente)
- **FCR:** 0.44 (excelente)
- **Biomassa:** 500.23kg
- **Ração Diária:** 25.01kg
- **Gasto Total:** R$764.40

## 📁 Arquivos Criados

1. **`mock_viveiro_60_dias.js`** - Dados do mock e funções
2. **`carregar_mock.html`** - Interface para carregar o mock
3. **`README_MOCK.md`** - Este arquivo de instruções

## 🚀 Como Usar

### Método 1: Interface Visual (Recomendado)
1. Abra o arquivo `carregar_mock.html` no navegador
2. Clique em "🚀 Carregar Mock no Sistema"
3. Navegue pelo aplicativo para ver os dados

### Método 2: Console do Navegador
1. Abra o aplicativo ecamarão
2. Abra o console do navegador (F12)
3. Cole e execute:
```javascript
// Carregar o script do mock
const script = document.createElement('script');
script.src = './mock_viveiro_60_dias.js';
document.head.appendChild(script);

// Aguardar carregar e executar
setTimeout(() => {
  carregarMockViveiro60Dias();
}, 1000);
```

### Método 3: Direto no localStorage
1. Abra o console do navegador
2. Execute os comandos do arquivo `mock_viveiro_60_dias.js`

## 🔍 O que Testar

### 1. Página Home
- ✅ Viveiro listado com informações corretas
- ✅ Indicadores de desempenho visuais
- ✅ Status do ciclo (Crescimento II)

### 2. Página do Viveiro
- ✅ Dashboard com KPIs
- ✅ Seção de ração com recomendações
- ✅ Histórico completo de medições
- ✅ Controle de aeradores

### 3. Ração Individual
- ✅ Recomendações baseadas em PL10-PL12
- ✅ Cálculos precisos para DOC 60
- ✅ Logs detalhados no console
- ✅ Interface informativa

### 4. Ração da Fazenda
- ✅ Resumo geral com dados reais
- ✅ Recomendações por DOC
- ✅ Informações de PL visíveis
- ✅ Cálculos de biomassa precisos

## 📈 Logs Esperados

### Console Debug
Ao carregar o mock, você verá logs como:
```
calcularRacaoDiariaAvancada - Entrada: {
  densidadeMilLarvas: 60,
  doc: 60,
  registrosMortalidade: 4,
  pesoRegistradoG: 8.5,
  plInicial: "PL10-PL12"
}
```

### Cálculos Detalhados
- **Peso estimado:** 8.5g (baseado PL + crescimento)
- **População:** 58.850 camarões
- **Biomassa:** 500.23kg
- **Ração diária:** 25.01kg (10kg manhã + 15.01kg tarde)

## 🧪 Cenários de Teste

### 1. Cálculo de Ração
- **Entrada:** DOC 60, PL10-PL12, densidade 60
- **Saída:** 25.01kg/dia (5% da biomassa)
- **Verificação:** Taxa correta para fase Crescimento II

### 2. Precisão do Peso
- **Peso PL:** 0.003g
- **Dias crescimento:** 49 dias (60-11)
- **Peso final:** 8.5g (com fator de redução)

### 3. Mortalidade
- **Registrada:** 1.150 camarões
- **Esperada:** 10.800 (18% de 60.000)
- **Usada:** 1.150 (real menor que esperado)

## 📚 Base Científica

### Fontes Utilizadas
1. **FAO (2013)** - Shrimp hatchery and nursery management
2. **Wu et al. (2020)** - Growth performance of Litopenaeus vannamei
3. **Samocha et al. (2017)** - Nursery systems
4. **Toni et al. (2021)** - Post-larva quality

### Valores Validados
- **PL10-PL12:** 3mg (literatura confirma 2-4mg)
- **Crescimento DOC 60:** 8.5g (curva realista)
- **Taxa 5%:** Adequada para fase Crescimento II
- **FCR 0.44:** Excelente (ideal: <1.5)

## 🔧 Personalização

### Alterar Dados
Edite o arquivo `mock_viveiro_60_dias.js`:
```javascript
// Mudar densidade
densidade: 80, // 80 larvas/m²

// Mudar PL
plInicial: 'PL16-PL20', // Jumbo

// Mudar peso
pesoMedioAtual: 12.0, // 12g
```

### Adicionar Mais Dias
Adicione mais registros no array `racao`:
```javascript
{ id: 31, data: '2025-01-31', qntManha: 5.5, qntTarde: 6.8 },
{ id: 32, data: '2025-02-01', qntManha: 5.6, qntTarde: 6.9 }
```

## 🚨 Importante

### Não Use em Produção
- Este mock é apenas para testes e demonstração
- Dados são simulados, não reais
- Use apenas em ambiente de desenvolvimento

### Backup
- Antes de carregar o mock, faça backup dos dados existentes
- Use o botão "Limpar Todos os Dados" com cuidado

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador
2. Confirme se os arquivos estão na pasta correta
3. Limpe o localStorage e recarregue
4. Verifique se o servidor está rodando

---

**Criado em:** 24/01/2025  
**Versão:** 1.0  
**Sistema:** ecamarão v0.2.0
