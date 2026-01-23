import React, { useEffect, useState } from 'react'

export default function RollbackAdminPage() {
  const [requests, setRequests] = useState([])
  const [audit, setAudit] = useState([])
  const [status, setStatus] = useState(null)

  async function fetchAll() {
    const [rRes, aRes, sRes, sessRes] = await Promise.all([
      fetch('/api/admin/rollback/requests').then(r=>r.json()),
      fetch('/api/admin/rollback/audit').then(r=>r.json()),
      fetch('/api/admin/rollback/monitor').then(r=>r.json()),
      fetch('/api/admin/sessions').then(r=>r.json())
    ])
    setRequests(rRes || [])
    setAudit(aRes || [])
    setStatus(sRes || null)
    setSessions((sessRes && sessRes.sessions) || [])
  }

  useEffect(() => { fetchAll(); const t = setInterval(fetchAll, 5000); return () => clearInterval(t); }, [])

  const [sessions, setSessions] = useState([])

  async function logoutSession(id) {
    await fetch('/api/admin/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'logout-session', sessionId: id }) })
    await fetchAll()
  }

  async function logoutAll(adminId) {
    await fetch('/api/admin/sessions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'logout-all', adminId }) })
    await fetchAll()
  }

  async function handleAction(token, action) {
    await fetch('/api/admin/rollback/approve', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, action }) })
    await fetchAll()
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Rollback Management</h1>
      <section>
        <h2>Pending Requests</h2>
        {requests.length === 0 ? <p>No pending requests</p> : (
          <table style={{ width: '100%' }}>
            <thead><tr><th>Token</th><th>Requested By</th><th>When</th><th>Reason</th><th>Impact</th><th>Actions</th></tr></thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.token}>
                  <td>{r.token}</td>
                  <td>{r.requestedBy}</td>
                  <td>{r.requestedAt}</td>
                  <td>{r.reason || ''}</td>
                  <td>{r.impact || ''}</td>
                  <td>
                    <button onClick={() => handleAction(r.token, 'approve')}>Approve</button>
                    <button onClick={() => handleAction(r.token, 'reject')}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Audit Log</h2>
        <div style={{ maxHeight: 300, overflow: 'auto', background: '#f7f7f7', padding: 12 }}>
          {audit.map((a, i) => <div key={i}><strong>{a.when}</strong> {a.action} {a.migration || ''} by {a.user}</div>)}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Realtime Status</h2>
        {status ? (
          <div>
            <div>DB Active Connections: {status.activeConnections}</div>
            <div>Current Progress: {status.progressPct || 0}%</div>
            <div>Estimated time remaining: {status.eta || 'n/a'}</div>
          </div>
        ) : <div>Loading...</div>}
      </section>
      <section style={{ marginTop: 24 }}>
        <h2>Active Sessions</h2>
        <div>
          {sessions.length === 0 ? <p>No active sessions</p> : (
            <table style={{ width: '100%' }}>
              <thead><tr><th>ID</th><th>Admin</th><th>Created</th><th>Expires</th><th>Actions</th></tr></thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.admin_id}</td>
                    <td>{s.created_at}</td>
                    <td>{s.expires_at}</td>
                    <td>
                      <button onClick={() => logoutSession(s.id)}>Logout</button>
                      <button onClick={() => logoutAll(s.admin_id)}>Logout All</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}
