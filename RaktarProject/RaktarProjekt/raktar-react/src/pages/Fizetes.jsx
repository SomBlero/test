import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'

function formatLejarat(val) {
  const v = val.replace(/\D/g, '').slice(0, 4)
  if (v.length >= 3) return v.slice(0, 2) + '/' + v.slice(2)
  return v
}

export default function Fizetes() {
  const { token, userId } = useAuth()
  const { showAlert } = useAlert()
  const location = useLocation()
  const navigate = useNavigate()

  const foglalasAdatok = location.state

  const [ugyfel, setUgyfel] = useState(null)
  const [szamlazasiCim, setSzamlazasiCim] = useState({
    iranyitoszam: '',
    varos: '',
    utca: '',
    hazszam: ''
  })
  const [kartya, setKartya] = useState({
    szam: '',
    nev: '',
    lejarat: '',
    cvc: ''
  })
  const [loading, setLoading] = useState(false)
  const [showSikeres, setShowSikeres] = useState(false)
  const [showCheck, setShowCheck] = useState(false)

  useEffect(() => {
    if (!foglalasAdatok) {
      navigate('/tarolok', { replace: true })
      return
    }
    if (!userId) return
    fetch(`/api/Ugyfel/${userId}`, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUgyfel(data))
      .catch(() => showAlert('Nem sikerült betölteni a felhasználói adatokat.'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!foglalasAdatok) return null

  const { taroloAzon, kezdoDatum, vegDatum, napok, napiAr, osszeg, raktarNev } = foglalasAdatok

  function kartyaValtoztat(field, value) {
    if (field === 'szam') {
      const digits = value.replace(/\D/g, '').slice(0, 16)
      value = digits.replace(/(.{4})/g, '$1 ').trimEnd()
    }
    if (field === 'lejarat') value = formatLejarat(value)
    if (field === 'nev') value = value.toUpperCase()
    if (field === 'cvc') value = value.replace(/\D/g, '').slice(0, 3)
    setKartya(prev => ({ ...prev, [field]: value }))
  }

  function validalFizetesi() {
    const { iranyitoszam, varos, utca, hazszam } = szamlazasiCim
    if (!iranyitoszam || !varos || !utca || !hazszam) {
      showAlert('Kérlek add meg a teljes számlázási címet!')
      return false
    }
    if (!/^\d{4}$/.test(iranyitoszam)) {
      showAlert('Az irányítószám 4 számjegyből áll!')
      return false
    }

    const kartyaSzamDigits = kartya.szam.replace(/\s/g, '')
    if (kartyaSzamDigits.length !== 16) {
      showAlert('A kártyaszám 16 számjegyből áll (4x4 blokk)!')
      return false
    }
    if (!kartya.nev.trim()) {
      showAlert('Kérlek add meg a kártyatulajdonos nevét!')
      return false
    }
    if (!/^\d{1,3}$/.test(kartya.cvc)) {
      showAlert('A CVC kód 1-3 számjegyű szám!')
      return false
    }

    if (!/^\d{2}\/\d{2}$/.test(kartya.lejarat)) {
      showAlert('A lejárati dátum formátuma: HH/ÉÉ (pl. 08/28)')
      return false
    }
    const [mm, yy] = kartya.lejarat.split('/').map(Number)
    if (mm < 1 || mm > 12) {
      showAlert('Érvénytelen lejárati hónap.')
      return false
    }
    const now = new Date()
    const expYear = 2000 + yy
    if (expYear < now.getFullYear() || (expYear === now.getFullYear() && mm < now.getMonth() + 1)) {
      showAlert('A bankkártya lejárt!')
      return false
    }
    return true
  }

  async function bekuldFizetes() {
    if (!validalFizetesi()) return
    setLoading(true)

    try {
      const szamlazasiCimStr = `${szamlazasiCim.iranyitoszam} ${szamlazasiCim.varos}, ${szamlazasiCim.utca} ${szamlazasiCim.hazszam}`

      const res = await fetch('/api/Berles/fizetes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          Tarolo_Azon: taroloAzon,
          KezdoDatum: kezdoDatum,
          VegDatum: vegDatum,
          SzamlazasiCim: szamlazasiCimStr,
          KartyaSzam: kartya.szam.replace(/\s/g, ''),
          KartyaNev: kartya.nev.trim(),
          Lejarat: kartya.lejarat,
          Cvc: kartya.cvc
        })
      })

      if (!res.ok) {
        setLoading(false)
        showAlert(await res.text())
        return
      }

      setLoading(false)
      setShowSikeres(true)
      setTimeout(() => {
        setShowCheck(true)
        setTimeout(() => navigate('/berleseim'), 1500)
      }, 2000)
    } catch (err) {
      console.error(err)
      setLoading(false)
      showAlert('Hiba történt a fizetés feldolgozása során.')
    }
  }

  return (
    <>
      {showSikeres && (
        <div style={{ display: 'flex', position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center' }}>
          <div className="text-center p-5 rounded-4 shadow-lg" style={{ background: 'var(--bg-card)', maxWidth: '420px', width: '90%' }}>
            {!showCheck ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <div className="spinner-border text-success" role="status" style={{ width: '5rem', height: '5rem', borderWidth: '5px' }}>
                  <span className="visually-hidden">Feldolgozás...</span>
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <svg className="sikeres-pipa" viewBox="0 0 52 52">
                  <circle className="sikeres-pipa-kor" cx="26" cy="26" r="23" />
                  <path className="sikeres-pipa-vonal" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
            )}
            <h3 className="fw-bold mb-2">Sikeres fizetés!</h3>
            <p className="text-muted mb-0">A számlát elküldtük az e-mail címedre. Átirányítás...</p>
          </div>
        </div>
      )}

      <div className="container" style={{ paddingTop: '88px', paddingBottom: '60px', maxWidth: '780px' }}>
        <h1 className="text-center mb-1">
          <i className="fa-solid fa-credit-card me-2" style={{ color: '#f87171' }}></i>Fizetés
        </h1>
        
        <div className="card shadow-sm mb-4" style={{ border: '1px solid rgba(185,28,28,0.3)' }}>
          <div className="card-header py-2" style={{ background: 'rgba(185,28,28,0.12)', borderBottom: '1px solid rgba(185,28,28,0.3)' }}>
            <h6 className="mb-0"><i className="fa-solid fa-box me-2"></i>Foglalás összegzése</h6>
          </div>
          <div className="card-body py-3">
            <div className="row g-2 text-center">
              <div className="col-6 col-md-3">
                <div className="text-muted small">Tároló</div>
                <div className="fw-bold">#{taroloAzon}</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="text-muted small">Telephely</div>
                <div className="fw-bold">{raktarNev}</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="text-muted small">Időszak</div>
                <div className="fw-bold" style={{ fontSize: '0.85rem' }}>{kezdoDatum} – {vegDatum}</div>
              </div>
              <div className="col-6 col-md-3">
                <div className="text-muted small">Fizetendő</div>
                <div className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                  {osszeg?.toLocaleString('hu-HU')} Ft
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  {napok} nap × {napiAr?.toLocaleString('hu-HU')} Ft
                </div>
              </div>
            </div>
          </div>
        </div>

        
        <div className="card shadow-sm mb-4">
          <div className="card-header py-2">
            <h6 className="mb-0"><i className="fa-solid fa-user me-2"></i>Vásárló adatai</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label text-muted small mb-1">Teljes név</label>
                <input type="text" className="form-control" value={ugyfel?.nev ?? ''} readOnly tabIndex={-1} />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small mb-1">E-mail cím</label>
                <input type="email" className="form-control" value={ugyfel?.email ?? ''} readOnly tabIndex={-1} />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small mb-1">Telefonszám</label>
                <input type="text" className="form-control" value={ugyfel?.telefonszam ?? '(nincs megadva)'} readOnly tabIndex={-1} />
              </div>
            </div>
          </div>
        </div>

        
        <div className="card shadow-sm mb-4">
          <div className="card-header py-2">
            <h6 className="mb-0"><i className="fa-solid fa-location-dot me-2"></i>Számlázási cím</h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-4 col-md-3">
                <label className="form-label">Irányítószám <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="1234"
                  maxLength={4}
                  inputMode="numeric"
                  value={szamlazasiCim.iranyitoszam}
                  onChange={async e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                    setSzamlazasiCim(prev => ({ ...prev, iranyitoszam: val }))
                    if (val.length === 4) {
                      try {
                        const res = await fetch(`https://api.zippopotam.us/hu/${val}`)
                        if (res.ok) {
                          const data = await res.json()
                          const nev = data.places?.[0]?.['place name']
                          if (nev) setSzamlazasiCim(prev => ({ ...prev, varos: nev }))
                        }
                      } catch (err) {
                        console.error(err)
                      }
                    }
                  }}
                />
              </div>
              <div className="col-8 col-md-9">
                <label className="form-label">Város <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Budapest"
                  value={szamlazasiCim.varos}
                  onChange={e => setSzamlazasiCim(prev => ({ ...prev, varos: e.target.value }))}
                />
              </div>
              <div className="col-8 col-md-9">
                <label className="form-label">Utca <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Kossuth Lajos utca"
                  value={szamlazasiCim.utca}
                  onChange={e => setSzamlazasiCim(prev => ({ ...prev, utca: e.target.value }))}
                />
              </div>
              <div className="col-4 col-md-3">
                <label className="form-label">Házszám <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="12/A"
                  value={szamlazasiCim.hazszam}
                  onChange={e => setSzamlazasiCim(prev => ({ ...prev, hazszam: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        
        <div className="card shadow-sm mb-4" style={{ border: '1px solid rgba(99,102,241,0.35)' }}>
          <div className="card-header py-2" style={{ background: 'rgba(99,102,241,0.1)', borderBottom: '1px solid rgba(99,102,241,0.25)' }}>
            <h6 className="mb-0">
              <i className="fa-solid fa-credit-card me-2" style={{ color: '#818cf8' }}></i>
              Bankkártya adatai
            </h6>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Kártyaszám <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text" style={{ background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)' }}>
                    <i className="fa-solid fa-credit-card" style={{ color: '#818cf8' }}></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="1234 5678 9012 3456"
                    value={kartya.szam}
                    maxLength={19}
                    inputMode="numeric"
                    onChange={e => kartyaValtoztat('szam', e.target.value)}
                    style={{ letterSpacing: '0.08em', fontFamily: 'monospace' }}
                  />
                </div>
              </div>
              <div className="col-12">
                <label className="form-label">Kártyatulajdonos neve <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="KOVACS JANOS"
                  value={kartya.nev}
                  onChange={e => kartyaValtoztat('nev', e.target.value)}
                  style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}
                />
              </div>
              <div className="col-6">
                <label className="form-label">Lejárat (HH/ÉÉ) <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="08/28"
                  value={kartya.lejarat}
                  maxLength={5}
                  inputMode="numeric"
                  onChange={e => kartyaValtoztat('lejarat', e.target.value)}
                  style={{ fontFamily: 'monospace', letterSpacing: '0.1em' }}
                />
              </div>
              <div className="col-6">
                <label className="form-label">CVC <span className="text-danger">*</span></label>
                <div className="input-group">
                  <input
                    type="password"
                    className="form-control"
                    placeholder="•••"
                    value={kartya.cvc}
                    maxLength={3}
                    inputMode="numeric"
                    autoComplete="off"
                    onChange={e => kartyaValtoztat('cvc', e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                  <span className="input-group-text">
                    <i className="fa-solid fa-lock text-muted" style={{ fontSize: '0.8rem' }}></i>
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="d-flex gap-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate('/tarolok')}
            disabled={loading}
          >
            <i className="fa-solid fa-arrow-left me-1"></i>Vissza
          </button>
          <button
            className="btn btn-primary btn-lg flex-grow-1"
            onClick={bekuldFizetes}
            disabled={loading}
          >
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Feldolgozás...</>
              : <><i className="fa-solid fa-lock me-2"></i>Fizetés és foglalás – {osszeg?.toLocaleString('hu-HU')} Ft</>
            }
          </button>
        </div>
      </div>
    </>
  )
}

