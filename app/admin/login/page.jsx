import React, { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/admin/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username, password, otp, remember }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Login failed')
      // redirect to admin
      window.location.href = '/admin/rollback'
    } catch (err) { setError(err.message) }
  }

  return (
    <div style={{ maxWidth: 420, margin: '48px auto', padding: 20 }}>
      <h1>Admin Login</h1>
      <form onSubmit={submit}>
        <label>Email or Username<br/>
          <input aria-label="username" value={username} onChange={e=>setUsername(e.target.value)} required style={{ width: '100%' }} />
        </label>
        <br />
        <label>Password<br/>
          <input aria-label="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required style={{ width: '100%' }} />
        </label>
        <br />
        <label>OTP (if enabled)<br/>
          <input aria-label="otp" value={otp} onChange={e=>setOtp(e.target.value)} style={{ width: '100%' }} />
        </label>
        <div style={{ marginTop: 8 }}>
          <label><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me</label>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Sign in</button>
        </div>
        <div style={{ marginTop: 8 }}>
          <a href="/admin/forgot">Forgot password?</a>
        </div>
        {error && <div role="alert" style={{ color: 'crimson', marginTop: 8 }}>{error}</div>}
      </form>
    </div>
  )
}
