import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'
import { decodeToken, getUserRole } from '../utils/auth'
import { parseBirthday, isOver18FromDate, checkName, checkEmail, checkPhone, checkPassword } from '../utils/validators'

export default function Login() {
  const [activeTab, setActiveTab] = useState('login')
  const { login } = useAuth()
  const { showAlert } = useAlert()
  const navigate = useNavigate()

  return (
    <div className="login-wrapper">
      <div className="card shadow" style={{ width: '100%', maxWidth: '500px' }}>
        <div className="card-body">
          
          <ul className="nav nav-tabs mb-4" role="tablist">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>
                <i className="fa-solid fa-key me-1"></i> Bejelentkezés
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>
                <i className="fa-solid fa-pen-to-square me-1"></i> Regisztráció
              </button>
            </li>
          </ul>

          <div className="tab-content">
            {activeTab === 'login' && (
              <LoginTab login={login} showAlert={showAlert} navigate={navigate} switchToRegister={() => setActiveTab('register')} />
            )}
            {activeTab === 'register' && (
              <RegisterTab showAlert={showAlert} switchToLogin={() => setActiveTab('login')} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginTab({ login, showAlert, navigate, switchToRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showForgotNewPw, setShowForgotNewPw] = useState(false)
  const [showForgotRepeatPw, setShowForgotRepeatPw] = useState(false)
  const [forgotVisible, setForgotVisible] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotCode, setForgotCode] = useState('')
  const [forgotNewPw, setForgotNewPw] = useState('')
  const [forgotRepeatPw, setForgotRepeatPw] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    try {
      const resp = await fetch('/api/Ugyfel/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })
      const data = await resp.json().catch(() => ({}))

      if (!resp.ok) {
        if (resp.status === 404) { showAlert('Nem található a megadott e-mail cím!'); return }
        if (resp.status === 401) {
          const msg = (data.message || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          if ((msg.includes('meg kell') && msg.includes('erositened')) || msg.includes('aktivalo')) {
            localStorage.setItem('pendingVerificationEmail', email.trim())
            showAlert(data.message || 'Az email címed még nincs megerősítve.')
            return
          }
          showAlert(data.message || 'Hibás jelszó!'); return
        }
        showAlert(data.message || 'Ismeretlen hiba történt!'); return
      }

      login(data.token)
      const role = getUserRole(decodeToken(data.token))
      navigate(role === 'admin' ? '/admin' : '/dashboard')
    } catch { showAlert('Szerver hiba!') }
  }

  async function handleForgotRequest(e) {
    e.preventDefault()
    if (!forgotEmail) { showAlert('Add meg az email címedet.'); return }
    try {
      const resp = await fetch('/api/Ugyfel/jelszo-visszaallitas/keres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) { showAlert(data.message || 'A visszaállító kód küldése sikertelen.'); return }
      localStorage.setItem('pendingPasswordResetEmail', forgotEmail)
      showAlert(data.message || 'Ha az email cím regisztrálva van, a visszaállító kódot elküldtük.')
    } catch { showAlert('Szerver hiba a jelszó-visszaállító kód kérésénél.') }
  }

  async function handleForgotConfirm(e) {
    e.preventDefault()
    const resolvedEmail = forgotEmail || localStorage.getItem('pendingPasswordResetEmail') || ''
    if (!resolvedEmail || !forgotCode || !forgotNewPw || !forgotRepeatPw) { showAlert('Az email, a kód és az új jelszó megadása kötelező.'); return }
    if (forgotNewPw !== forgotRepeatPw) { showAlert('A két új jelszó nem egyezik.'); return }
    const pwCheck = checkPassword(forgotNewPw)
    if (pwCheck.tooShort || pwCheck.noUpper || pwCheck.noNumber || pwCheck.noSpecial || pwCheck.forbiddenChar) { showAlert('Az új jelszó nem felel meg a biztonsági követelményeknek.'); return }
    try {
      const resp = await fetch('/api/Ugyfel/jelszo-visszaallitas/megerosites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail, kod: forgotCode, ujJelszo: forgotNewPw })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) { showAlert(data.message || 'A jelszó visszaállítása sikertelen.'); return }
      localStorage.removeItem('pendingPasswordResetEmail')
      setForgotEmail(''); setForgotCode(''); setForgotNewPw(''); setForgotRepeatPw('')
      setForgotVisible(false)
      showAlert(data.message || 'A jelszó sikeresen megváltozott. Most már bejelentkezhetsz.')
    } catch { showAlert('Szerver hiba a jelszó visszaállítása során.') }
  }

  return (
    <div>
      <h3 className="text-center mb-4">Bejelentkezés</h3>
      <form onSubmit={handleLogin}>
        <div className="mb-3">
          <label className="form-label"><i className="fa-solid fa-envelope me-1 text-muted"></i>Email</label>
          <input type="email" className="form-control" placeholder="email@email.hu" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label"><i className="fa-solid fa-lock me-1 text-muted"></i>Jelszó</label>
          <div className="input-group">
            <input type={showPw ? 'text' : 'password'} className="form-control" placeholder="jelszó" value={password} onChange={e => setPassword(e.target.value)} />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
              <i className={`fa-solid ${showPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>
        <button type="submit" className="btn btn-primary w-100">Bejelentkezés</button>
      </form>

      <div className="text-end mt-2">
        <a href="#" onClick={e => { e.preventDefault(); setForgotVisible(!forgotVisible); if (!forgotVisible) setForgotEmail(email.trim()) }} className="small text-decoration-none" style={{ color: '#93c5fd' }}>
          Elfelejtettem a jelszavamat
        </a>
      </div>

      {forgotVisible && (
        <div className="forgot-password-card mt-3">
          <h6 className="mb-2"><i className="fa-solid fa-key me-1"></i>Jelszó visszaállítás</h6>
          <p className="small text-muted mb-3">Add meg az email címed, elküldjük a visszaállító kódot.</p>
          <form onSubmit={handleForgotRequest} className="mb-3">
            <label className="form-label">Email cím</label>
            <input type="email" className="form-control mb-2" placeholder="email@email.hu" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
            <button type="submit" className="btn btn-outline-primary w-100">Kód kérése</button>
          </form>
          <form onSubmit={handleForgotConfirm} className="forgot-password-confirm-form">
            <label className="form-label">Visszaállító kód</label>
            <input type="text" className="form-control mb-2" maxLength="6" inputMode="numeric" placeholder="pl.: 123456" value={forgotCode} onChange={e => setForgotCode(e.target.value)} required />
            <label className="form-label">Új jelszó</label>
            <div className="input-group mb-2">
              <input type={showForgotNewPw ? 'text' : 'password'} className="form-control" placeholder="új jelszó" value={forgotNewPw} onChange={e => setForgotNewPw(e.target.value)} required />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForgotNewPw(v => !v)} tabIndex={-1}>
                <i className={`fa-solid ${showForgotNewPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            <label className="form-label">Új jelszó újra</label>
            <div className="input-group mb-2">
              <input type={showForgotRepeatPw ? 'text' : 'password'} className="form-control" placeholder="új jelszó újra" value={forgotRepeatPw} onChange={e => setForgotRepeatPw(e.target.value)} required />
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForgotRepeatPw(v => !v)} tabIndex={-1}>
                <i className={`fa-solid ${showForgotRepeatPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            <button type="submit" className="btn btn-success w-100">Új jelszó mentése</button>
          </form>
        </div>
      )}

      <div className="text-center mt-3">
        <small className="text-muted">
          Nincs fiókod? <a href="#" onClick={e => { e.preventDefault(); switchToRegister() }}>Válts a regisztráció fülre</a>
        </small>
      </div>
    </div>
  )
}

function RegisterTab({ showAlert, switchToLogin }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', repeatPassword: '', birthday: '', elfogad: false })
  const [showRegPw, setShowRegPw] = useState(false)
  const [showRegRepeatPw, setShowRegRepeatPw] = useState(false)
  const [errors, setErrors] = useState([])
  const [verificationVisible, setVerificationVisible] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

  function set(field) { return e => setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })) }

  function formatBirthday(raw) {
    const digits = (raw || '').replace(/\D/g, '').slice(0, 8)
    const year = digits.slice(0, 4)
    const month = digits.slice(4, 6)
    const day = digits.slice(6, 8)

    if (digits.length <= 4) return year
    if (digits.length <= 6) return `${year}.${month}`
    return `${year}.${month}.${day}`
  }

  function finalizeBirthday(raw) {
    const cleaned = (raw || '').trim()
    const match = cleaned.match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/)
    if (!match) return cleaned

    const year = match[1]
    const month = match[2]
    const day = match[3].padStart(2, '0')
    return `${year}.${month}.${day}`
  }

  async function handleRegister(e) {
    e.preventDefault()
    const { name, email, phone, password, repeatPassword, birthday, elfogad } = form
    const nameCheck = checkName(name)
    const emailCheck = checkEmail(email)
    const phoneCheck = checkPhone(phone)
    const pwCheck = checkPassword(password)
    const bd = parseBirthday(birthday)

    const errs = []
    if (nameCheck.isEmpty) errs.push('Nem adtál meg nevet!')
    if (nameCheck.isFormat) errs.push('Nem teljes egész nevet adtál meg nagy kezdőbetűvel!')
    if (emailCheck.isEmpty) errs.push('Nem adtál meg e-mail címet!')
    if (emailCheck.isFormat) errs.push('Nem megfelelő az e-mail cím formátuma!')
    if (phoneCheck.isEmpty) errs.push('Nem adtál meg telefonszámot!')
    if (phoneCheck.isFormat) errs.push('Nem megfelelő a telefonszám formátuma!')
    if (pwCheck.tooShort) errs.push('A jelszó túl rövid!')
    if (pwCheck.noUpper) errs.push('A jelszóban nem szerepel nagybetű!')
    if (pwCheck.noNumber) errs.push('A jelszóban nem szerepel szám!')
    if (pwCheck.noSpecial) errs.push('A jelszóban nem szerepel különleges karakter!')
    if (pwCheck.forbiddenChar) errs.push('Tiltott karaktert tartalmaz!')
    if (password !== repeatPassword) errs.push('A két jelszó nem egyezik!')
    if (!bd) errs.push('Érvénytelen születési dátum!')
    else if (!isOver18FromDate(bd, new Date())) errs.push('Nem múlt el 18 éves!')
    if (!elfogad) errs.push('Nem fogadtad el a feltételeket!')

    setErrors(errs)
    if (errs.length > 0) return

    try {
      const resp = await fetch('/api/Ugyfel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nev: name, email, telefonszam: phone, jelszoHash: password })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) { showAlert(data.message || 'Hiba történt a regisztráció során!'); return }
      const emailTrimmed = email.trim()
      localStorage.setItem('pendingVerificationEmail', emailTrimmed)
      setVerificationEmail(emailTrimmed)
      setVerificationVisible(true)
    } catch { showAlert('Szerver hiba. Próbáld újra később!') }
  }

  async function handleVerify(e) {
    e.preventDefault()
    const resolvedEmail = verificationEmail || localStorage.getItem('pendingVerificationEmail') || ''
    if (!resolvedEmail || !verificationCode) { showAlert('Az email és az aktiváló kód megadása kötelező.'); return }
    try {
      const resp = await fetch('/api/Ugyfel/megerosites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail, kod: verificationCode })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) { showAlert(data.message || 'A megerősítés sikertelen.'); return }
      localStorage.removeItem('pendingVerificationEmail')
      setVerificationVisible(false)
      showAlert('Email cím sikeresen megerősítve! Most már bejelentkezhetsz.')
      switchToLogin()
    } catch { showAlert('Szerver hiba a megerősítés során.') }
  }

  async function handleResend() {
    const resolvedEmail = verificationEmail || localStorage.getItem('pendingVerificationEmail') || form.email.trim()
    if (!resolvedEmail) { showAlert('Add meg előbb az email címet.'); return }
    try {
      const resp = await fetch('/api/Ugyfel/megerosites/ujrakuldes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) { showAlert(data.message || 'Az újraküldés sikertelen.'); return }
      showAlert(data.message || 'Új aktiváló kód elküldve.')
    } catch { showAlert('Szerver hiba az újraküldés során.') }
  }

  return (
    <div>
      <h3 className="text-center mb-4">Regisztráció</h3>
      <form onSubmit={handleRegister}>
        <div className="mb-3">
          <label className="form-label"><i className="fa-solid fa-user me-1 text-muted"></i>Név</label>
          <input type="text" className="form-control" placeholder="Gipsz Jakab" value={form.name} onChange={set('name')} />
        </div>
        <div className="mb-3">
          <label className="form-label"><i className="fa-solid fa-envelope me-1 text-muted"></i>Email</label>
          <input type="email" className="form-control" placeholder="email@email.hu" value={form.email} onChange={set('email')} />
        </div>
        <div className="mb-3">
          <label className="form-label"><i className="fa-solid fa-phone me-1 text-muted"></i>Telefonszám</label>
          <input type="text" className="form-control" placeholder="+36 30 123 4567" value={form.phone} onChange={set('phone')} />
        </div>
        <div className="mb-3">
          <label className="form-label"><i className="fa-solid fa-lock me-1 text-muted"></i>Jelszó</label>
          <div className="input-group">
            <input type={showRegPw ? 'text' : 'password'} className="form-control" placeholder="jelszó" value={form.password} onChange={set('password')} />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowRegPw(v => !v)} tabIndex={-1}>
              <i className={`fa-solid ${showRegPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label"><i className="fa-solid fa-lock me-1 text-muted"></i>Jelszó újra</label>
          <div className="input-group">
            <input type={showRegRepeatPw ? 'text' : 'password'} className="form-control" placeholder="jelszó újra" value={form.repeatPassword} onChange={set('repeatPassword')} />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowRegRepeatPw(v => !v)} tabIndex={-1}>
              <i className={`fa-solid ${showRegRepeatPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label"><i className="fa-solid fa-cake-candles me-1 text-muted"></i>Születési dátum</label>
          <input type="text" className="form-control" placeholder="ÉÉÉÉ.HH.NN" maxLength="10" inputMode="numeric" autoComplete="off"
            value={form.birthday}
            onChange={e => setForm(prev => ({ ...prev, birthday: formatBirthday(e.target.value) }))}
            onBlur={e => setForm(prev => ({ ...prev, birthday: finalizeBirthday(e.target.value) }))} />
        </div>
        <div className="mb-3 form-check">
          <input type="checkbox" className="form-check-input" id="elfogad" checked={form.elfogad} onChange={set('elfogad')} />
          <label className="form-check-label" htmlFor="elfogad">
            Elolvastam és elfogadom az <Link to="/aszf" target="_blank">Általános Szerződési Feltételeket</Link> és az <Link to="/adatvedelem" target="_blank">Adatvédelmi Nyilatkozatot</Link>
          </label>
        </div>

        {errors.length > 0 && (
          <div className="error_box">
            {errors.map((err, i) => <div key={i} className="error">{err}</div>)}
          </div>
        )}

        <button type="submit" className="btn btn-success w-100">Regisztráció</button>
        <div className="text-center mt-3">
          Van már fiókod? <a href="#" onClick={e => { e.preventDefault(); switchToLogin() }}>Jelentkezz be</a>
        </div>
      </form>

      {verificationVisible && (
        <div className="alert alert-info mt-4" role="alert">
          <h5 className="mb-2"><i className="fa-solid fa-envelope-circle-check me-1"></i>Email megerősítés</h5>
          <p className="mb-3">A regisztrációhoz küldtünk egy 6 jegyű aktiváló kódot erre a címre: <strong>{verificationEmail}</strong></p>
          <form onSubmit={handleVerify} className="mb-2">
            <div className="mb-2">
              <label className="form-label">Aktiváló kód</label>
              <input type="text" className="form-control" maxLength="6" inputMode="numeric" placeholder="pl.: 123456"
                value={verificationCode} onChange={e => setVerificationCode(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary w-100">Fiók megerősítése</button>
          </form>
          <button type="button" className="btn btn-outline-secondary w-100" onClick={handleResend}>Új kód kérése</button>
        </div>
      )}
    </div>
  )
}

