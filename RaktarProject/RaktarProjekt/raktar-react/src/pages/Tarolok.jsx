import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import flatpickr from 'flatpickr'
import { Hungarian } from 'flatpickr/dist/l10n/hu.js'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'

flatpickr.localize(Hungarian)

function getToday() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function Tarolok() {
  const { token } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()

  const [osszesTarolo, setOsszesTarolo] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [datumStatus, setDatumStatus] = useState('')
  const [step, setStep] = useState('datum') // 'datum' | 'telephely' | 'tarolok'
  const [kivalasztottTelephelyId, setKivalasztottTelephelyId] = useState(null)
  const [kivalasztottTarolo, setKivalasztottTarolo] = useState(null)
  const [showPanel, setShowPanel] = useState(false)
  const [foglalasLoading, setFoglalasLoading] = useState(false)

  const startRef = useRef(null)
  const endRef = useRef(null)
  const startPickerRef = useRef(null)
  const endPickerRef = useRef(null)

  const telephely2Ref = useRef(null)
  const tarolok3Ref = useRef(null)
  useEffect(() => {
    fetch('/api/TaroloHelyiseg')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        data.forEach(t => { if (t.statusz !== 'karbantartas') t.statusz = 'szabad' })
        setOsszesTarolo(data)
      })
      .catch(() => {})
  }, [])

  function hozzaadNaptarGombok(instance, onClear) {
    if (!instance?.calendarContainer) return
    if (instance.calendarContainer.querySelector('.fp-actions')) return

    const actions = document.createElement('div')
    actions.className = 'fp-actions'

    const maBtn = document.createElement('button')
    maBtn.type = 'button'
    maBtn.className = 'fp-action-btn'
    maBtn.textContent = 'Ma'
    maBtn.addEventListener('click', () => {
      instance.setDate(new Date(), true)
      instance.close()
    })

    const torlesBtn = document.createElement('button')
    torlesBtn.type = 'button'
    torlesBtn.className = 'fp-action-btn'
    torlesBtn.textContent = 'Törlés'
    torlesBtn.addEventListener('click', () => {
      instance.clear()
      if (onClear) onClear()
      instance.close()
    })

    actions.appendChild(maBtn)
    actions.appendChild(torlesBtn)
    instance.calendarContainer.appendChild(actions)

    instance.calendarContainer.addEventListener('wheel', (e) => {
      e.preventDefault()
      instance.changeMonth(e.deltaY > 0 ? 1 : -1)
    }, { passive: false })
  }
  useEffect(() => {
    if (!startRef.current || !endRef.current) return

    startPickerRef.current = flatpickr(startRef.current, {
      dateFormat: 'Y-m-d',
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
      minDate: getToday(),
      locale: 'hu',
      onReady: (_s, _d, inst) => hozzaadNaptarGombok(inst, () => setStartDate('')),
      onOpen: (_s, _d, inst) => inst.set('minDate', getToday()),
      onChange: (selectedDates, dateStr) => {
        setStartDate(dateStr)
        if (endPickerRef.current) {
          endPickerRef.current.set('minDate', selectedDates[0] || getToday())
          if (selectedDates[0] && endPickerRef.current.selectedDates[0] &&
              endPickerRef.current.selectedDates[0] < selectedDates[0]) {
            endPickerRef.current.clear()
            setEndDate('')
          }
        }
      }
    })

    endPickerRef.current = flatpickr(endRef.current, {
      dateFormat: 'Y-m-d',
      allowInput: false,
      clickOpens: true,
      disableMobile: true,
      minDate: getToday(),
      locale: 'hu',
      onReady: (_s, _d, inst) => hozzaadNaptarGombok(inst, () => setEndDate('')),
      onOpen: (_s, _d, inst) => {
        const sd = startPickerRef.current?.selectedDates[0] || getToday()
        inst.set('minDate', sd)
        if (inst.selectedDates[0] && inst.selectedDates[0] < new Date(sd)) {
          inst.clear()
          setEndDate('')
        }
      },
      onChange: (_s, dateStr) => setEndDate(dateStr)
    })

    return () => {
      startPickerRef.current?.destroy()
      endPickerRef.current?.destroy()
    }
  }, [])
  const frissitElerhetoseg = useCallback(async (start, end, tarolok) => {
    try {
      const res = await fetch(`/api/Berles/elerhetoseg?kezdo_datum=${start}&veg_datum=${end}`)
      if (!res.ok) return tarolok
      const elerhetoseg = await res.json()
      return tarolok.map(t => {
        if (t.statusz === 'karbantartas') return t
        return {
          ...t,
          statusz: elerhetoseg.foglalt_tarolo_azonok.includes(t.taroloAzon) ? 'foglalt' : 'szabad'
        }
      })
    } catch {
      return tarolok
    }
  }, [])

  useEffect(() => {
    if (!startDate || !endDate) {
      setDatumStatus('')
      setStep('datum')
      setKivalasztottTelephelyId(null)
      setKivalasztottTarolo(null)
      setShowPanel(false)
      return
    }

    if (startDate > endDate) {
      setDatumStatus('error')
      setStep('datum')
      setShowPanel(false)
      return
    }

    setDatumStatus('loading')
    frissitElerhetoseg(startDate, endDate, osszesTarolo).then(updated => {
      setOsszesTarolo(updated)
      setDatumStatus('ok')
      setStep('telephely')
      setKivalasztottTarolo(null)
      setShowPanel(false)
      setTimeout(() => telephely2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    })
  }, [startDate, endDate]) // eslint-disable-line react-hooks/exhaustive-deps

  function valasztTelephelyt(cimAzon) {
    setKivalasztottTelephelyId(cimAzon)
    setKivalasztottTarolo(null)
    setShowPanel(false)
    setStep('tarolok')
    setTimeout(() => tarolok3Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  function valasztTarolot(tarolo) {
    setKivalasztottTarolo(tarolo)
    setShowPanel(true)
    setTimeout(() => document.getElementById('foglalas-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  function szamolNapok() {
    if (!startDate || !endDate) return 0
    const diff = Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    return diff + 1
  }

  async function bekuldFoglalas() {
    if (!token) { showAlert('A foglaláshoz be kell jelentkezned!'); return }
    if (!kivalasztottTarolo) { showAlert('Kérlek válassz tárolót!'); return }
    if (!startDate || !endDate) { showAlert('Add meg a dátumokat!'); return }
    if (startDate > endDate) { showAlert('A kezdő dátum nem lehet nagyobb a vég dátumnál.'); return }

    setFoglalasLoading(true)

    try {
      const elRes = await fetch(`/api/Berles/elerhetoseg?kezdo_datum=${startDate}&veg_datum=${endDate}`)
      if (!elRes.ok) throw new Error(await elRes.text())
      const elerhetoseg = await elRes.json()

      if (!elerhetoseg.szabad_tarolo_azonok.includes(kivalasztottTarolo.taroloAzon)) {
        setOsszesTarolo(prev => prev.map(t =>
          t.taroloAzon === kivalasztottTarolo.taroloAzon ? { ...t, statusz: 'foglalt' } : t
        ))
        setKivalasztottTarolo(null)
        setShowPanel(false)
        setFoglalasLoading(false)
        showAlert('Ez a tároló már nem szabad a kiválasztott időszakban.\nKérlek válassz másik tárolót!')
        return
      }

      setFoglalasLoading(false)
      navigate('/fizetes', {
        state: {
          taroloAzon: kivalasztottTarolo.taroloAzon,
          kezdoDatum: startDate,
          vegDatum: endDate,
          napok,
          napiAr: kivalasztottTarolo.napiAr,
          osszeg,
          raktarNev: kivalasztottTarolo.raktarMegnevezes,
          kategoriaNev: kivalasztottTarolo.kategoriaNeve
        }
      })
    } catch (err) {
      console.error(err)
      setFoglalasLoading(false)
      showAlert('Hiba történt az ellenőrzés során.')
    }
  }
  const telephelyek = {}
  osszesTarolo.forEach(t => {
    if (!telephelyek[t.cimAzon]) {
      telephelyek[t.cimAzon] = { id: t.cimAzon, nev: t.raktarMegnevezes, tarolok: [] }
    }
    telephelyek[t.cimAzon].tarolok.push(t)
  })
  const kategoriak = {}
  if (kivalasztottTelephelyId) {
    osszesTarolo.filter(t => t.cimAzon === kivalasztottTelephelyId).forEach(t => {
      if (!kategoriak[t.arKategoriaAzon]) {
        kategoriak[t.arKategoriaAzon] = { nev: t.kategoriaNeve, napiAr: t.napiAr, tarolok: [] }
      }
      kategoriak[t.arKategoriaAzon].tarolok.push(t)
    })
  }

  const napok = szamolNapok()
  const osszeg = kivalasztottTarolo ? napok * kivalasztottTarolo.napiAr : 0

  return (
    <>
      <div className="container" style={{ paddingTop: '88px', paddingBottom: '60px' }}>
        <h1 className="text-center mb-2">
          <i className="fa-solid fa-box me-2" style={{ color: '#f87171' }}></i>Bérelhető tárolók
        </h1>
        <p className="text-center text-muted mb-3">
          Először válassz időtartamot, majd telephelyet, végül pedig egy szabad tárolót.
        </p>

        
        <div className="d-flex justify-content-center gap-4 mb-4 flex-wrap">
          <span>
            <span className="legend-szin" style={{ background: 'rgba(63,185,80,0.3)', border: '1.5px solid rgba(63,185,80,0.5)' }}></span>
            Szabad
          </span>
          <span>
            <span className="legend-szin" style={{ background: 'rgba(248,81,73,0.3)', border: '1.5px solid rgba(248,81,73,0.5)' }}></span>
            Foglalt
          </span>
          <span>
            <span className="legend-szin" style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)' }}></span>
            Karbantartás
          </span>
        </div>

        
        <div className="mb-4">
          <div className="step-indicator">
            <div className="step-badge">1</div>
            <h5 className="mb-0">Add meg a bérlés időtartamát</h5>
          </div>
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-5">
                  <label className="form-label">
                    <i className="fa-solid fa-calendar-days me-1 text-muted"></i>Kezdő dátum
                  </label>
                  <input ref={startRef} type="text" className="form-control" placeholder="Válassz kezdő dátumot" readOnly />
                </div>
                <div className="col-md-5">
                  <label className="form-label">
                    <i className="fa-solid fa-calendar-days me-1 text-muted"></i>Vég dátum
                  </label>
                  <input ref={endRef} type="text" className="form-control" placeholder="Válassz vég dátumot" readOnly />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <div className="text-muted small">
                    {datumStatus === 'loading' && <div className="spinner-border spinner-border-sm" role="status"></div>}
                    {datumStatus === 'ok' && '✅'}
                    {datumStatus === 'error' && <span className="text-danger">❌ Hibás</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        {step !== 'datum' && (
          <div className="mb-4" ref={telephely2Ref}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="step-indicator mb-0">
                <div className="step-badge">2</div>
                <h5 className="mb-0">Válassz telephelyet</h5>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                setStep('datum')
                setKivalasztottTelephelyId(null)
                setKivalasztottTarolo(null)
                setShowPanel(false)
              }}>← Dátum módosítás</button>
            </div>
            <div className="row g-3">
              {Object.values(telephelyek).map(teleph => {
                const szabad = teleph.tarolok.filter(t => t.statusz === 'szabad').length
                const osszes = teleph.tarolok.length
                return (
                  <div className="col-md-4" key={teleph.id}>
                    <div
                      className={`card shadow telephely-card h-100${kivalasztottTelephelyId === teleph.id ? ' kivalasztott' : ''}`}
                      onClick={() => valasztTelephelyt(teleph.id)}
                    >
                      <div className="card-body text-center py-4">
                        <div style={{ fontSize: '2.5rem', color: '#f87171' }}>
                          <i className="fa-solid fa-industry"></i>
                        </div>
                        <h5 className="mt-2 mb-1">{teleph.nev}</h5>
                        <p className="text-muted small mb-2">{osszes} tároló összesen</p>
                        <span className={`badge ${szabad > 0 ? 'bg-success' : 'bg-danger'} fs-6`}>
                          {szabad} szabad
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        
        {step === 'tarolok' && kivalasztottTelephelyId && (
          <div className="mb-4" ref={tarolok3Ref}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="step-indicator mb-0">
                <div className="step-badge">3</div>
                <h5 className="mb-0">Válassz tárolót</h5>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => {
                setStep('telephely')
                setKivalasztottTarolo(null)
                setShowPanel(false)
              }}>← Telephely csere</button>
            </div>

            {Object.entries(kategoriak)
              .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
              .map(([katId, kat]) => {
                const tipusLabel = parseInt(katId) === 1
                  ? <><i className="fa-solid fa-box me-1"></i> Basic</>
                  : <><i className="fa-solid fa-fire me-1"></i> Prémium</>
                const szabadDb = kat.tarolok.filter(t => t.statusz === 'szabad').length
                return (
                  <div className="card shadow-sm mb-3" key={katId}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <span className="fw-bold fs-5">{tipusLabel}</span>
                          <span className="text-muted ms-2 small">{kat.nev}</span>
                        </div>
                        <div className="text-end">
                          <span className="fw-bold">{kat.napiAr.toLocaleString('hu-HU')} Ft</span>
                          <span className="text-muted small"> / nap</span>
                          <br />
                          <span className="badge bg-success">{szabadDb} szabad</span>
                        </div>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {kat.tarolok.map(t => (
                          <div
                            key={t.taroloAzon}
                            className={`tarolo-doboz ${t.statusz}${kivalasztottTarolo?.taroloAzon === t.taroloAzon ? ' kivalasztott' : ''}`}
                            onClick={t.statusz === 'szabad' ? () => valasztTarolot(t) : undefined}
                            title={
                              t.statusz === 'szabad' ? `Tároló #${t.taroloAzon} — szabad`
                              : t.statusz === 'foglalt' ? `Tároló #${t.taroloAzon} — foglalt`
                              : `Tároló #${t.taroloAzon} — karbantartás alatt`
                            }
                          >
                            #{t.taroloAzon}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}

            
            {showPanel && kivalasztottTarolo && (
              <div className="mt-3" id="foglalas-panel">
                <div className="card shadow-sm" style={{ border: '1px solid #b91c1c' }}>
                  <div className="card-body">
                    <div className="alert alert-primary py-2 mb-3">
                      <strong>Kiválasztott tároló:</strong> #{kivalasztottTarolo.taroloAzon}
                      &nbsp;·&nbsp;
                      <strong>Típus:</strong> {kivalasztottTarolo.arKategoriaAzon === 1 ? 'Basic' : 'Prémium'}
                      &nbsp;·&nbsp;
                      <strong>Telephely:</strong> {kivalasztottTarolo.raktarMegnevezes}
                      &nbsp;·&nbsp;
                      <strong>Időszak:</strong> {startDate} – {endDate}
                    </div>
                    {napok > 0 && (
                      <div className="alert alert-success py-2 mb-3">
                        <i className="fa-solid fa-coins me-1"></i>
                        <strong>{napok} nap</strong> × {kivalasztottTarolo.napiAr.toLocaleString('hu-HU')} Ft =
                        <strong className="fs-5"> {osszeg.toLocaleString('hu-HU')} Ft</strong>
                      </div>
                    )}
                    <button
                      className="btn btn-primary btn-lg w-100"
                      onClick={bekuldFoglalas}
                      disabled={foglalasLoading}
                    >
                      {foglalasLoading
                        ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Ellenőrzés...</>
                        : <><i className="fa-solid fa-credit-card me-2"></i>Tovább a fizetéshez</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

