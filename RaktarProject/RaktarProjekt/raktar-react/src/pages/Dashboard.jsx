import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'

function StatCard({ icon, color, value, label, sub }) {
  return (
    <div className="col-6 col-lg-3">
      <div className="card shadow-sm h-100" style={{ border: `1px solid ${color}33` }}>
        <div className="card-body d-flex align-items-center gap-3 py-3">
          <div style={{
            width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
            background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <i className={`fa-solid ${icon}`} style={{ color, fontSize: '1.2rem' }}></i>
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '1.5rem', lineHeight: 1.1 }}>{value}</div>
            <div className="text-muted small">{label}</div>
            {sub && <div style={{ fontSize: '0.72rem', color }}>{sub}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function BerlesRow({ b }) {
  const start = new Date(b.kezdoDatum)
  const end = new Date(b.vegDatum)
  const now = new Date()
  const isActive = start <= now && end >= now
  const isPending = start > now
  const isExpired = end < now

  const statuszBadge = isActive
    ? <span className="badge" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>Aktív</span>
    : isPending
      ? <span className="badge" style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>Függőben</span>
      : <span className="badge" style={{ background: 'rgba(148,163,184,0.15)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' }}>Lejárt</span>

  return (
    <div className="d-flex align-items-center gap-3 py-2 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.06) !important' }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(248,113,113,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className="fa-solid fa-box" style={{ color: '#f87171', fontSize: '0.9rem' }}></i>
      </div>
      <div className="flex-grow-1 min-width-0">
        <div className="fw-semibold small text-truncate">#{b.berlesId} – {b.raktarNev}</div>
        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
          {start.toLocaleDateString('hu-HU')} – {end.toLocaleDateString('hu-HU')}
        </div>
      </div>
      <div className="text-end flex-shrink-0">
        {statuszBadge}
        <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>{b.osszeg?.toLocaleString('hu-HU')} Ft</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { token, userId, userName } = useAuth()
  const { showAlert } = useAlert()

  const [berlesek, setBerlesek] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    fetch('/api/Berles/sajat', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setBerlesek(data))
      .catch(() => showAlert('Nem sikerült betölteni a bérléseket.'))
      .finally(() => setLoading(false))
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const now = new Date()
  const aktiv = berlesek.filter(b => new Date(b.kezdoDatum) <= now && new Date(b.vegDatum) >= now)
  const fuggoben = berlesek.filter(b => new Date(b.kezdoDatum) > now)
  const lejart = berlesek.filter(b => new Date(b.vegDatum) < now)
  const osszesKoltes = berlesek.reduce((s, b) => s + (b.osszeg || 0), 0)

  const legutobbiAktiv = [...aktiv, ...fuggoben]
    .sort((a, b) => new Date(a.kezdoDatum) - new Date(b.kezdoDatum))
    .slice(0, 5)

  const parts = (userName || '').trim().split(' ').filter(p => p.length > 0)
  const firstName = parts[1] || parts[0] || 'Felhasználó'

  return (
    <div className="container" style={{ paddingTop: 88, paddingBottom: 60, maxWidth: 900 }}>

      
      <div className="mb-4">
        <h1 className="fw-bold mb-1" style={{ fontSize: '1.7rem' }}>
          Üdv, {firstName}!
          <i className="fa-solid fa-hand-wave ms-2" style={{ color: '#fbbf24', fontSize: '1.4rem' }}></i>
        </h1>
        <p className="text-muted mb-0">Íme az áttekintő képernyőd – mindig innen indíts.</p>
      </div>

      
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status"></div>
        </div>
      ) : (
        <>
          <div className="row g-3 mb-4">
            <StatCard icon="fa-box-open" color="#4ade80" value={aktiv.length} label="Aktív bérlés" sub={aktiv.length > 0 ? 'Jelenleg folyamatban' : null} />
            <StatCard icon="fa-clock" color="#fbbf24" value={fuggoben.length} label="Függőben" sub={fuggoben.length > 0 ? 'Hamarosan kezdődik' : null} />
            <StatCard icon="fa-archive" color="#94a3b8" value={lejart.length} label="Lezárt bérlés" />
            <StatCard icon="fa-wallet" color="#f87171" value={osszesKoltes.toLocaleString('hu-HU') + ' Ft'} label="Összes kiadás" />
          </div>

          
          <div className="row g-3 mb-4">
            <div className="col-12">
              <h5 className="fw-bold mb-3">
                <i className="fa-solid fa-bolt me-2" style={{ color: '#fbbf24' }}></i>Gyors műveletek
              </h5>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/tarolok" className="btn btn-primary w-100 d-flex flex-column align-items-center py-3 gap-1">
                <i className="fa-solid fa-plus fa-lg"></i>
                <span className="small">Új bérlés</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/berleseim" className="btn btn-outline-secondary w-100 d-flex flex-column align-items-center py-3 gap-1">
                <i className="fa-solid fa-boxes-stacked fa-lg"></i>
                <span className="small">Bérléseim</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/profil" className="btn btn-outline-secondary w-100 d-flex flex-column align-items-center py-3 gap-1">
                <i className="fa-solid fa-pen-to-square fa-lg"></i>
                <span className="small">Profil</span>
              </Link>
            </div>
            <div className="col-6 col-md-3">
              <Link to="/kapcsolat" className="btn btn-outline-secondary w-100 d-flex flex-column align-items-center py-3 gap-1">
                <i className="fa-solid fa-headset fa-lg"></i>
                <span className="small">Kapcsolat</span>
              </Link>
            </div>
          </div>

          
          <div className="card shadow-sm">
            <div className="card-header py-2 d-flex align-items-center justify-content-between">
              <h6 className="mb-0">
                <i className="fa-solid fa-list-check me-2"></i>Aktuális &amp; közelgő bérlések
              </h6>
              <Link to="/berleseim" className="btn btn-sm btn-outline-secondary">Mind</Link>
            </div>
            <div className="card-body py-2">
              {legutobbiAktiv.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="fa-solid fa-box-open fa-2x mb-2 d-block" style={{ color: '#374151' }}></i>
                  Nincs aktív vagy közelgő bérlésed.
                  <div className="mt-2">
                    <Link to="/tarolok" className="btn btn-sm btn-primary">Foglalj most!</Link>
                  </div>
                </div>
              ) : (
                legutobbiAktiv.map(b => <BerlesRow key={b.berlesId} b={b} />)
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

