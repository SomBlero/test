import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-dark text-white text-center py-3">
      <p className="mb-0">
        © 2026 RaktárBérlés &nbsp;|&nbsp;
        <Link to="/aszf" className="text-white-50 text-decoration-none">ÁSZF</Link>
        &nbsp;|&nbsp;
        <Link to="/adatvedelem" className="text-white-50 text-decoration-none">Adatvédelem</Link>
        &nbsp;|&nbsp;
        <Link to="/kapcsolat" className="text-white-50 text-decoration-none">Kapcsolat</Link>
      </p>
    </footer>
  )
}
