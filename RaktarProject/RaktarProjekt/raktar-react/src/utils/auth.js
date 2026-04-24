export function getToken() {
  return localStorage.getItem('token')
}
export function decodeToken(token = getToken()) {
  if (!token) return null
  try {
    const base64 = token.split('.')[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    const jsonStr = decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    )
    return JSON.parse(jsonStr)
  } catch {
    return null
  }
}

export function isLoggedIn(token = getToken()) {
  const payload = decodeToken(token)
  if (!payload) return false
  return payload.exp > (Date.now() / 1000)
}

export function getUserId(payload = decodeToken()) {
  if (!payload) return null
  return payload['nameid']
    || payload['sub']
    || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
    || null
}

export function getUserName(payload = decodeToken()) {
  if (!payload) return null
  return payload['unique_name']
    || payload['name']
    || payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
    || null
}

export function getUserRole(payload = decodeToken()) {
  if (!payload) return ''
  return (
    payload.role
    || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
    || ''
  ).toString().toLowerCase()
}

