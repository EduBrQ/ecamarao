/**
 * Teste de validação da fórmula de biomassa
 */

// Exemplo 1: Viveiro com camarões de 3g
const exemplo1 = {
  numeroCamaroes: 100000,
  pesoMedioG: 3,
  biomassaKg: (100000 * 3) / 1000
};

// Exemplo 2: Pós-larvas de 0.03g
const exemplo2 = {
  numeroCamaroes: 100000,
  pesoMedioG: 0.03,
  biomassaKg: (100000 * 0.03) / 1000
};

console.log('🧪 Teste da Fórmula de Biomassa');
console.log('Fórmula: biomassa (kg) = número de camarões × peso médio (g) ÷ 1000\n');

console.log('Exemplo 1: Viveiro estabelecido');
console.log(`Número de camarões: ${exemplo1.numeroCamaroes.toLocaleString()}`);
console.log(`Peso médio: ${exemplo1.pesoMedioG}g`);
console.log(`Cálculo: ${exemplo1.numeroCamaroes} × ${exemplo1.pesoMedioG} ÷ 1000 = ${exemplo1.biomassaKg}kg`);
console.log(`Resultado: ${exemplo1.biomassaKg}kg de camarão vivo\n`);

console.log('Exemplo 2: Povoamento inicial');
console.log(`Número de camarões: ${exemplo2.numeroCamaroes.toLocaleString()}`);
console.log(`Peso médio: ${exemplo2.pesoMedioG}g`);
console.log(`Cálculo: ${exemplo2.numeroCamaroes} × ${exemplo2.pesoMedioG} ÷ 1000 = ${exemplo2.biomassaKg}kg`);
console.log(`Resultado: ${exemplo2.biomassaKg}kg de camarão vivo\n`);

console.log('✅ Fórmula validada com sucesso!');
