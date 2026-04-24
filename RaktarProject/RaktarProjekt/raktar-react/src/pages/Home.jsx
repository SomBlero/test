import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const galleryItems = [
  { title: 'Zárt tároló egység', desc: 'Egyéni lakat, biztonságos zárás – a te holmid csak a tied.', bg: 'linear-gradient(135deg, #1a3a5c 0%, #2d6a9f 100%)', icon: 'fa-door-closed' },
  { title: 'Prémium polcos tároló', desc: 'Klímatizált, polcos elrendezés – rendezetten tárolhatsz mindent.', bg: 'linear-gradient(135deg, #1a4a2e 0%, #2d9a5c 100%)', icon: 'fa-boxes-stacked' },
  { title: 'Raktárépület', desc: 'Modern ipari létesítmény, nappali portaszolgálattal.', bg: 'linear-gradient(135deg, #4a1a1a 0%, #9a2d2d 100%)', icon: 'fa-warehouse' },
  { title: 'Biztonsági rendszer', desc: 'Online nyitókód rendszer – bármikor, okostelefonról nyithatsz.', bg: 'linear-gradient(135deg, #2a1a4a 0%, #5a2d9a 100%)', icon: 'fa-lock' },
  { title: 'Klímatizált helyiség', desc: 'Prémium tárolók szabályozott hőmérséklettel, érzékeny tárgyak számára.', bg: 'linear-gradient(135deg, #1a3a1a 0%, #3d7a3d 100%)', icon: 'fa-temperature-half' },
  { title: 'Parkoló és megközelítés', desc: 'Tágas udvar, könnyű be- és kiszállítás teherautóval is.', bg: 'linear-gradient(135deg, #3a2a1a 0%, #8a6a2d 100%)', icon: 'fa-car' }
]

const heroStats = [
  { target: 30, suffix: '', label: 'Tároló egység' },
  { target: 3, suffix: '', label: 'Helyszín' },
  { target: 500, suffix: ' Ft', label: 'Napi ártól' },
  { target: 10, suffix: ' perc', label: 'Nyitókód lejárat' }
]

function useCounterAnimation(target, suffix, shouldStart) {
  const [value, setValue] = useState('0' + suffix)
  useEffect(() => {
    if (!shouldStart) return
    const duration = 1500
    const step = target / (duration / 16)
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        current = target
        clearInterval(timer)
      }
      setValue(Math.floor(current) + suffix)
    }, 16)
    return () => clearInterval(timer)
  }, [shouldStart, target, suffix])
  return value
}

function HeroStats() {
  const heroRef = useRef(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setStarted(true)
        observer.disconnect()
      }
    })
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  const v0 = useCounterAnimation(heroStats[0].target, heroStats[0].suffix, started)
  const v1 = useCounterAnimation(heroStats[1].target, heroStats[1].suffix, started)
  const v2 = useCounterAnimation(heroStats[2].target, heroStats[2].suffix, started)
  const v3 = useCounterAnimation(heroStats[3].target, heroStats[3].suffix, started)
  const values = [v0, v1, v2, v3]

  return (
    <div ref={heroRef} className="row justify-content-center mt-4 g-3">
      {heroStats.map((stat, i) => (
        <div key={stat.label} className="col-auto">
          <div className="hero-stat">
            <div className="hero-stat-value">{values[i]}</div>
            <div className="hero-stat-label">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)

  const item = galleryItems[currentIdx]

  function openGallery(idx) {
    setCurrentIdx(idx)
    setGalleryOpen(true)
  }

  function prevGallery() { setCurrentIdx((currentIdx - 1 + galleryItems.length) % galleryItems.length) }
  function nextGallery() { setCurrentIdx((currentIdx + 1) % galleryItems.length) }

  useEffect(() => {
    function onKey(e) {
      if (!galleryOpen) return
      if (e.key === 'Escape') setGalleryOpen(false)
      if (e.key === 'ArrowLeft') prevGallery()
      if (e.key === 'ArrowRight') nextGallery()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [galleryOpen, currentIdx])

  return (
    <>
      
      <section className="hero text-center">
        <div className="container">
          <h1 className="display-5 fw-bold">Raktárhelyiségek bérlése egyszerűen</h1>
          <p className="lead opacity-90 mb-4">Biztonságos, modern, online foglalható tárolók Nyugat-Dunántúlon</p>
          <HeroStats />
        </div>
      </section>

      
      <section className="py-5" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 className="text-center fw-bold mb-2">Hogyan működik?</h2>
          <p className="text-center text-muted mb-5">Egyszerű 3 lépés a saját tárolódig</p>
          <div className="row g-4 text-center justify-content-center">
            {[
              { num: 1, title: 'Regisztrálj', desc: 'Hozz létre fiókot néhány perc alatt, és férj hozzá az összes szabad tárolóhoz.', bg: 'linear-gradient(135deg, #991b1b, #dc2626)', shadow: 'rgba(220,38,38,0.45)' },
              { num: 2, title: 'Foglald le', desc: 'Válaszd ki a neked megfelelő helyszínt, tároló típust és időszakot.', bg: 'linear-gradient(135deg, #92400e, #d97706)', shadow: 'rgba(217,119,6,0.45)' },
              { num: 3, title: 'Nyisd meg', desc: 'A bérlés ideje alatt bármikor kérhetsz online nyitókódot – 10 percig érvényes.', bg: 'linear-gradient(135deg, #14532d, #16a34a)', shadow: 'rgba(22,163,74,0.45)' }
            ].map(s => (
              <div key={s.num} className="col-md-4">
                <div className="how-step">
                  <div className="how-step-icon" style={{ background: s.bg, boxShadow: `0 4px 14px ${s.shadow}` }}>{s.num}</div>
                  <h5 className="fw-bold mt-3">{s.title}</h5>
                  <p className="text-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="container my-5">
        <h2 className="mb-2 text-center fw-bold">Elérhető tároló kategóriák</h2>
        <p className="text-center text-muted mb-4">Válaszd ki az igényeidnek megfelelő tárolót</p>
        <div className="row justify-content-center g-4">
          
          <div className="col-md-6 col-lg-4">
            <div className="card shadow-sm h-100 text-center border-0 category-card">
              <div className="card-body d-flex flex-column p-4">
                <div className="mb-3">
                  <span className="badge fs-6 px-3 py-2" style={{ backgroundColor: '#b91c1c' }}>
                    <i className="fa-solid fa-box me-1"></i> Basic tároló
                  </span>
                </div>
                <div className="mb-1">
                  <span className="display-6 fw-bold">500 Ft</span>
                  <span className="text-muted">/nap</span>
                </div>
                <p className="text-muted mb-3">6 m² alapterület</p>
                <ul className="list-unstyled text-start mb-4">
                  <li className="py-2 border-bottom"><i className="fa-solid fa-check text-success me-2"></i>Száraz, zárt tároló</li>
                  <li className="py-2 border-bottom"><i className="fa-solid fa-check text-success me-2"></i>Egyéni lakat lehetőség</li>
                  <li className="py-2 border-bottom"><i className="fa-solid fa-check text-success me-2"></i>Megfelelő megvilágítás</li>
                  <li className="py-2"><i className="fa-solid fa-check text-success me-2"></i>Online nyitókód rendszer</li>
                </ul>
                <Link to="/tarolok" className="btn btn-primary w-100 mt-auto">Foglalás</Link>
              </div>
            </div>
          </div>

          
          <div className="col-md-6 col-lg-4">
            <div className="card shadow h-100 text-center border-0 category-card category-card-premium">
              <div className="card-body d-flex flex-column p-4">
                <div className="d-flex justify-content-end mb-2 premium-recommended-wrap">
                  <span className="badge bg-warning text-dark premium-recommended-badge">
                    <i className="fa-solid fa-star"></i>
                    <span className="premium-tooltip">Ajánlott</span>
                  </span>
                </div>
                <div className="mb-3">
                  <span className="badge fs-6 px-3 py-2" style={{ backgroundColor: '#ea580c' }}>
                    <i className="fa-solid fa-fire me-1"></i> Prémium tároló
                  </span>
                </div>
                <div className="mb-1">
                  <span className="display-6 fw-bold">600 Ft</span>
                  <span className="text-muted">/nap</span>
                </div>
                <p className="text-muted mb-3">6 m² alapterület</p>
                <ul className="list-unstyled text-start mb-4">
                  <li className="py-2 border-bottom"><i className="fa-solid fa-check text-success me-2"></i>Klímatizált helyiség</li>
                  <li className="py-2 border-bottom"><i className="fa-solid fa-check text-success me-2"></i>Polcos felszereltség</li>
                  <li className="py-2 border-bottom"><i className="fa-solid fa-check text-success me-2"></i>Jobb megvilágítás</li>
                  <li className="py-2"><i className="fa-solid fa-check text-success me-2"></i>Online nyitókód rendszer</li>
                </ul>
                <Link to="/tarolok" className="btn w-100 mt-auto" style={{ backgroundColor: '#ea580c', borderColor: '#c2410c', color: '#fff' }}>Foglalás</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-5" style={{ background: 'var(--bg-card)' }}>
        <div className="container">
          <h2 className="text-center fw-bold mb-2">Tárolóink bemutatása</h2>
          <p className="text-center text-muted mb-4">Modern, biztonságos és könnyen hozzáférhető helyiségek</p>
          <div className="row g-4">
            {galleryItems.map((g, i) => (
              <div key={i} className="col-md-4">
                <div className="showcase-card" onClick={() => openGallery(i)}>
                  <div className="showcase-img" style={{ background: g.bg }}>
                    <i className={`fa-solid ${g.icon} showcase-img-icon`}></i>
                    <div className="showcase-img-overlay"><i className="fa-solid fa-magnifying-glass-plus"></i></div>
                  </div>
                  <div className="showcase-body">
                    <h6 className="fw-bold mb-1">{g.title}</h6>
                    <p className="text-muted small mb-0">{g.desc.split('–')[0].trim()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {galleryOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={(e) => { if (e.target === e.currentTarget) setGalleryOpen(false) }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content bg-dark text-white border-0">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title">{item.title}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setGalleryOpen(false)}></button>
              </div>
              <div className="modal-body text-center p-4">
                <div style={{ height: '350px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: item.bg }}>
                  <i className={`fa-solid ${item.icon}`} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '6rem' }}></i>
                </div>
                <p className="mt-3 text-white-50">{item.desc}</p>
              </div>
              <div className="modal-footer border-0 pt-0 justify-content-between">
                <button className="btn btn-outline-light btn-sm" onClick={prevGallery}>
                  <i className="fa-solid fa-chevron-left me-1"></i>Előző
                </button>
                <button className="btn btn-outline-light btn-sm" onClick={nextGallery}>
                  Következő<i className="fa-solid fa-chevron-right ms-1"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      
      <section className="py-5" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 className="text-center fw-bold mb-2">
            <i className="fa-solid fa-location-dot me-2" style={{ color: '#f87171' }}></i>Tárolóink helyszínei
          </h2>
          <p className="text-center text-muted mb-4">Kattints egy helyszínre a részletek és a térkép megtekintéséhez</p>

          <div className="accordion accordion-flush" id="helyszinAccordion">
            {[
              { id: 'zala', icon: 'fa-box', nev: 'Zala Raktár-Dél', varos: 'Zalaegerszeg', cim: 'Zalaegerszeg, Ipari Park utca 4.', leiras: 'Zala megye déli részén elhelyezkedő modern raktártelep, könnyen megközelíthető az autópályáról.', mapsEmbed: 'https://maps.google.com/maps?q=Zalaegerszeg+Ipari+Park&output=embed&hl=hu', mapsLink: 'https://maps.google.com/maps?q=Zalaegerszeg+Ipari+Park+utca+4' },
              { id: 'veszprem', icon: 'fa-industry', nev: 'Veszprémi Logisztikai Központ', varos: 'Veszprém', cim: 'Veszprém, Logisztikai Centrum út 3.', leiras: 'Veszprém iparterületén lévő korszerű logisztikai létesítmény, közel az M8-as autópályához.', mapsEmbed: 'https://maps.google.com/maps?q=Veszprém+Ipari+Park&output=embed&hl=hu', mapsLink: 'https://maps.google.com/maps?q=Veszprém+Logisztikai+Centrum+ut+3' },
              { id: 'vas', icon: 'fa-building', nev: 'Vas Telephely', varos: 'Szombathely', cim: 'Szombathely, Hűtőház utca 5.', leiras: 'Szombathely ipari negyedének szívében elhelyezkedő, biztonságos és könnyen megközelíthető raktárkomplexum.', mapsEmbed: 'https://maps.google.com/maps?q=Szombathely+Hűtőház+utca&output=embed&hl=hu', mapsLink: 'https://maps.google.com/maps?q=Szombathely+Hűtőház+utca+5' }
            ].map(h => (
              <div key={h.id} className="accordion-item location-accordion-item mb-3">
                <h2 className="accordion-header">
                  <button className="accordion-button collapsed location-accordion-btn" type="button"
                    data-bs-toggle="collapse" data-bs-target={`#${h.id}`} aria-expanded="false">
                    <span className="location-icon me-3"><i className={`fa-solid ${h.icon}`}></i></span>
                    <div>
                      <strong className="d-block">{h.nev}</strong>
                      <small className="text-muted">{h.varos} &nbsp;•&nbsp; 10 tároló egység</small>
                    </div>
                    <span className="ms-auto me-3 badge bg-success">
                      <i className="fa-solid fa-circle-check me-1"></i>Elérhető
                    </span>
                  </button>
                </h2>
                <div id={h.id} className="accordion-collapse collapse" data-bs-parent="#helyszinAccordion">
                  <div className="accordion-body pt-4">
                    <div className="row g-4 align-items-start">
                      <div className="col-md-5">
                        <h5 className="fw-bold"><i className="fa-solid fa-location-dot text-danger me-2"></i>{h.cim}</h5>
                        <p className="text-muted">{h.leiras}</p>
                        <div className="row g-2 mb-4">
                          <div className="col-6">
                            <div className="location-cat-box location-cat-basic">
                              <div className="fw-bold mb-1" style={{ color: '#f87171' }}><i className="fa-solid fa-box me-1"></i>Basic</div>
                              <div className="small fw-semibold">5 egység • 500 Ft/nap</div>
                              <ul className="list-unstyled small mt-2 mb-0 text-muted">
                                <li><i className="fa-solid fa-minus me-1"></i>Száraz, zárt tároló</li>
                                <li><i className="fa-solid fa-minus me-1"></i>Egyéni lakat</li>
                              </ul>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="location-cat-box location-cat-premium">
                              <div className="fw-bold text-warning mb-1"><i className="fa-solid fa-fire me-1"></i>Prémium</div>
                              <div className="small fw-semibold">5 egység • 600 Ft/nap</div>
                              <ul className="list-unstyled small mt-2 mb-0 text-muted">
                                <li><i className="fa-solid fa-minus me-1"></i>Klímatizált</li>
                                <li><i className="fa-solid fa-minus me-1"></i>Polcos felszerelt</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <Link to="/tarolok" className="btn btn-primary">Szabad tárolók megtekintése <i className="fa-solid fa-arrow-right ms-1"></i></Link>
                      </div>
                      <div className="col-md-7">
                        <iframe src={h.mapsEmbed} style={{ width: '100%', height: '300px', border: '0', borderRadius: '10px' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title={h.nev}></iframe>
                        <div className="mt-2 text-center">
                          <a href={h.mapsLink} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-secondary">
                            <i className="fa-solid fa-map me-1"></i>Megnyitás Google Térképen
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

