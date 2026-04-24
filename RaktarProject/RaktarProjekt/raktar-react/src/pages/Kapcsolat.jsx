export default function Kapcsolat() {
  return (
    <>
      
      <section className="hero text-center" style={{ padding: '60px 0 50px' }}>
        <div className="container">
          <h1 className="display-5 fw-bold">
            <i className="fa-solid fa-headset me-2"></i>Kapcsolat
          </h1>
          <p className="lead opacity-90">Kérdésed van? Szívesen segítünk!</p>
        </div>
      </section>

      
      <section className="container my-5">
        <div className="row g-4 justify-content-center">
          <div className="col-md-4">
            <div className="card shadow-sm contact-card h-100 p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="contact-icon-box"><i className="fa-solid fa-phone"></i></div>
                <div>
                  <div className="text-muted small fw-semibold text-uppercase">Telefon</div>
                  <h5 className="mb-0 fw-bold">+36 94 123 456</h5>
                </div>
              </div>
              <p className="text-muted mb-0 small">
                Telefonos ügyfélszolgálatunk <strong>hétfőtől vasárnapig 0–24 órában</strong> elérhető.
                Sürgős esetben hívj minket bármikor!
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm contact-card h-100 p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="contact-icon-box"><i className="fa-solid fa-envelope"></i></div>
                <div>
                  <div className="text-muted small fw-semibold text-uppercase">E-mail</div>
                  <h5 className="mb-0 fw-bold">info@raktarbeles.hu</h5>
                </div>
              </div>
              <p className="text-muted mb-0 small">
                E-mailben <strong>5 munkanapon belül</strong> válaszolunk minden megkeresésre.
                Sürgős esetben javasoljuk a telefonos elérhetőséget.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm contact-card h-100 p-4">
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="contact-icon-box"><i className="fa-solid fa-location-dot"></i></div>
                <div>
                  <div className="text-muted small fw-semibold text-uppercase">Székhely</div>
                  <h5 className="mb-0 fw-bold">Szombathely, Ipari út 1.</h5>
                </div>
              </div>
              <p className="text-muted mb-0 small">
                <strong>9700 Szombathely</strong><br />
                Személyes ügyintézés előzetes időpontegyeztetés alapján lehetséges.
              </p>
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-5" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <h2 className="fw-bold text-center mb-2">Raktáraink elérhetőségei</h2>
          <p className="text-center text-muted mb-4">Beléptetési rendszer 0–24 órában elérhető – jöhetsz bármikor</p>
          <div className="row g-4">
            {[
              { icon: 'fa-box', nev: 'Zala Raktár-Dél', cim: 'Zalaegerszeg, Ipari Park utca 4.', email: 'zala@raktarbeles.hu', maps: 'https://maps.google.com/maps?q=Zalaegerszeg+Ipari+Park+utca+4' },
              { icon: 'fa-industry', nev: 'Veszprémi Logisztikai Központ', cim: 'Veszprém, Logisztikai Centrum út 3.', email: 'veszprem@raktarbeles.hu', maps: 'https://maps.google.com/maps?q=Veszprém+Logisztikai+Centrum+ut+3' },
              { icon: 'fa-building', nev: 'Vas Telephely', cim: 'Szombathely, Hűtőház utca 5.', email: 'vas@raktarbeles.hu', maps: 'https://maps.google.com/maps?q=Szombathely+Hűtőház+utca+5' }
            ].map((h) => (
              <div className="col-md-4" key={h.nev}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <h5 className="fw-bold mb-1">
                      <i className={`fa-solid ${h.icon} me-2`} style={{ color: '#f87171' }}></i>{h.nev}
                    </h5>
                    <p className="text-muted small mb-3">{h.cim}</p>
                    <ul className="list-unstyled small mb-3">
                      <li className="mb-2"><i className="fa-solid fa-door-open text-success me-2"></i><strong>Beléptetési rendszer:</strong> 0–24 óra</li>
                      <li className="mb-2"><i className="fa-solid fa-phone text-muted me-2"></i><strong>Telefonos ügyfélszolgálat:</strong> H–V 0–24</li>
                      <li><i className="fa-solid fa-envelope text-muted me-2"></i>{h.email}</li>
                    </ul>
                    <a href={h.maps} target="_blank" rel="noreferrer" className="btn btn-sm w-100" style={{ color: '#f87171', borderColor: '#f87171' }}>
                      <i className="fa-solid fa-map me-1"></i>Útvonaltervezés
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm p-4" style={{ borderLeft: '4px solid #b91c1c', borderRadius: '12px' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="contact-icon-box" style={{ background: 'rgba(255,193,7,0.15)', color: '#ffc107' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h5 className="mb-0 fw-bold">Ha gondod akadt az oldallal</h5>
              </div>
              <p className="text-muted mb-3">
                Ha technikai problémát tapasztalsz (pl. nem tudsz bejelentkezni, nyitókód nem jelenik meg,
                foglalással kapcsolatos hiba), kérjük jelezd nekünk az alábbi elérhetőségeken:
              </p>
              <div className="row g-3">
                <div className="col-sm-6">
                  <a href="mailto:info@raktarbeles.hu" className="btn w-100" style={{ color: '#f87171', borderColor: '#f87171' }}>
                    <i className="fa-solid fa-envelope me-2"></i>E-mail küldése
                  </a>
                </div>
                <div className="col-sm-6">
                  <a href="tel:+3694123456" className="btn btn-outline-success w-100">
                    <i className="fa-solid fa-phone me-2"></i>Hívás: +36 94 123 456
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

