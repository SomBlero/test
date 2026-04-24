import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { checkName, checkEmail, checkPhone, checkPassword } from '../utils/validators'

function AlertBox({ msg, type }) {
  if (!msg) return null
  const icon = type === 'success' ? 'circle-check' : 'triangle-exclamation'
  return (
    <div className={`alert alert-${type} d-flex align-items-center gap-2 py-2`}>
      <i className={`fa-solid fa-${icon}`}></i>
      {msg}
    </div>
  )
}

export default function Profil() {
  const { token, userId, updateDisplayName, logout } = useAuth()
  const navigate = useNavigate()

  const [profil, setProfil] = useState({ nev: '', email: '', telefonszam: '' })
  const [eredetiProfil, setEredetiProfil] = useState({ nev: '', email: '', telefonszam: '' })
  const [profilJelszo, setProfilJelszo] = useState('')
  const [mentLoading, setMentLoading] = useState(false)
  const [profilAlert, setProfilAlert] = useState({ msg: '', type: 'success' })

  const [regiJelszo, setRegiJelszo] = useState('')
  const [ujJelszo, setUjJelszo] = useState('')
  const [ujJelszoIsmet, setUjJelszoIsmet] = useState('')
  const [jelszoAlert, setJelszoAlert] = useState({ msg: '', type: 'success' })
  const [jelszoLoading, setJelszoLoading] = useState(false)

  const [torlesJelszo, setTorlesJelszo] = useState('')
  const [torlesAlert, setTorlesAlert] = useState({ msg: '', type: 'success' })
  const [torlesLoading, setTorlesLoading] = useState(false)
  const [aktívBerlesek, setAktivBerlesek] = useState([])

  const [avatarMonogram, setAvatarMonogram] = useState('?')
  const [nevCim, setNevCim] = useState('Betöltés...')
  const [regDatum, setRegDatum] = useState('')
  const [infoId, setInfoId] = useState('—')
  const [infoRegDatum, setInfoRegDatum] = useState('—')
  const [infoRole, setInfoRole] = useState('')
  const [emailErtesitesek, setEmailErtesitesek] = useState(true)
  const [ertesitesAlert, setErtesitesAlert] = useState({ msg: '', type: 'success' })
  const [torlesModal, setTorlesModal] = useState(false)
  const [megerositesModal, setMegerositesModal] = useState(false)

  function profilValtozott() {
    return profil.nev.trim() !== eredetiProfil.nev
      || profil.email.trim() !== eredetiProfil.email
      || profil.telefonszam.trim() !== eredetiProfil.telefonszam
  }

  useEffect(() => {
    if (!token || !userId) { navigate('/bejelentkezes'); return }

    fetch(`/api/Ugyfel/${userId}`, { headers: { Authorization: 'Bearer ' + token } })
      .then(async res => {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          logout()
          navigate('/bejelentkezes')
          return null
        }
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(adat => {
        if (!adat) return
        const nev = adat.nev || ''
        const email = adat.email || ''
        const telefon = adat.telefonszam || ''

        setProfil({ nev, email, telefonszam: telefon })
        setEredetiProfil({ nev: nev.trim(), email: email.trim(), telefonszam: telefon.trim() })
        setNevCim(nev || 'Névtelen')
        setRegDatum('Regisztrált: ' + new Date(adat.regisztracioDatuma).toLocaleDateString('hu-HU'))
        setInfoId('#' + (adat.ugyfelAzon || '?'))
        setInfoRegDatum(new Date(adat.regisztracioDatuma).toLocaleString('hu-HU'))
        setInfoRole(adat.role)
        setEmailErtesitesek(adat.emailErtesitesek !== false)

        const parts = (nev || '?').trim().split(' ').filter(p => p.length > 0)
        const mono = parts.length >= 2
          ? (parts[0][0] + parts[1][0]).toUpperCase()
          : (parts[0]?.[0] || '?').toUpperCase()
        setAvatarMonogram(mono)
        fetch('/api/Berles/sajat', { headers: { Authorization: 'Bearer ' + token } })
          .then(r => r.ok ? r.json() : [])
          .then(berlesek => {
            if (!Array.isArray(berlesek)) return
            const most = new Date()
            setAktivBerlesek(berlesek.filter(b => new Date(b.vegDatum) >= new Date(most.toDateString())))
          })
          .catch(() => {})
      })
      .catch(() => setProfilAlert({ msg: 'Nem sikerült betölteni a profiladatokat.', type: 'danger' }))
  }, [token, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function mentProfil(e) {
    e.preventDefault()
    setProfilAlert({ msg: '', type: 'success' })

    if (!profilValtozott()) {
      setProfilAlert({ msg: 'Nincs módosítás a név, e-mail vagy telefonszám mezőkben.', type: 'danger' })
      return
    }

    const nev = profil.nev.trim()
    const email = profil.email.trim()
    const telefon = profil.telefonszam.trim()

    const nevCheck = checkName(nev)
    if (nevCheck.isEmpty) { setProfilAlert({ msg: 'A név nem lehet üres.', type: 'danger' }); return }
    if (nevCheck.isFormat) { setProfilAlert({ msg: 'A névnek legalább két tagból kell állnia, nagy kezdőbetűvel (pl. Kovács Anna).', type: 'danger' }); return }

    const emailCheck = checkEmail(email)
    if (emailCheck.isEmpty) { setProfilAlert({ msg: 'Az e-mail cím nem lehet üres.', type: 'danger' }); return }
    if (emailCheck.isFormat) { setProfilAlert({ msg: 'Nem megfelelő az e-mail cím formátuma.', type: 'danger' }); return }

    const telefonCheck = checkPhone(telefon)
    if (telefonCheck.isEmpty) { setProfilAlert({ msg: 'A telefonszám nem lehet üres.', type: 'danger' }); return }
    if (telefonCheck.isFormat) { setProfilAlert({ msg: 'Nem megfelelő a telefonszám formátuma.', type: 'danger' }); return }

    if (!profilJelszo) { setProfilAlert({ msg: 'A módosítás mentéséhez add meg a jelenlegi jelszavadat.', type: 'danger' }); return }

    setMentLoading(true)
    try {
      const res = await fetch(`/api/Ugyfel/${userId}/profil`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ nev, email, telefonszam: telefon, jelszo: profilJelszo })
      })

      if (res.status === 401) { setProfilAlert({ msg: 'Helytelen jelszó. Az adatok nem kerültek mentésre.', type: 'danger' }); return }
      if (res.status === 409) { setProfilAlert({ msg: 'Ez az email cím már foglalt.', type: 'danger' }); return }
      if (!res.ok) throw new Error()

      updateDisplayName(nev)
      setProfilAlert({ msg: 'Profil sikeresen frissítve!', type: 'success' })
      setNevCim(nev)
      setProfilJelszo('')
      setEredetiProfil({ nev: nev.trim(), email: email.trim(), telefonszam: telefon.trim() })

      const parts = nev.trim().split(' ').filter(p => p.length > 0)
      const mono = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : (parts[0]?.[0] || '?').toUpperCase()
      setAvatarMonogram(mono)
    } catch {
      setProfilAlert({ msg: 'Hiba történt a mentés során.', type: 'danger' })
    } finally {
      setMentLoading(false)
    }
  }

  async function mentErtesitesek(ertek) {
    setEmailErtesitesek(ertek)
    setErtesitesAlert({ msg: '', type: 'success' })
    try {
      const res = await fetch(`/api/Ugyfel/${userId}/ertesitesek`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ emailErtesitesek: ertek })
      })
      if (!res.ok) throw new Error()
      setErtesitesAlert({ msg: 'Értesítési beállítás elmentve.', type: 'success' })
    } catch {
      setEmailErtesitesek(!ertek)
      setErtesitesAlert({ msg: 'Hiba történt a mentés során.', type: 'danger' })
    }
  }

  async function mentJelszo(e) {
    e.preventDefault()
    setJelszoAlert({ msg: '', type: 'success' })

    if (!regiJelszo) { setJelszoAlert({ msg: 'Add meg a jelenlegi jelszót.', type: 'danger' }); return }

    const check = checkPassword(ujJelszo)
    if (check.tooShort) { setJelszoAlert({ msg: 'Az új jelszó legalább 8 karakter legyen.', type: 'danger' }); return }
    if (check.noUpper) { setJelszoAlert({ msg: 'Az új jelszóban szerepelnie kell nagybetűnek.', type: 'danger' }); return }
    if (check.noNumber) { setJelszoAlert({ msg: 'Az új jelszóban szerepelnie kell számnak.', type: 'danger' }); return }
    if (check.noSpecial) { setJelszoAlert({ msg: 'Az új jelszóban szerepelnie kell különleges karakternek.', type: 'danger' }); return }
    if (check.forbiddenChar) { setJelszoAlert({ msg: 'Az új jelszó tiltott karaktert tartalmaz.', type: 'danger' }); return }
    if (ujJelszo !== ujJelszoIsmet) { setJelszoAlert({ msg: 'A két új jelszó nem egyezik.', type: 'danger' }); return }

    setJelszoLoading(true)
    try {
      const res = await fetch(`/api/Ugyfel/${userId}/jelszo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ regiJelszo, ujJelszo })
      })
      if (res.status === 401) { setJelszoAlert({ msg: 'A jelenlegi jelszó helytelen.', type: 'danger' }); return }
      if (!res.ok) throw new Error()
      setJelszoAlert({ msg: 'Jelszó sikeresen megváltoztatva!', type: 'success' })
      setRegiJelszo(''); setUjJelszo(''); setUjJelszoIsmet('')
    } catch {
      setJelszoAlert({ msg: 'Hiba történt a jelszó mentése során.', type: 'danger' })
    } finally {
      setJelszoLoading(false)
    }
  }

  async function torlesFiok(jelszo) {
    setTorlesLoading(true)
    try {
      const res = await fetch(`/api/Ugyfel/${userId}/torles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ jelszo })
      })
      if (res.status === 401) { setTorlesAlert({ msg: 'Helytelen jelszó.', type: 'danger' }); return }
      if (res.status === 403) { setTorlesAlert({ msg: 'Nem jogosult a fiók törlésére.', type: 'danger' }); return }
      if (!res.ok) throw new Error()

      logout()
      navigate('/')
    } catch {
      setTorlesAlert({ msg: 'Hiba történt a fiók törlése során.', type: 'danger' })
    } finally {
      setTorlesLoading(false)
    }
  }

  async function handleTorlesSubmit(e) {
    e.preventDefault()
    setTorlesAlert({ msg: '', type: 'success' })
    if (!torlesJelszo) { setTorlesAlert({ msg: 'Adja meg a jelenlegi jelszavát.', type: 'danger' }); return }

    if (aktívBerlesek.length > 0) {
      setTorlesModal(true)
      return
    }

    setMegerositesModal(true)
  }

  async function lemondEsTorles() {
    setTorlesModal(false)
    setTorlesLoading(true)
    try {
      for (const b of aktívBerlesek) {
        await fetch(`/api/Berles/${b.berlesAzon}`, {
          method: 'DELETE',
          headers: { Authorization: 'Bearer ' + token }
        })
      }
      await torlesFiok(torlesJelszo)
    } catch {
      setTorlesAlert({ msg: 'Hiba történt a foglalások törlése vagy fiók törlése során.', type: 'danger' })
      setTorlesLoading(false)
    }
  }

  return (
    <>
      
      {torlesModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-dark text-white border-0">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title">
                  <i className="fa-solid fa-exclamation-triangle me-2"></i>Aktív foglalások és fióktörlés
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setTorlesModal(false)} aria-label="Bezárás"></button>
              </div>
              <div className="modal-body p-4">
                {aktívBerlesek.map(b => (
                  <div key={b.berlesAzon} className="border rounded p-2 mb-2" style={{ borderColor: '#444' }}>
                    <strong>#{b.berlesAzon}</strong> - {b.raktarNev} / {b.kategoriaNev}<br />
                    {new Date(b.kezdoDatum).toLocaleDateString('hu-HU')} – {new Date(b.vegDatum).toLocaleDateString('hu-HU')}<br />
                    <small>{b.allapot || '?'}, összeg: {b.osszeg} Ft</small>
                  </div>
                ))}
              </div>
              <div className="modal-footer border-0 pt-0 justify-content-between">
                <button className="btn btn-success btn-lg flex-fill me-2" onClick={() => setTorlesModal(false)}>
                  <i className="fa-solid fa-save me-2"></i>Rendelések és fiók megtartása
                </button>
                <button className="btn btn-danger btn-lg flex-fill" onClick={lemondEsTorles} disabled={torlesLoading}>
                  <i className="fa-solid fa-trash-can me-2"></i>Rendelések és fiók törlése
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {megerositesModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content bg-dark text-white border-0">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title">
                  <i className="fa-solid fa-triangle-exclamation me-2 text-danger"></i>Fiók törlése
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setMegerositesModal(false)} aria-label="Bezárás"></button>
              </div>
              <div className="modal-body p-4">
                <p className="mb-0">Biztosan törölni szeretnéd a fiókodat? <strong>Ez visszafordíthatatlan.</strong></p>
              </div>
              <div className="modal-footer border-0 pt-0 justify-content-between">
                <button className="btn btn-success btn-lg flex-fill me-2" onClick={() => setMegerositesModal(false)}>
                  <i className="fa-solid fa-shield-halved me-2"></i>Fiók megtartása
                </button>
                <button
                  className="btn btn-danger btn-lg flex-fill"
                  onClick={() => { setMegerositesModal(false); torlesFiok(torlesJelszo) }}
                  disabled={torlesLoading}
                >
                  <i className="fa-solid fa-trash-can me-2"></i>Fiók törlése
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container profile-container">
        
        <div className="text-center mb-4">
          <div className="profil-avatar mx-auto mb-3">
            <span>{avatarMonogram}</span>
          </div>
          <h3 className="fw-bold">{nevCim.trim().split(' ').filter(p => p.length > 0)[1] || nevCim}</h3>
          <p className="text-muted small">{regDatum}</p>
        </div>

        
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">
              <i className="fa-solid fa-pen-to-square me-2" style={{ color: '#f87171' }}></i>Adatok szerkesztése
            </h5>
            <AlertBox msg={profilAlert.msg} type={profilAlert.type} />
            <form onSubmit={mentProfil}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-user me-1 text-muted"></i>Teljes név
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Kovács Anna"
                  value={profil.nev}
                  onChange={e => setProfil(p => ({ ...p, nev: e.target.value }))}
                />
                <div className="form-text">Névváltozásnál (pl. házasság) frissítsd itt.</div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-envelope me-1 text-muted"></i>E-mail cím
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="email@email.hu"
                  value={profil.email}
                  onChange={e => setProfil(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-phone me-1 text-muted"></i>Telefonszám
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+36 30 123 4567"
                  value={profil.telefonszam}
                  onChange={e => setProfil(p => ({ ...p, telefonszam: e.target.value }))}
                />
                <div className="form-text">Add meg az aktuális telefonszámodat.</div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-lock me-1 text-muted"></i>Jelenlegi jelszó <span className="text-danger">*</span>
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="A módosítás megerősítéséhez szükséges"
                  value={profilJelszo}
                  onChange={e => setProfilJelszo(e.target.value)}
                />
              </div>
              <div className="d-grid gap-2">
                <button type="submit" className="btn btn-primary btn-lg" disabled={!profilValtozott() || mentLoading}>
                  {mentLoading
                    ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Mentés...</>
                    : <><i className="fa-solid fa-floppy-disk me-2"></i>Mentés</>
                  }
                </button>
                <Link to="/berleseim" className="btn btn-outline-secondary">
                  <i className="fa-solid fa-boxes-stacked me-2"></i>Bérléseim megtekintése
                </Link>
              </div>
            </form>
          </div>
        </div>

        
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-3">
              <i className="fa-solid fa-bell me-2" style={{ color: '#f87171' }}></i>Értesítési beállítások
            </h5>
            <AlertBox msg={ertesitesAlert.msg} type={ertesitesAlert.type} />
            <div className="d-flex align-items-center justify-content-between py-2">
              <div>
                <div className="fw-semibold">E-mail értesítések</div>
                <div className="text-muted small">Foglalás visszaigazolás, számla, lemondás értesítők</div>
              </div>
              <div className="form-check form-switch ms-3 mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="emailErtesitesekSwitch"
                  checked={emailErtesitesek}
                  onChange={e => mentErtesitesek(e.target.checked)}
                  style={{ width: '2.5em', height: '1.4em', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        </div>

        
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4">
              <i className="fa-solid fa-lock me-2" style={{ color: '#f87171' }}></i>Jelszó megváltoztatása
            </h5>
            <AlertBox msg={jelszoAlert.msg} type={jelszoAlert.type} />
            <form onSubmit={mentJelszo}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-lock me-1 text-muted"></i>Jelenlegi jelszó
                </label>
                <input type="password" className="form-control" placeholder="Jelenlegi jelszó" value={regiJelszo} onChange={e => setRegiJelszo(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-key me-1 text-muted"></i>Új jelszó
                </label>
                <input type="password" className="form-control" placeholder="Min. 8 kar., nagybetű, szám, spec. karakter" value={ujJelszo} onChange={e => setUjJelszo(e.target.value)} />
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-key me-1 text-muted"></i>Új jelszó megerősítése
                </label>
                <input type="password" className="form-control" placeholder="Új jelszó újra" value={ujJelszoIsmet} onChange={e => setUjJelszoIsmet(e.target.value)} />
              </div>
              <div className="d-grid">
                <button type="submit" className="btn btn-primary btn-lg" disabled={jelszoLoading}>
                  {jelszoLoading
                    ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Mentés...</>
                    : <><i className="fa-solid fa-floppy-disk me-2"></i>Jelszó mentése</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        
        <div className="card shadow-sm border-0 mb-4 border-danger">
          <div className="card-body p-4">
            <h5 className="fw-bold mb-4 text-danger">
              <i className="fa-solid fa-user-slash me-2"></i>Fiók törlése
            </h5>
            <AlertBox msg={torlesAlert.msg} type={torlesAlert.type} />
            <form onSubmit={handleTorlesSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="fa-solid fa-lock me-1 text-muted"></i>Jelszó a fiók törléséhez
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Add meg a jelenlegi jelszavadat"
                  value={torlesJelszo}
                  onChange={e => setTorlesJelszo(e.target.value)}
                />
                <div className="form-text">A fiók véglegesen törlődik, ha a jelszó helyes.</div>
              </div>
              <div className="d-grid">
                <button type="submit" className="btn btn-danger btn-lg" disabled={torlesLoading}>
                  {torlesLoading
                    ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Törlés folyamatban...</>
                    : <><i className="fa-solid fa-trash-can me-2"></i>Fiók törlése</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>

        
        <div className="card shadow-sm border-0 mb-5">
          <div className="card-body p-4">
            <h6 className="fw-bold mb-3 text-muted">
              <i className="fa-solid fa-circle-info me-2"></i>Fiók információk
            </h6>
            <div className="row g-3">
              <div className="col-6">
                <div className="small text-muted">Felhasználó ID</div>
                <div className="fw-semibold">{infoId}</div>
              </div>
              <div className="col-6">
                <div className="small text-muted">Szerepkör</div>
                <div>
                  {infoRole === 'admin'
                    ? <span className="badge bg-danger">Admin</span>
                    : <span className="badge bg-secondary">Felhasználó</span>
                  }
                </div>
              </div>
              <div className="col-12">
                <div className="small text-muted">Regisztráció dátuma</div>
                <div className="fw-semibold">{infoRegDatum}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

