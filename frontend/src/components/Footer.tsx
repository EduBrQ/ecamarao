function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <p>&copy; {year} ecamarao &middot; Controle de carcinicultura</p>
    </footer>
  )
}

export default Footer
