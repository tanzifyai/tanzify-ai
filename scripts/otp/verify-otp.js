#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const OTP_FILE = path.join(process.cwd(), 'safety', 'otp_requests.json')

export function verify(token, otp) {
  if (!fs.existsSync(OTP_FILE)) return false
  const arr = JSON.parse(fs.readFileSync(OTP_FILE, 'utf8'))
  const idx = arr.findIndex(r => r.token === token && r.otp === otp)
  if (idx === -1) return false
  // remove used OTP
  arr.splice(idx, 1)
  fs.writeFileSync(OTP_FILE, JSON.stringify(arr, null, 2))
  return true
}

if (require.main === module) {
  const [, , token, otp] = process.argv
  console.log(verify(token, otp) ? 'OK' : 'INVALID')
}
