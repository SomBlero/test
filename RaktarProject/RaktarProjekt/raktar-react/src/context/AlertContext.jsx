import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const AlertContext = createContext(null)

function detectVariant(message) {
  const text = String(message || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (/siker(?!telen)/.test(text) || text.includes('elkuldve') || text.includes('elkuldtuk') || text.includes('megerositve')) return 'success'
  if (text.includes('figye') || text.includes('kotelezo') || text.includes('add meg') || text.includes('javasolt')) return 'warning'
  return 'danger'
}

function AlertModal({ state, onClose }) {
  const okRef = useRef(null)

  useEffect(() => {
    if (state.open && okRef.current) {
      okRef.current.focus()
    }
  }, [state.open])

  useEffect(() => {
    function onKey(e) {
      if (state.open && e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [state.open, onClose])

  if (!state.open) return null

  const { variant, message } = state
  const icons = { success: '✓', warning: '!', danger: '×' }
  const titles = { success: 'Siker', warning: 'Figyelmeztetés', danger: 'Hiba' }

  return (
    <div
      className="app-alert-backdrop open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="app-alert-modal" role="alertdialog" aria-modal="true">
        <div className={`app-alert-head ${variant}`}>
          <span className="app-alert-icon">{icons[variant]}</span>
          <span>{titles[variant]}</span>
        </div>
        <div className="app-alert-body">{message}</div>
        <div className="app-alert-actions">
          <button ref={okRef} className="app-alert-ok" onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  )
}

export function AlertProvider({ children }) {
  const [alertState, setAlertState] = useState({ open: false, message: '', variant: 'danger' })

  const showAlert = useCallback((message) => {
    setAlertState({ open: true, message: String(message ?? ''), variant: detectVariant(message) })
  }, [])

  const closeAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, open: false }))
  }, [])

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <AlertModal state={alertState} onClose={closeAlert} />
    </AlertContext.Provider>
  )
}

export function useAlert() {
  return useContext(AlertContext)
}
