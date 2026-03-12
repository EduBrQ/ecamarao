import { ProductionForecast } from "../types"


export const preverProducao = (viveiro: any): ProductionForecast => {
  const doc = viveiro.doc || 0
  // const biomassaAtual = viveiro.biomassa || 0

  // Curva de crescimento (g)
  let pesoMedioEstimado = 0

  if (doc <= 10) pesoMedioEstimado = 0.01
  else if (doc <= 20) pesoMedioEstimado = 0.03
  else if (doc <= 30) pesoMedioEstimado = 0.08
  else if (doc <= 40) pesoMedioEstimado = 0.2
  else if (doc <= 50) pesoMedioEstimado = 0.5
  else if (doc <= 60) pesoMedioEstimado = 1.2
  else if (doc <= 70) pesoMedioEstimado = 2.5
  else if (doc <= 80) pesoMedioEstimado = 5
  else if (doc <= 90) pesoMedioEstimado = 10
  else if (doc <= 120) pesoMedioEstimado = 15
  else if (doc <= 150) pesoMedioEstimado = 22
  else if (doc <= 180) pesoMedioEstimado = 28
  else pesoMedioEstimado = 30

  const pesoColheita = 10

  // Número de camarões baseado na estocagem
  const camaroesEstocados = viveiro.camaroes || 0
  const taxaSobrevivencia = viveiro.sobrevivencia || 0.7

  const numeroCamaroes = camaroesEstocados * taxaSobrevivencia

  // Biomassa prevista na colheita
  const biomassaColheita = (numeroCamaroes * pesoColheita) / 1000

  // DOC médio de colheita
  const docColheita = 90
  const diasAteColheita = Math.max(0, docColheita - doc)

  const dataColheita = new Date()
  dataColheita.setDate(dataColheita.getDate() + diasAteColheita)

  return {
    pesoMedioEstimado: parseFloat(pesoMedioEstimado.toFixed(2)),
    producaoEstimada: parseFloat(biomassaColheita.toFixed(0)),
    dataColheita,
    diasAteColheita
  }
}