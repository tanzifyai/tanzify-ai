import React, { useState } from 'react'
import { useRouter } from 'next/router'

export default function ResetPage({ params }) {
  const token = params?.token || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('token'))
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault(); setError(null); setMessage(null)
    if (password !== confirm) { setError('Passwords do not match'); return }
    try {
      const res = await fetch('/api/admin/auth/reset-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Reset failed')
      setMessage('Password reset successful. Please login.')
      setTimeout(()=>{ window.location.href = '/admin/login' }, 1500)
    } catch (err) { setError(err.message) }
  }

  return (
    <div style={{ maxWidth: 480, margin: '48px auto', padding: 16 }}>
      <h1>Reset password</h1>
      <form onSubmit={submit}>
        <label>New password<br/>
          <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{ width: '100%' }} />
        </label>
        <br />
        <label>Confirm password<br/>
          <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required style={{ width: '100%' }} />
        </label>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Set password</button>
        </div>
        {message && <div style={{ color: 'green', marginTop: 8 }}>{message}</div>}
        {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  )
}
