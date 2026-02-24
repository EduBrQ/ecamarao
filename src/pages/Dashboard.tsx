function Dashboard() {
  const measures = [
    { label: 'pH', value: 7, unit: '', status: 'Neutro' },
    { label: 'Oxigenio', value: 22, unit: 'mg/l', status: 'Ideal' },
    { label: 'Temperatura', value: 36, unit: '°C', status: 'Elevada' },
  ]

  return (
    <div className="container fade-in">
      <div className="card">
        <div className="card-header-accent">Dashboard - Dados Coletados</div>

        <div className="measure-grid">
          {measures.map((m) => (
            <div key={m.label} className="measure-card">
              <div className="measure-value">
                {m.value}
                {m.unit && <span className="measure-unit"> {m.unit}</span>}
              </div>
              <div className="measure-label">{m.status}</div>
              <div className="measure-label" style={{ opacity: 0.7, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
