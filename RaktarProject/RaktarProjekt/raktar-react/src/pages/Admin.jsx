import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/admin-style.css'

function getAuthHeaders(token) {
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

function MegyekSection({ token }) {
  const [megyek, setMegyek] = useState([])
  const [ujNev, setUjNev] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/Megye')
    if (res.ok) setMegyek(await res.json())
  }, [])

  useEffect(() => { load() }, [load])

  async function add() {
    if (!ujNev.trim()) return
    await fetch('/api/Megye', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nev: ujNev }) })
    setUjNev('')
    load()
  }

  async function del(id) {
    if (!window.confirm('Törlöd?')) return
    await fetch(`/api/Megye/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <section id="megyek" className="content-section active">
      <h2>Megyék kezelése</h2>
      <div className="card p-4 mb-4">
        <div className="row g-3">
          <div className="col-auto">
            <input type="text" className="form-control" placeholder="Megye neve" value={ujNev} onChange={e => setUjNev(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
          </div>
          <div className="col-auto">
            <button className="btn btn-primary" onClick={add}>Mentés</button>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <table className="table mb-0">
          <thead className="table-light">
            <tr><th>ID</th><th>Név</th><th className="text-end">Műveletek</th></tr>
          </thead>
          <tbody>
            {megyek.map(m => (
              <tr key={m.megyeAzon}>
                <td>{m.megyeAzon}</td>
                <td>{m.nev}</td>
                <td className="text-end">
                  <button className="btn btn-outline-danger btn-sm" onClick={() => del(m.megyeAzon)}>Törlés</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function UgyfelekSection({ token }) {
  const [ugyfelek, setUgyfelek] = useState([])
  const [form, setForm] = useState({ nev: '', email: '', telefonszam: '', jelszoHash: '' })
  const [showAdminPw, setShowAdminPw] = useState(false)
  const [roleMap, setRoleMap] = useState({})

  const load = useCallback(async () => {
    const res = await fetch('/api/Ugyfel', { headers: getAuthHeaders(token) })
    if (res.ok) {
      const data = await res.json()
      setUgyfelek(data)
      const map = {}
      data.forEach(u => { map[u.ugyfelAzon] = u.role || 'user' })
      setRoleMap(map)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function add() {
    await fetch('/api/Ugyfel', { method: 'POST', headers: getAuthHeaders(token), body: JSON.stringify(form) })
    setForm({ nev: '', email: '', telefonszam: '', jelszoHash: '' })
    load()
  }

  async function updateRole(id) {
    const role = roleMap[id]
    if (!role) return
    const res = await fetch(`/api/Ugyfel/${id}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ role })
    })
    if (res.ok) { load(); return }
    if (res.status === 401 || res.status === 403) { window.alert('Nincs jogosultságod szerepkör módosítására.'); return }
    try {
      const details = await res.json()
      window.alert(details?.message || 'A szerepkör mentése sikertelen.')
    } catch { window.alert('A szerepkör mentése sikertelen.') }
  }

  async function del(id) {
    if (!window.confirm('Törlöd az ügyfelet?')) return
    const res = await fetch(`/api/Ugyfel/${id}`, { method: 'DELETE', headers: getAuthHeaders(token) })
    if (res.ok) { load(); return }
    if (res.status === 500) window.alert('Nem sikerült törölni az ügyfelet!\n\nLehetséges ok: Az ügyfélnek vannak bérlései.\nElőször töröld a bérléseit a \'Bérlések\' menüpontban.')
    else window.alert('Hiba történt a törlés során: ' + await res.text())
  }

  return (
    <section id="ugyfelek" className="content-section active">
      <h2>Ügyfelek kezelése</h2>
      <div className="card p-4 mb-4">
        <div className="row g-3">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Név"
              value={form.nev} onChange={e => setForm(f => ({ ...f, nev: e.target.value }))} />
          </div>
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Email"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="col-md-2">
            <input type="tel" className="form-control" placeholder="Telefon"
              autoComplete="off" data-lpignore="true" data-1p-ignore data-bwignore
              value={form.telefonszam}
              onChange={e => {
                const raw = e.target.value
                if (raw.includes('@')) { setForm(f => ({ ...f, telefonszam: '' })); return }
                const v = raw.replace(/[^\d+]/g, '')
                setForm(f => ({ ...f, telefonszam: v }))
              }} />
          </div>
          <div className="col-md-2">
            <div className="input-group">
              <input type={showAdminPw ? 'text' : 'password'} className="form-control" placeholder="Jelszó"
                value={form.jelszoHash} onChange={e => setForm(f => ({ ...f, jelszoHash: e.target.value }))} />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAdminPw(v => !v)} tabIndex={-1}>
                <i className={`fa-solid ${showAdminPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>
          <div className="col-md-2">
            <button className="btn btn-success w-100" onClick={add}>Hozzáadás</button>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <table className="table mb-0">
          <thead className="table-light">
            <tr><th>ID</th><th>Név</th><th>Email</th><th>Telefon</th><th>Jogosultság</th><th className="text-end">Műveletek</th></tr>
          </thead>
          <tbody>
            {ugyfelek.map(u => (
              <tr key={u.ugyfelAzon}>
                <td>{u.ugyfelAzon}</td>
                <td><strong>{u.nev}</strong></td>
                <td>{u.email}</td>
                <td>{u.telefonszam || '-'}</td>
                <td>
                  <div className="d-flex gap-2 align-items-center">
                    <select
                      className="form-select form-select-sm"
                      style={{ maxWidth: '140px' }}
                      value={roleMap[u.ugyfelAzon] || 'user'}
                      onChange={e => setRoleMap(m => ({ ...m, [u.ugyfelAzon]: e.target.value }))}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <button className="btn btn-outline-primary btn-sm" onClick={() => updateRole(u.ugyfelAzon)}>Mentés</button>
                  </div>
                </td>
                <td className="text-end">
                  <button className="btn btn-outline-danger btn-sm" onClick={() => del(u.ugyfelAzon)}>Törlés</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RaktarakSection({ token }) {
  const [raktarak, setRaktarak] = useState([])
  const [megyek, setMegyek] = useState([])
  const [form, setForm] = useState({ megnevezes: '', megyeAzon: '', raktarCim: '' })

  const load = useCallback(async () => {
    const [rRes, mRes] = await Promise.all([fetch('/api/Raktar'), fetch('/api/Megye')])
    if (rRes.ok) setRaktarak(await rRes.json())
    if (mRes.ok) setMegyek(await mRes.json())
  }, [])

  useEffect(() => { load() }, [load])

  async function add() {
    if (!form.megnevezes || !form.megyeAzon) { window.alert('Név és Megye kiválasztása kötelező!'); return }
    await fetch('/api/Raktar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ megnevezes: form.megnevezes, megyeAzon: parseInt(form.megyeAzon), raktarCim: form.raktarCim })
    })
    setForm({ megnevezes: '', megyeAzon: '', raktarCim: '' })
    load()
  }

  async function del(id) {
    if (!window.confirm('Biztosan törlöd ezt a raktárépületet?')) return
    await fetch(`/api/Raktar/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <section id="raktarak" className="content-section active">
      <h2>Raktárak kezelése</h2>
      <div className="card p-4 mb-4 shadow-sm">
        <h5>Új raktár hozzáadása</h5>
        <div className="row g-3">
          <div className="col-md-3">
            <input type="text" className="form-control" placeholder="Raktár neve (pl. Északi telep)" value={form.megnevezes} onChange={e => setForm(f => ({ ...f, megnevezes: e.target.value }))} />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={form.megyeAzon} onChange={e => setForm(f => ({ ...f, megyeAzon: e.target.value }))}>
              <option value="">Válassz megyét...</option>
              {megyek.map(m => <option key={m.megyeAzon} value={m.megyeAzon}>{m.nev}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <input type="text" className="form-control" placeholder="Cím (Város, utca...)" value={form.raktarCim} onChange={e => setForm(f => ({ ...f, raktarCim: e.target.value }))} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-primary w-100" onClick={add}>Mentés</button>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <table className="table mb-0">
          <thead className="table-light">
            <tr><th>ID</th><th>Megnevezés</th><th>Megye</th><th>Cím</th><th className="text-end">Műveletek</th></tr>
          </thead>
          <tbody>
            {raktarak.map(r => (
              <tr key={r.cimAzon}>
                <td>{r.cimAzon}</td>
                <td><strong>{r.megnevezes || 'Névtelen'}</strong></td>
                <td><span className="badge bg-info text-dark">{r.megyeNev}</span></td>
                <td>{r.raktarCim}</td>
                <td className="text-end">
                  <button className="btn btn-outline-danger btn-sm" onClick={() => del(r.cimAzon)}>Törlés</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TarolokSection({ token }) {
  const [tarolok, setTarolok] = useState([])
  const [raktarak, setRaktarak] = useState([])
  const [arKategoriak, setArKategoriak] = useState([])
  const [form, setForm] = useState({ cimAzon: '', arKategoriaAzon: '' })

  const load = useCallback(async () => {
    const [tRes, rRes, aRes] = await Promise.all([
      fetch('/api/TaroloHelyiseg/admin/reszletes'),
      fetch('/api/Raktar'),
      fetch('/api/ArKategoria')
    ])
    if (tRes.ok) setTarolok(await tRes.json())
    if (rRes.ok) setRaktarak(await rRes.json())
    if (aRes.ok) setArKategoriak(await aRes.json())
  }, [])

  useEffect(() => { load() }, [load])

  async function add() {
    if (!form.cimAzon || !form.arKategoriaAzon) { window.alert('Válassz raktárat és kategóriát is!'); return }
    await fetch('/api/TaroloHelyiseg', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cimAzon: parseInt(form.cimAzon), arKategoriaAzon: parseInt(form.arKategoriaAzon) })
    })
    load()
  }

  async function toggleKarbantartas(id, bekapcsol) {
    const uzenet = bekapcsol ? 'Biztosan karbantartásba állítod ezt a tárolót?' : 'Biztosan befejezed a karbantartást?'
    if (!window.confirm(uzenet)) return
    const res = await fetch(`/api/TaroloHelyiseg/${id}/karbantartas`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ karbantartas: bekapcsol })
    })
    if (res.ok) load()
    else window.alert('Hiba: ' + await res.text())
  }

  async function del(id) {
    if (!window.confirm('Biztosan törlöd ezt a tárolót?')) return
    await fetch(`/api/TaroloHelyiseg/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <section id="tarolok" className="content-section active">
      <h2>Tároló helyiségek kezelése</h2>
      <div className="card p-4 mb-4 shadow-sm">
        <h5>Új tároló egység létrehozása</h5>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Raktár kiválasztása</label>
            <select className="form-select" value={form.cimAzon} onChange={e => setForm(f => ({ ...f, cimAzon: e.target.value }))}>
              <option value="">-- Válassz raktárat --</option>
              {raktarak.map(r => <option key={r.cimAzon} value={r.cimAzon}>{r.megnevezes}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Árkategória / Méret</label>
            <select className="form-select" value={form.arKategoriaAzon} onChange={e => setForm(f => ({ ...f, arKategoriaAzon: e.target.value }))}>
              <option value="">-- Válassz kategóriát --</option>
              {arKategoriak.map(a => <option key={a.arKategoriaAzon} value={a.arKategoriaAzon}>{a.kategoriaNeve} ({a.alapArNaponta} Ft/nap)</option>)}
            </select>
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <button className="btn btn-primary w-100" onClick={add}>Tároló mentése</button>
          </div>
        </div>
      </div>
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0 table-hover">
            <thead className="table-light">
              <tr><th>ID</th><th>Raktár</th><th>Kategória</th><th>Napi ár</th><th>Státusz</th><th>Aktuális bérlő</th><th>Következő foglalás</th><th className="text-end">Műveletek</th></tr>
            </thead>
            <tbody>
              {tarolok.map(t => {
                let statuszBadge
                if (t.tenylegesStatusz === 'karbantartas') statuszBadge = <span className="badge bg-warning text-dark">🔧 Karbantartás</span>
                else if (t.tenylegesStatusz === 'foglalt') statuszBadge = <span className="badge bg-danger">🔴 Foglalt</span>
                else statuszBadge = <span className="badge bg-success">🟢 Szabad</span>

                let aktualisInfo = '-'
                if (t.aktualisBerloNev) {
                  const kezdet = t.aktualisBerlesKezdet ? new Date(t.aktualisBerlesKezdet).toLocaleDateString('hu-HU') : '?'
                  const veg = t.aktualisBerlesVeg
                    ? (t.aktualisBerlesVeg.startsWith('2099') ? 'Folyamatos' : new Date(t.aktualisBerlesVeg).toLocaleDateString('hu-HU'))
                    : '?'
                  aktualisInfo = <><strong>{t.aktualisBerloNev}</strong><br /><small className="text-muted">{kezdet} → {veg}</small></>
                }

                let kovetkezoInfo = '-'
                if (t.kovetkezoBerloNev) {
                  const kezdet = t.kovetkezoBerlesKezdet ? new Date(t.kovetkezoBerlesKezdet).toLocaleDateString('hu-HU') : '?'
                  const veg = t.kovetkezoBerlesVeg
                    ? (t.kovetkezoBerlesVeg.startsWith('2099') ? 'Folyamatos' : new Date(t.kovetkezoBerlesVeg).toLocaleDateString('hu-HU'))
                    : '?'
                  kovetkezoInfo = <><strong>{t.kovetkezoBerloNev}</strong><br /><small className="text-muted">{kezdet} → {veg}</small></>
                }

                return (
                  <tr key={t.taroloAzon}>
                    <td><strong>#{t.taroloAzon}</strong></td>
                    <td>{t.raktarMegnevezes}</td>
                    <td>{t.kategoriaNeve}</td>
                    <td>{(t.napiAr || 0).toLocaleString('hu-HU')} Ft</td>
                    <td>{statuszBadge}</td>
                    <td>{aktualisInfo}</td>
                    <td>{kovetkezoInfo}</td>
                    <td className="text-end text-nowrap">
                      {t.dbStatusz === 'karbantartas'
                        ? <button className="btn btn-sm btn-success me-1" onClick={() => toggleKarbantartas(t.taroloAzon, false)} title="Karbantartás befejezése">✓ Kész</button>
                        : <button className="btn btn-sm btn-outline-warning me-1" onClick={() => toggleKarbantartas(t.taroloAzon, true)} title="Karbantartásba állítás">🔧</button>
                      }
                      <button className="btn btn-outline-danger btn-sm" onClick={() => del(t.taroloAzon)}>Törlés</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function BerlesekSection({ token }) {
  const [berlesek, setBerlesek] = useState([])
  const [ugyfelek, setUgyfelek] = useState([])
  const [tarolok, setTarolok] = useState([])
  const [kereses, setKereses] = useState('')
  const [lezarModal, setLezarModal] = useState(false)
  const [lezarId, setLezarId] = useState(null)
  const [lezarLoading, setLezarLoading] = useState(false)
  const [form, setForm] = useState({ ugyfelAzon: '', taroloAzon: '', kezdoDatum: '', vegDatum: '' })

  const load = useCallback(async () => {
    const [bRes, uRes, tRes] = await Promise.all([
      fetch('/api/Berles', { headers: getAuthHeaders(token) }),
      fetch('/api/Ugyfel', { headers: getAuthHeaders(token) }),
      fetch('/api/TaroloHelyiseg')
    ])
    if (bRes.ok) setBerlesek(await bRes.json())
    if (uRes.ok) setUgyfelek(await uRes.json())
    if (tRes.ok) {
      const data = await tRes.json()
      setTarolok(data.filter(t => {
        const s = t.statusz || t.Statusz
        return s && s.trim().toLowerCase() === 'szabad'
      }))
    }
  }, [token])

  useEffect(() => { load() }, [load])

  const today = new Date().toISOString().split('T')[0]

  async function add() {
    if (!form.ugyfelAzon || !form.taroloAzon || !form.kezdoDatum) {
      window.alert('Ügyfél, tároló és kezdő dátum kötelező!')
      return
    }
    const ujBerles = {
      Ugyfel_Azon: parseInt(form.ugyfelAzon),
      Tarolo_Azon: parseInt(form.taroloAzon),
      KezdoDatum: form.kezdoDatum,
      VegDatum: form.vegDatum || '2099-12-31',
      Osszeg: 0,
      BerlesStatusz: 'aktiv'
    }
    const res = await fetch('/api/Berles/admin', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(ujBerles)
    })
    if (res.ok) {
      window.alert('Sikeres mentés!')
      setForm(f => ({ ...f, kezdoDatum: '', vegDatum: '' }))
      load()
    } else {
      let hiba = 'Ismeretlen hiba történt.'
      try {
        const d = await res.json()
        hiba = d.message || d.error || JSON.stringify(d.errors || d)
      } catch { hiba = await res.text() }
      window.alert('Hiba: ' + hiba)
    }
  }

  function openLezarModal(id) {
    setLezarId(id)
    setLezarModal(true)
  }

  async function megerositLezaras() {
    if (!lezarId || lezarLoading) return

    setLezarLoading(true)
    try {
      const res = await fetch(`/api/Berles/${lezarId}/lezaras`, { method: 'PUT', headers: getAuthHeaders(token) })
      if (!res.ok) {
        let hiba = `Hiba történt a zárolás során. (${res.status})`
        try {
          const txt = await res.text()
          if (txt) hiba = txt
        } catch { }
        window.alert(hiba)
        return
      }

      setLezarModal(false)
      setLezarId(null)
      await load()
    } catch {
      window.alert('Hálózati hiba történt a zárolás közben.')
    } finally {
      setLezarLoading(false)
    }
  }

  async function del(id) {
    if (!window.confirm('Biztosan törlöd ezt a bérlést?')) return
    const res = await fetch(`/api/Berles/admin/${id}`, { method: 'DELETE', headers: getAuthHeaders(token) })
    if (res.ok) load()
    else window.alert(`Hiba a törlésnél! (${res.status}): ${await res.text()}`)
  }

  const szurtBerlesek = berlesek.filter(b =>
    (b.ugyfelNev || '').toLowerCase().includes(kereses.toLowerCase())
  )

  return (
    <section id="berlesek" className="content-section active">
      {lezarModal && (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-label="Bérlés zárolása">
          <div className="admin-modal-card">
            <h5 className="mb-2">Bérlés zárolása</h5>
            <p className="mb-3 text-secondary">Biztosan zárolod ezt a bérlést? A kezdő és végdátum változatlan marad.</p>
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  if (lezarLoading) return
                  setLezarModal(false)
                  setLezarId(null)
                }}
                disabled={lezarLoading}
              >
                Mégse
              </button>
              <button className="btn btn-warning" onClick={megerositLezaras} disabled={lezarLoading}>
                {lezarLoading ? 'Zárolás...' : 'Zárolás'}
              </button>
            </div>
          </div>
        </div>
      )}

      <h2>Bérlések adminisztrációja</h2>
      <div className="card p-3 mb-3 shadow-sm bg-light">
        <div className="row align-items-center">
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text">Keresés</span>
              <input
                type="text"
                className="form-control"
                placeholder="Ügyfél neve..."
                value={kereses}
                onChange={e => setKereses(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-8 text-secondary small">Gépelj az ügyfél nevének kereséséhez a listában.</div>
        </div>
      </div>

      <div className="card p-4 shadow-sm">
        <div className="card p-4 mb-4 shadow-sm">
          <h5>Új bérlés rögzítése</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Ügyfél</label>
              <select className="form-select" value={form.ugyfelAzon} onChange={e => setForm(f => ({ ...f, ugyfelAzon: e.target.value }))}>
                <option value="">-- Ügyfél választása --</option>
                {ugyfelek.map(u => <option key={u.ugyfelAzon} value={u.ugyfelAzon}>{u.nev}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Tároló egység</label>
              <select className="form-select" value={form.taroloAzon} onChange={e => setForm(f => ({ ...f, taroloAzon: e.target.value }))}>
                <option value="">-- Tároló választása --</option>
                {tarolok.length === 0
                  ? <option value="" disabled>Nincs szabad tároló!</option>
                  : tarolok.map(t => {
                    const id = t.taroloAzon || t.TaroloAzon
                    const raktar = t.raktarMegnevezes || t.RaktarMegnevezes
                    const kat = t.kategoriaNeve || t.KategoriaNeve
                    return <option key={id} value={id}>{raktar} - {kat}</option>
                  })
                }
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Kezdete</label>
              <input type="date" className="form-control" min={today} value={form.kezdoDatum}
                onChange={e => {
                  const val = e.target.value
                  setForm(f => ({
                    ...f,
                    kezdoDatum: val,
                    vegDatum: f.vegDatum && f.vegDatum < val ? '' : f.vegDatum
                  }))
                }} />
            </div>
            <div className="col-md-2">
              <label className="form-label">Vége (opcionális)</label>
              <input type="date" className="form-control" min={form.kezdoDatum || today} value={form.vegDatum}
                onChange={e => setForm(f => ({ ...f, vegDatum: e.target.value }))} />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button className="btn btn-dark w-100" onClick={add}>Bérlés mentése</button>
            </div>
          </div>
        </div>

        <div className="card shadow-sm">
          <table className="table mb-0">
            <thead className="table-light">
              <tr><th>ID</th><th>Ügyfél</th><th>Raktár / Tároló</th><th>Kezdés</th><th>Vége</th><th className="text-end">Összeg</th><th className="text-end">Műveletek</th></tr>
            </thead>
            <tbody>
              {szurtBerlesek.length === 0
                ? <tr><td colSpan="7" className="text-center">Nincs megjeleníthető bérlés.</td></tr>
                : szurtBerlesek.map(b => {
                  const kezdes = b.kezdoDatum ? new Date(b.kezdoDatum).toLocaleDateString('hu-HU') : '-'
                  const vegeSzoveg = b.vegDatum && !b.vegDatum.startsWith('2099')
                    ? new Date(b.vegDatum).toLocaleDateString('hu-HU')
                    : 'Folyamatban'
                  const statusz = (b.berlesStatusz || '').toLowerCase()
                  const statuszBadge = statusz === 'aktiv'
                    ? <span className="badge bg-success ms-2">Aktív</span>
                    : statusz === 'fuggoben'
                      ? <span className="badge bg-warning text-dark ms-2">Függőben</span>
                      : (statusz === 'zarolt' || statusz === 'torolt')
                        ? <span className="badge bg-dark ms-2">Zárolt</span>
                        : statusz === 'lejart'
                          ? <span className="badge bg-secondary ms-2">Lejárt</span>
                          : <span className="badge bg-secondary ms-2">{b.berlesStatusz}</span>
                  const osszeg = b.osszeg || b.Osszeg
                  return (
                    <tr key={b.berlesAzon || b.BerlesAzon}>
                      <td>{b.berlesAzon || b.BerlesAzon}</td>
                      <td><strong>{b.ugyfelNev || b.UgyfelNev || 'Ismeretlen'}</strong></td>
                      <td>{b.raktarNev || b.RaktarNev || 'Ismeretlen'}</td>
                      <td>{kezdes}</td>
                      <td>{vegeSzoveg} {statuszBadge}</td>
                      <td className="text-end fw-bold">{osszeg != null ? osszeg.toLocaleString('hu-HU') + ' Ft' : '-'}</td>
                      <td className="text-end">
                        {(statusz === 'aktiv' || statusz === 'fuggoben') && <button className="btn btn-sm btn-warning me-1" onClick={() => openLezarModal(b.berlesAzon || b.BerlesAzon)}>Lezárás</button>}
                        <button className="btn btn-sm btn-danger" onClick={() => del(b.berlesAzon || b.BerlesAzon)}>Törlés</button>
                      </td>
                    </tr>
                  )
                })
              }
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default function Admin() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()
  const [aktifSzekció, setAktifSzekció] = useState('megyek')

  function showSection(id) {
    setAktifSzekció(id)
  }

  function adminLogout() {
    logout()
    navigate('/bejelentkezes')
  }

  return (
    <div className="container-fluid" style={{ paddingTop: 0 }}>
      <div className="row">
        <nav className="col-md-2 d-none d-md-block sidebar px-0">
          <h4 className="text-center py-4">RAKTÁR ADMIN</h4>
          <div className="nav flex-column mt-2">
            {[
              { id: 'megyek', label: 'Megyék' },
              { id: 'ugyfelek', label: 'Ügyfelek' },
              { id: 'raktarak', label: 'Raktárak' },
              { id: 'berlesek', label: 'Bérlések' },
              { id: 'tarolok', label: 'Tárolók' },
            ].map(({ id, label }) => (
              <button
                key={id}
                className={`nav-link${aktifSzekció === id ? ' active' : ''}`}
                onClick={() => showSection(id)}
              >
                {label}
              </button>
            ))}
            <button className="nav-link logout-btn" onClick={adminLogout}>Kijelentkezés</button>
          </div>
        </nav>

        <main className="col-md-10 main-content">
          {aktifSzekció === 'megyek' && <MegyekSection token={token} />}
          {aktifSzekció === 'ugyfelek' && <UgyfelekSection token={token} />}
          {aktifSzekció === 'raktarak' && <RaktarakSection token={token} />}
          {aktifSzekció === 'tarolok' && <TarolokSection token={token} />}
          {aktifSzekció === 'berlesek' && <BerlesekSection token={token} />}
        </main>
      </div>
    </div>
  )
}

