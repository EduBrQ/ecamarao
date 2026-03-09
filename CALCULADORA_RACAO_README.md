# 🦐 Calculadora de Ração para Litopenaeus vannamei

## 📋 Overview

Sistema completo de cálculo de ração para cultivo de camarão marinho (*Litopenaeus vannamei*) desenvolvido em TypeScript, baseado em melhores práticas de aquicultura e literatura científica.

## 🎯 Objetivo

Substituir os cálculos de ração existentes no sistema EcoMarão por uma abordagem mais precisa e realista, baseada em biomassa e taxas de alimentação específicas por fase de cultivo.

## 📁 Estrutura dos Arquivos

```
frontend/src/models/
├── CalculadoraRacao.ts          # Lógica principal de cálculo
├── CalculadoraRacao.test.ts     # Testes e demonstrações
├── IntegracaoCalculadora.ts     # Adaptador para sistema existente
└── README.md                    # Este arquivo
```

## 🔬 Base Científica

### Tabela de Taxas de Alimentação

| Peso médio (g) | % da biomassa por dia | Fase de Cultivo |
|-----------------|----------------------|-----------------|
| 0.01 – 0.05g   | 20%                  | Pós-larva (PL15-PL25) |
| 0.05 – 0.5g    | 15%                  | Berçário I |
| 0.5 – 2g       | 10%                  | Berçário II |
| 2 – 5g         | 6%                   | Engorda I |
| 5 – 10g        | 4%                   | Engorda II |
| 10 – 20g       | 3%                   | Engorda III |
| 20g+           | 2%                   | Engorda Final / Abate |

### Fórmulas Fundamentais

```
1. Biomassa = quantidadeDeCamaroes × pesoMedioGramas / 1000
2. Ração Diária = biomassa × taxaAlimentacao
3. Distribuição = 50% manhã + 50% tarde
```

## 🚀 Uso Básico

### Exemplo Simples

```typescript
import { calcularRacaoSimples } from './models/CalculadoraRacao';

const resultado = calcularRacaoSimples(100000, 0.03);
console.log(resultado);
// Saída:
// {
//   biomassa: 3,
//   taxaAlimentacao: 0.20,
//   racaoManha: 0.3,
//   racaoTarde: 0.3,
//   racaoTotalDia: 0.6,
//   faseCultivo: 'Pós-larva (PL15-PL25)',
//   faixaPeso: '0.01 – 0.05g'
// }
```

### Uso Avançado

```typescript
import { CalculadoraRacao } from './models/CalculadoraRacao';

const resultado = CalculadoraRacao.calcularRacaoDiaria({
  quantidadeCamaroes: 75000,
  pesoMedioGramas: 8.5
});

// Para múltiplos períodos
const resultado4periodos = CalculadoraRacao.calcularRacaoMultiPeriodos(
  { quantidadeCamaroes: 75000, pesoMedioGramas: 8.5 },
  4
);
```

## 🔧 Integração com Sistema Existente

### Backend (Node.js)

```typescript
import { AdaptadorCalculadoraRacao } from './models/IntegracaoCalculadora';

// Dados do viveiro (vindos do banco)
const viveiro = {
  id: 1,
  nome: 'VIVEIRO 01',
  densidade: 50,
  area: 1000,
  data_inicio_ciclo: '2024-02-01',
  peso_medio: 8.5,
  mortalidade_registrada: 2500
};

// Calcular ração compatível com API atual
const resultado = AdaptadorCalculadoraRacao.calcularRacaoParaSistema(viveiro);

// Resposta para API
res.json({
  recomendadoTotal: resultado.totalKg,
  recomendadoManha: resultado.manhaKg,
  recomendadoTarde: resultado.tardeKg,
  biomassa: resultado.biomassaEstimadaKg,
  fase: resultado.fase,
  taxaAlimentacao: resultado.taxaAlimentacao
});
```

### Frontend (React)

```typescript
// Hook personalizado
const useCalculadoraRacao = (viveiro: ViveiroDados) => {
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const calcular = async () => {
      try {
        setLoading(true);
        const resultadoCalculo = AdaptadorCalculadoraRacao.calcularRacaoParaSistema(viveiro);
        setResultado(resultadoCalculo);
      } catch (err) {
        setError(err.message || 'Erro no cálculo');
      } finally {
        setLoading(false);
      }
    };
    
    calcular();
  }, [viveiro]);
  
  return { resultado, loading, error };
};
```

## 🧪 Testes e Validação

### Executar Testes

```typescript
import { executarDemonstracaoCompleta } from './models/CalculadoraRacao.test';

// Executar todos os testes e demonstrações
executarDemonstracaoCompleta();
```

### Casos de Teste

1. **Validação de Parâmetros**: Verifica entradas inválidas
2. **Diferentes Fases**: Testa todas as fases de cultivo
3. **Múltiplos Períodos**: Valida distribuição em 4 períodos
4. **Análise de Cultivo**: Gera recomendações
5. **Performance**: Benchmark de velocidade

### Exemplos de Resultados

| Peso (g) | Taxa (%) | Ração Total (kg) | Manhã (kg) | Tarde (kg) |
|----------|----------|------------------|------------|------------|
| 0.03     | 20%      | 0.6              | 0.3        | 0.3        |
| 1.5      | 10%      | 15.0             | 7.5        | 7.5        |
| 8.5      | 4%       | 25.5             | 12.75      | 12.75      |
| 15.2     | 3%       | 34.2             | 17.1       | 17.1       |
| 25.0     | 2%       | 35.0             | 17.5       | 17.5       |

## 📊 Análise e Recomendações

O sistema inclui análise inteligente que gera:

### Análise de Cultivo
- Fase atual do cultivo
- Biomassa total
- Taxa de alimentação aplicada

### Recomendações Automáticas
- **Densidade Alta**: Aumentar aeração e trocas de água
- **Densidade Baixa**: Considerar aumento para melhor rentabilidade
- **Fase Inicial**: Ração de alta proteína (45-50%)
- **Próximo Abate**: Planejar colheita

### Pontos de Atenção
- Qualidade da água em densidades elevadas
- Capacidade de armazenamento para alta demanda
- Otimização de FCR final

## 🔄 Migração do Sistema Antigo

### Passos para Migração

1. **Backup dos Dados**: Exportar cálculos atuais
2. **Instalação**: Adicionar novos arquivos ao projeto
3. **Configuração**: Atualizar endpoints do backend
4. **Testes**: Validar com dados reais
5. **Comparação**: Analisar diferenças nos resultados
6. **Deploy**: Substituir gradualmente

### Função de Migração

```typescript
import { migrarParaNovaCalculadora } from './models/IntegracaoCalculadora';

const resultadoMigracao = migrarParaNovaCalculadora(viveiros);
console.log(`Atualizados: ${resultadoMigracao.atualizados}`);
console.log(`Erros: ${resultadoMigracao.erros}`);
```

## ⚡ Performance

### Benchmark
- **10.000 cálculos simples**: < 100ms
- **10.000 cálculos completos**: < 500ms
- **Uso de memória**: Mínimo (< 1MB para 1.000 cálculos)

### Otimizações
- Cálculos matemáticos puros (sem loops complexos)
- Cache de taxas de alimentação
- Validação eficiente de parâmetros

## 🔮 Extensões Futuras

### Planejado
- [ ] Configuração de períodos customizáveis
- [ ] Integração com dados ambientais
- [ ] Machine Learning para previsão
- [ ] Suporte a múltiplas espécies

### Arquitetura Preparada
- Interface modular para novas taxas
- Sistema de plugins para diferentes cálculos
- API para integração com sensores

## 🛡️ Validação e Segurança

### Validações Implementadas
- Quantidade de camarões: > 0 e < 1.000.000
- Peso médio: > 0g e < 50g
- Tipagem forte em TypeScript
- Tratamento de erros robusto

### Tratamento de Erros
- Parâmetros inválidos: Lança erro específico
- Cálculos impossíveis: Retorna valores zerados
- Fallback: Sistema antigo como backup

## 📈 Benefícios Esperados

### Precisão
- **Acurácia**: Baseado em literatura científica
- **Realismo**: Reflete práticas comerciais
- **Consistência**: Mesma fórmula em todo sistema

### Eficiência
- **FCR Melhorado**: Alimentação mais precisa
- **Custo Otimizado**: Evita superalimentação
- **Produtividade**: Recomendações de manejo

### Usabilidade
- **Fácil Integração**: Adaptador para sistema existente
- **Documentação Completa**: Exemplos e tutoriais
- **Testes Abrangentes**: Garantia de qualidade

## 🤝 Contribuição

### Como Contribuir
1. Fork do projeto
2. Branch de feature
3. Testes automatizados
4. Pull request com documentação

### Padrões de Código
- TypeScript estrito
- Comentários detalhados
- Testes para novas funcionalidades
- Documentação atualizada

## 📞 Suporte

### Documentação
- README completo (este arquivo)
- Comentários no código
- Exemplos práticos
- Casos de teste

### Issues e Bugs
- Reportar via GitHub Issues
- Incluir dados de reprodução
- Ambiente de teste
- Logs detalhados

## 📜 Licença

Este projeto é parte do sistema EcoMarão e segue as mesmas diretrizes de licenciamento e uso comercial.

---

**Desenvolvido com 🦐 para a aquicultura de precisão**
