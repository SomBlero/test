const fullNameRegex = /^[A-ZÖÜÓŐÚÉÁŰÍ][a-zöüóőúéáűí]+ [A-ZÖÜÓŐÚÉÁŰÍ][a-zöüóőúéáűí]+/
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const specialCharRegex = /[*!$,%?;+@#<>\-_=\/\\:]/
const forbiddenCharRegex = /[^a-zA-ZöüóőúéáűíÖÜÓŐÚÉÁŰÍ0-9*!$,%?;+@#<>\-_=\/\\:]/

export function parseBirthday(value) {
  if (!value) return null
  const cleaned = value.trim()
  const match = cleaned.match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/)
  if (!match) return null
  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  const day = parseInt(match[3], 10)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

export function isOver18FromDate(birthDate, today = new Date()) {
  if (!birthDate) return false
  const age = today.getFullYear() - birthDate.getFullYear()
  const birthMonthDay = (today.getMonth() > birthDate.getMonth()) ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())
  return age > 18 || (age === 18 && birthMonthDay)
}

export function checkName(name) {
  const value = (name || '').trim()
  return {
    isEmpty: value.length === 0,
    isFormat: value.length > 0 && !fullNameRegex.test(value)
  }
}

export function checkEmail(email) {
  const value = (email || '').trim()
  return {
    isEmpty: value.length === 0,
    isFormat: value.length > 0 && !emailRegex.test(value)
  }
}

export function checkPhone(phone) {
  const value = (phone || '').trim()
  const allowedChars = /^[+()0-9\s-]+$/
  const digitCount = (value.match(/\d/g) || []).length
  return {
    isEmpty: value.length === 0,
    isFormat: value.length > 0 && (!allowedChars.test(value) || digitCount < 7 || digitCount > 15)
  }
}

export function checkPassword(password) {
  const value = password || ''
  return {
    tooShort: value.length < 8,
    noUpper: !/[A-ZÖÜÓŐÚÉÁŰÍ]/.test(value),
    noNumber: !/[0-9]/.test(value),
    noSpecial: !specialCharRegex.test(value),
    forbiddenChar: forbiddenCharRegex.test(value)
  }
}
