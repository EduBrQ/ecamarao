function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <p>&copy; {year} - ecamarao - Controle de Carcinicultura</p>
      <p>Versao 0.2.0</p>
    </footer>
  )
}

export default Footer
