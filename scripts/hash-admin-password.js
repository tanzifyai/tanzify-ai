#!/usr/bin/env node
// Hash a password for admin users (bcrypt)
import bcrypt from 'bcryptjs'

const [, , plain] = process.argv
if (!plain) { console.error('Usage: node scripts/hash-admin-password.js <password>'); process.exit(1) }
const salt = bcrypt.genSaltSync(10)
const hash = bcrypt.hashSync(plain, salt)
console.log(hash)
