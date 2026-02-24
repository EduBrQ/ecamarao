import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Feedback } from '../models/types'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const initialFeedbacks: Feedback[] = [
  {
    id: 1,
    medida: 'pH',
    condicao: 'Muito Alto',
    manejo: 'Para melhorar essa condicao, e indicado o uso de calcario no viveiro',
    descricao: 'O pH esta um pouco acima do ideal',
  },
  {
    id: 2,
    medida: 'Transparencia',
    condicao: 'Baixo',
    manejo: 'Para melhorar essa condicao, e indicado o uso de calcario no viveiro',
    descricao: 'A agua esta com uma transparencia muito abaixo do ideal',
  },
  {
    id: 3,
    medida: 'Oxigenio',
    condicao: 'Muito Baixo',
    manejo: 'Para melhorar essa condicao, e indicado o uso de calcario no viveiro',
    descricao: 'O nivel de oxigenio na agua esta muito abaixo do ideal',
  },
]

const chartData = {
  labels: ['pH', 'O2', 'Temperatura', 'Alcalinidade', 'Transparencia', 'Dureza'],
  datasets: [
    {
      label: 'Atual',
      data: [7, 3, 4, 5, 23, 2],
      backgroundColor: 'rgba(81, 97, 183, 0.7)',
    },
    {
      label: 'Ideal',
      data: [7, 6, 3, 3, 20, 5],
      backgroundColor: 'rgba(63, 144, 63, 0.7)',
    },
  ],
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'top' as const },
    title: { display: true, text: 'Qualidade da Agua' },
  },
}

function Feedbacks() {
  const { id: viveiroId } = useParams<{ id: string }>()
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">Dashboard & Relatorios - Viveiro {viveiroId}</div>

        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>

        <h3 className="card-title">Alertas</h3>
        <div className="feedback-list">
          {initialFeedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className="feedback-item"
              onClick={() => setSelectedFeedback(feedback)}
            >
              <span className="feedback-icon">&#9432;</span>
              <span className="feedback-text">- {feedback.descricao}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedFeedback && (
        <div className="modal-overlay" onClick={() => setSelectedFeedback(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Dicas de manejo</h3>
              <button className="modal-close" onClick={() => setSelectedFeedback(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <h4 style={{ marginBottom: '0.5rem' }}>
                {selectedFeedback.medida} - {selectedFeedback.condicao}
              </h4>
              <p>{selectedFeedback.manejo}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Feedbacks
