import React, { useState } from 'react'

export default function ForgotPassword() {
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault(); setError(null); setMessage(null)
    try {
      const res = await fetch('/api/admin/auth/forgot-password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Request failed')
      setMessage('If an account exists, a reset link has been sent.')
    } catch (err) { setError(err.message) }
  }

  return (
    <div style={{ maxWidth: 480, margin: '48px auto', padding: 16 }}>
      <h1>Forgot password</h1>
      <form onSubmit={submit}>
        <label>Email or Username<br/>
          <input value={username} onChange={e=>setUsername(e.target.value)} required style={{ width: '100%' }} />
        </label>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Send reset link</button>
        </div>
        {message && <div style={{ color: 'green', marginTop: 8 }}>{message}</div>}
        {error && <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  )
}
