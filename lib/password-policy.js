import fs from 'fs'

const commonPasswords = new Set([ 'password', '12345678', 'qwerty', 'letmein', 'admin', '123456', 'iloveyou' ])

export function validatePassword(password) {
  const errors = []
  if (!password || password.length < 12) errors.push('Password must be at least 12 characters')
  if (!/[a-z]/.test(password)) errors.push('Password must include a lowercase letter')
  if (!/[A-Z]/.test(password)) errors.push('Password must include an uppercase letter')
  if (!/[0-9]/.test(password)) errors.push('Password must include a number')
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('Password must include a symbol')
  if (/([a-zA-Z0-9])\1{3,}/.test(password)) errors.push('Password contains repeated characters')
  if (commonPasswords.has(password.toLowerCase())) errors.push('Password is too common')
  return { ok: errors.length === 0, errors }
}

export function meetsHistory(passwordHash, historyHashes) {
  // caller should compare hashes
  return !historyHashes.includes(passwordHash)
}
