import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'

function parseDateAtStart(dateStr) {
  return new Date(dateStr.split('T')[0] + 'T00:00:00')
}

function parseDateAtEnd(dateStr) {
  return new Date(dateStr.split('T')[0] + 'T23:59:59')
}

function getBerlesId(berles) {
  return Number(berles.berlesAzon ?? berles.berlesId ?? 0)
}

function rendezLegujabbElore(lista) {
  return [...lista].sort((a, b) => {
    const diff = getBerlesId(b) - getBerlesId(a)
    if (diff !== 0) return diff
    return parseDateAtStart(b.kezdoDatum) - parseDateAtStart(a.kezdoDatum)
  })
}

function rendezLegregebbiElore(lista) {
  return [...lista].sort((a, b) => {
    const diff = getBerlesId(a) - getBerlesId(b)
    if (diff !== 0) return diff
    return parseDateAtStart(a.kezdoDatum) - parseDateAtStart(b.kezdoDatum)
  })
}

function rendezAktivFulen(lista, fuggobenElore = false) {
  const most = new Date()
  return [...lista].sort((a, b) => {
    const aFuggoben = most < parseDateAtStart(a.kezdoDatum) ? 1 : 0
    const bFuggoben = most < parseDateAtStart(b.kezdoDatum) ? 1 : 0
    if (aFuggoben !== bFuggoben) return fuggobenElore ? (bFuggoben - aFuggoben) : (aFuggoben - bFuggoben)
    const tsDiff = parseDateAtStart(b.kezdoDatum) - parseDateAtStart(a.kezdoDatum)
    if (tsDiff !== 0) return tsDiff
    return getBerlesId(b) - getBerlesId(a)
  })
}

function getTaroloNevStorageKey(userId) {
  return `tarolo-nevek-${userId || 'guest'}`
}

function CountdownDisplay({ endDateStr }) {
  const [text, setText] = useState('Számolás...')
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    function update() {
      const end = new Date(endDateStr.split('T')[0] + 'T23:59:59')
      const diffMs = end - new Date()
      if (diffMs <= 0) {
        setText('Lejárt')
        setExpired(true)
        return
      }
      setExpired(false)
      const d = Math.floor(diffMs / 86400000)
      const h = Math.floor((diffMs / 3600000) % 24)
      const m = Math.floor((diffMs / 60000) % 60)
      const s = Math.floor((diffMs / 1000) % 60)
      setText(`${d} nap ${h} óra ${m} perc ${s} mp`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endDateStr])

  return <span className={`countdown-value${expired ? ' text-danger' : ''}`}>{text}</span>
}

function NyitoKodCountdown({ lejarat, onExpire }) {
  const [text, setText] = useState('—')

  useEffect(() => {
    function update() {
      const maradMs = lejarat - new Date()
      if (maradMs <= 0) {
        onExpire()
        return
      }
      const percek = Math.floor(maradMs / 60000)
      const masodpercek = Math.floor((maradMs % 60000) / 1000)
      setText(`${percek}:${masodpercek.toString().padStart(2, '0')}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [lejarat, onExpire])

  return <strong>{text}</strong>
}

function RentalCard({ berles, taroloNev, aktivKod, onNyitas, onLemondas, onNevSzerkeszt, onKodExpire }) {
  const now = new Date()
  const startDate = parseDateAtStart(berles.kezdoDatum)
  const endDate = parseDateAtEnd(berles.vegDatum)
  const statusRaw = (berles.berlesStatusz || berles.statusz || '').toLowerCase()
  const isLocked = statusRaw === 'zarolt' || statusRaw === 'torolt'
  const isDeleted = false
  const isExpired = isLocked || isDeleted || statusRaw === 'lejart' || endDate < now
  const isReserved = statusRaw === 'fuggoben' || (!isExpired && statusRaw !== 'aktiv' && now < startDate)
  const isActive = statusRaw === 'aktiv' || (!isExpired && !isReserved)

  const kodAktiv = aktivKod && aktivKod.lejarat > new Date()

  let statusClass = 'active'
  let statusLabel = 'Aktív'
  if (isLocked) { statusClass = 'expired'; statusLabel = 'Zárolt' }
  else if (isDeleted) { statusClass = 'expired'; statusLabel = 'Törölt' }
  else if (isExpired) { statusClass = 'expired'; statusLabel = 'Lejárt' }
  else if (isReserved) { statusClass = 'pending'; statusLabel = 'Lefoglalva' }

  const formattedStart = berles.kezdoDatum.split('T')[0].replace(/-/g, '.')
  const formattedEnd = berles.vegDatum.split('T')[0].replace(/-/g, '.')
  const taroloTipus = (berles.kategoriaNev || 'Ismeretlen').trim()

  return (
    <div className="col-md-6">
      <div className="card rental-card shadow-sm h-100">
        <div className="card-body">
          <div className="tarolo-cim-sor mb-2">
            <h5 className="card-title mb-0">{taroloNev}</h5>
            <button
              className="btn btn-link btn-sm p-0 tarolo-edit-btn"
              type="button"
              onClick={() => onNevSzerkeszt(berles.berlesId)}
              title="Raktár név szerkesztése"
            >
              <i className="fa-solid fa-pen"></i>
            </button>
          </div>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fs-5 text-white fw-bold">Tároló: #{berles.tarolo_Azon}</div>
            <span className={`status-badge ${statusClass}`}>{statusLabel}</span>
          </div>

          <p className="card-text mb-1"><strong>Mettől-meddig:</strong> {formattedStart} – {formattedEnd}</p>
          <p className="card-text mb-1"><strong>Típus:</strong> {taroloTipus}</p>
          <p className="card-text mb-1"><strong>Telephelyen:</strong> {berles.raktarNev}</p>
          <p className="card-text mb-3"><strong>Ár:</strong> {berles.osszeg} Ft</p>

          <div className={`time-kod-row${kodAktiv ? '' : ' time-kod-row-single'}`}>
            <div className="countdown-box">
              <span className="countdown-label">{isLocked ? 'Állapot:' : (isReserved ? 'Kezdés ideje:' : 'Hátralévő idő:')}</span>
              {isLocked ? <span className="countdown-value text-danger">Zárolva</span> : <CountdownDisplay endDateStr={berles.vegDatum} />}
            </div>
            {kodAktiv && (
              <div className="kod-inline-box kod-inline-box-active">
                <div className="kod-inline-title">Aktív nyitókód</div>
                <div className="kod-inline-value">{aktivKod.kod}</div>
                <div className="kod-inline-expire">
                  Érvényes még: <NyitoKodCountdown lejarat={aktivKod.lejarat} berlesId={berles.berlesId} onExpire={() => onKodExpire(berles.berlesId)} />
                </div>
              </div>
            )}
          </div>

          {isActive && (
            <button
              className={`btn w-100 mt-3 ${kodAktiv ? 'btn-secondary' : 'btn-success'}`}
              onClick={() => onNyitas(berles.tarolo_Azon, berles.berlesId)}
              disabled={kodAktiv}
            >
              <i className="fa-solid fa-key me-2"></i>
              {kodAktiv ? 'Kód aktív – kérés zárolva' : 'Nyitókód lekérése'}
            </button>
          )}

          {isReserved && (
            <button className="btn btn-outline-secondary w-100 mt-3" disabled>
              <i className="fa-solid fa-clock me-2"></i>Még nem aktív időszak
            </button>
          )}

          <button
            className={`btn ${isExpired ? 'btn-outline-secondary' : 'btn-outline-danger'} w-100 mt-3`}
            onClick={() => onLemondas(berles.berlesId)}
            disabled={isExpired}
          >
            {isLocked ? 'Zárolt bérlés' : (isExpired ? 'Lejárt bérlés' : 'Bérlés lemondása')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Berleseim() {
  const { token, userId } = useAuth()
  const { showAlert } = useAlert()

  const [berlesek, setBerlesek] = useState([])
  const [aktivNyitoKodok, setAktivNyitoKodok] = useState({})
  const [taroloNevek, setTaroloNevek] = useState({})
  const [rendezes, setRendezes] = useState('aktiv-elore')
  const [aktifTab, setAktifTab] = useState('aktiv')
  const [loading, setLoading] = useState(true)
  const [hiba, setHiba] = useState(false)
  const [nevModal, setNevModal] = useState(false)
  const [szerkesztettId, setSzerkesztettId] = useState(null)
  const [nevInput, setNevInput] = useState('')
  const [lemondModal, setLemondModal] = useState(false)
  const [lemondId, setLemondId] = useState(null)

  const storageKey = getTaroloNevStorageKey(userId)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
      setTaroloNevek(saved)
    } catch {
      setTaroloNevek({})
    }
  }, [storageKey])

  const loadAktivKodok = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch('/api/NyitoKod/aktiv', { headers: { Authorization: 'Bearer ' + token } })
      if (!res.ok) return
      const kodok = await res.json()
      const map = {}
      kodok.forEach(k => {
        if (!k.berles_Azon) return
        map[k.berles_Azon] = { kod: k.kod, lejarat: new Date(k.lejarat) }
      })
      setAktivNyitoKodok(map)
    } catch {}
  }, [token])

  const loadBerlesek = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setHiba(false)
    await loadAktivKodok()
    try {
      const res = await fetch('/api/Berles/sajat', { headers: { Authorization: 'Bearer ' + token } })
      if (!res.ok) throw new Error()
      setBerlesek(await res.json())
    } catch {
      setHiba(true)
    } finally {
      setLoading(false)
    }
  }, [token, loadAktivKodok])

  useEffect(() => { loadBerlesek() }, [loadBerlesek])

  function getTaroloNev(berlesId) {
    return (taroloNevek[berlesId] || '').trim() || 'Raktár'
  }

  function openNevModal(berlesId) {
    setSzerkesztettId(berlesId)
    setNevInput((taroloNevek[berlesId] || '').trim())
    setNevModal(true)
  }

  function mentNevModal() {
    if (!szerkesztettId) return
    const ujNev = nevInput.trim()
    const updated = { ...taroloNevek }
    if (ujNev) updated[szerkesztettId] = ujNev
    else delete updated[szerkesztettId]
    setTaroloNevek(updated)
    localStorage.setItem(storageKey, JSON.stringify(updated))
    setNevModal(false)
  }

  async function nyitas(taroloId, berlesId) {
    if (!token) return
    const kod = Math.floor(100000 + Math.random() * 900000).toString()
    try {
      const res = await fetch('/api/Nyitas/igenyles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ tarolo_Azon: taroloId, berles_Azon: berlesId, kod })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setAktivNyitoKodok(prev => ({ ...prev, [berlesId]: { kod, lejarat: new Date(data.lejarat) } }))
    } catch (err) {
      showAlert('Hiba történt a nyitókód lekérésekor.')
    }
  }

  function handleLemondas(berlesId) {
    setLemondId(berlesId)
    setLemondModal(true)
  }

  async function megerositLemondas() {
    setLemondModal(false)
    if (!token || !lemondId) return
    try {
      const res = await fetch(`/api/Berles/${lemondId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token }
      })
      if (!res.ok) throw new Error(await res.text())
      loadBerlesek()
    } catch {
      showAlert('Hiba történt a lemondás során.')
    }
  }

  function onKodExpire(berlesId) {
    setAktivNyitoKodok(prev => {
      const updated = { ...prev }
      delete updated[berlesId]
      return updated
    })
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const aktivBerlesek = berlesek.filter(b => {
    const statusRaw = (b.berlesStatusz || b.statusz || '').toLowerCase()
    if (statusRaw === 'lejart' || statusRaw === 'zarolt' || statusRaw === 'torolt') return false
    return parseDateAtEnd(b.vegDatum) >= today
  })
  const lejartBerlesek = berlesek.filter(b => {
    const statusRaw = (b.berlesStatusz || b.statusz || '').toLowerCase()
    if (statusRaw === 'lejart' || statusRaw === 'zarolt' || statusRaw === 'torolt') return true
    return parseDateAtEnd(b.vegDatum) < today
  })

  let aktivRendezett = aktivBerlesek
  let lejartRendezett = lejartBerlesek

  switch (rendezes) {
    case 'aktiv-elore':
      aktivRendezett = rendezAktivFulen(aktivBerlesek, false)
      lejartRendezett = rendezLegujabbElore(lejartBerlesek)
      break
    case 'fuggoben-elore':
      aktivRendezett = rendezAktivFulen(aktivBerlesek, true)
      lejartRendezett = rendezLegujabbElore(lejartBerlesek)
      break
    case 'legregebbi':
      aktivRendezett = rendezLegregebbiElore(aktivBerlesek)
      lejartRendezett = rendezLegregebbiElore(lejartBerlesek)
      break
    default:
      aktivRendezett = rendezLegujabbElore(aktivBerlesek)
      lejartRendezett = rendezLegujabbElore(lejartBerlesek)
  }

  const visibleBerlesek = aktifTab === 'aktiv' ? aktivRendezett : lejartRendezett
  const isCompact = visibleBerlesek.length === 0

  return (
    <>
      
      {nevModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered tarolo-nev-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Adj neki nevet</h5>
                <button type="button" className="btn-close" onClick={() => setNevModal(false)} aria-label="Bezárás"></button>
              </div>
              <div className="modal-body">
                <label className="form-label">Név</label>
                <input
                  type="text"
                  className="form-control"
                  maxLength={40}
                  placeholder="Pl. Raktár 1"
                  value={nevInput}
                  onChange={e => setNevInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), mentNevModal())}
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setNevModal(false)}>Mégse</button>
                <button type="button" className="btn btn-danger" onClick={mentNevModal}>Mentés</button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      {lemondModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Bérlés lemondása</h5>
                <button type="button" className="btn-close" onClick={() => setLemondModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Biztosan le szeretnéd mondani ezt a bérlést?</p>
                <div className="alert alert-info py-2 mb-0 small">
                  <i className="fa-solid fa-circle-info me-1"></i>
                  A kifizetett összeget <strong>3 munkanapon belül</strong> visszatérítjük az eredeti fizetési módra.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setLemondModal(false)}>Mégse</button>
                <button type="button" className="btn btn-danger" onClick={megerositLemondas}>Igen, lemondás</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div id="main-content">
        <div className={`container berleseim-layout berleseim-shell${isCompact ? ' berleseim-compact' : ''}`}>
          <div className="berleseim-head">
            <h2 className="mb-4 berleseim-title">Bérléseim</h2>
            <Link to="/dashboard" className="btn btn-outline-secondary btn-sm mb-4">
              <i className="fa-solid fa-arrow-left me-1"></i>Vissza a profilomhoz
            </Link>
          </div>

          
          <ul className="nav nav-tabs mb-4 rental-tabs" style={{ borderBottom: '2px solid #dee2e6' }}>
            <li className="nav-item">
              <button
                className={`nav-link${aktifTab === 'aktiv' ? ' active' : ''}`}
                onClick={() => setAktifTab('aktiv')}
                style={{ fontWeight: 500, cursor: 'pointer' }}
              >
                <i className="fa-solid fa-circle text-success me-1" style={{ fontSize: '.7rem' }}></i>Aktív
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link${aktifTab === 'lejart' ? ' active' : ''}`}
                onClick={() => setAktifTab('lejart')}
                style={{ fontWeight: 500, cursor: 'pointer' }}
              >
                <i className="fa-solid fa-circle text-danger me-1" style={{ fontSize: '.7rem' }}></i>Lejárt
              </button>
            </li>
          </ul>

          
          <div className="d-flex flex-wrap gap-2 mb-4">
            {[
              { mode: 'legujabb', label: 'Legújabb' },
              { mode: 'legregebbi', label: 'Legrégebbi' },
              { mode: 'aktiv-elore', label: 'Aktívak előre' },
              { mode: 'fuggoben-elore', label: 'Függőben lévők előre' },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                type="button"
                className={`btn btn-sm ${rendezes === mode ? 'btn-danger' : 'btn-outline-secondary'}`}
                onClick={() => setRendezes(mode)}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status"></div>
            </div>
          ) : hiba ? (
            <div className="col-12 text-center mt-5">
              <div className="lock-icon error"><span>!</span></div>
              <h4 className="text-danger mt-3">Hiba történt a bérlések betöltésekor.</h4>
              <p className="text-muted">Próbáld meg később újra.</p>
            </div>
          ) : (
            <div className="tab-content">
              <div className={`tab-pane fade${aktifTab === 'aktiv' ? ' show active' : ''}`}>
                {aktivRendezett.length === 0 ? (
                  <div className="col-12 text-center rental-empty-block">
                    <h4 className="text-muted">Még nincs aktív bérlésed</h4>
                    <p className="text-muted mb-2">Kattints a plusz ikonra, és bérelj egyet.</p>
                    <Link to="/tarolok" className="plus-circle plus-circle-empty d-flex align-items-center justify-content-center text-decoration-none" style={{ margin: '0 auto' }}>+</Link>
                  </div>
                ) : (
                  <div className="row g-4">
                    {aktivRendezett.map((b, i) => (
                      <RentalCard
                        key={b.berlesId || i}
                        berles={b}
                        taroloNev={getTaroloNev(b.berlesId)}
                        aktivKod={aktivNyitoKodok[b.berlesId]}
                        onNyitas={nyitas}
                        onLemondas={handleLemondas}
                        onNevSzerkeszt={openNevModal}
                        onKodExpire={onKodExpire}
                      />
                    ))}
                    <div className="col-12 text-center mt-4">
                      <Link to="/tarolok" className="plus-circle d-flex align-items-center justify-content-center text-decoration-none" style={{ margin: '0 auto' }}>+</Link>
                      <p className="text-muted">Új tároló bérlése</p>
                    </div>
                  </div>
                )}
              </div>

              <div className={`tab-pane fade${aktifTab === 'lejart' ? ' show active' : ''}`}>
                {lejartRendezett.length === 0 ? (
                  <div className="col-12 text-center rental-empty-block rental-empty-simple">
                    <p className="text-muted">Itt jelennek meg a lejárt bérlések</p>
                  </div>
                ) : (
                  <div className="row g-4">
                    {lejartRendezett.map((b, i) => (
                      <RentalCard
                        key={b.berlesId || i}
                        berles={b}
                        taroloNev={getTaroloNev(b.berlesId)}
                        aktivKod={aktivNyitoKodok[b.berlesId]}
                        onNyitas={nyitas}
                        onLemondas={handleLemondas}
                        onNevSzerkeszt={openNevModal}
                        onKodExpire={onKodExpire}
                      />
                    ))}
                    <div className="col-12 text-center mt-4">
                      <p className="text-muted">Itt jelennek meg a lejárt bérlések</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

