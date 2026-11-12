import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'

const DEMOS = [
  { label: 'Customer — Amina', phone: '+237670000001', role: 'Request a plumber' },
  { label: 'Artisan — Paul (Proven)', phone: '+237670000101', role: 'Quote & complete jobs' },
  { label: 'Artisan — Grace (Skill Verified)', phone: '+237670000102', role: 'Respond to matches' },
  { label: 'Verifier — Mbah', phone: '+237670000201', role: 'Assess & endorse' },
  { label: 'Admin', phone: '+237670000301', role: 'Review verification' },
]

export function Login() {
  const { login, resetDemo } = useStore()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('+237670000001')
  const [error, setError] = useState('')

  function go(rolePhone: string) {
    const result = login(rolePhone)
    if (!result.ok) {
      setError(result.error ?? 'Could not sign in')
      return
    }
    const dest =
      rolePhone.endsWith('001')
        ? '/customer'
        : rolePhone.endsWith('101') || rolePhone.endsWith('102') || rolePhone.endsWith('103')
          ? '/artisan'
          : '/admin'
    navigate(dest)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    go(phone)
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 className="page-title">Sign in</h1>
        <p className="kicker">Hackathon demo — pick a seeded account or enter a registered phone.</p>

        <div className="grid-2">
          <form className="panel stack" onSubmit={onSubmit}>
            <div className="field">
              <label className="label" htmlFor="phone">
                Phone number
              </label>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+237..."
                autoComplete="tel"
              />
            </div>
            {error ? <div className="alert alert-error">{error}</div> : null}
            <button type="submit" className="btn btn-primary">
              Continue
            </button>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
              No account? <Link to="/register">Register</Link>
            </p>
          </form>

          <div className="panel">
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
              Demo accounts
            </h3>
            <p className="muted" style={{ marginTop: 0 }}>
              Fictional profiles for the live walkthrough.
            </p>
            <div className="demo-strip">
              {DEMOS.map((d) => (
                <button
                  key={d.phone}
                  type="button"
                  className="demo-chip"
                  onClick={() => {
                    setPhone(d.phone)
                    go(d.phone)
                  }}
                  style={{ cursor: 'pointer', textAlign: 'left', width: '100%' }}
                >
                  <span>
                    <strong>{d.label}</strong>
                    <br />
                    <span className="muted" style={{ fontSize: '0.85rem' }}>
                      {d.role}
                    </span>
                  </span>
                  <span className="badge">{d.phone.slice(-4)}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
              onClick={() => {
                resetDemo()
                setError('')
                setPhone('+237670000001')
              }}
            >
              Reset demo data
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
