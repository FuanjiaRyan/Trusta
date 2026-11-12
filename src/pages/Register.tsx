import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../lib/store'
import type { Role } from '../types'

export function Register() {
  const { register } = useStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<Role>('customer')
  const [error, setError] = useState('')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const result = register({ name, phone, role })
    if (!result.ok) {
      setError(result.error ?? 'Registration failed')
      return
    }
    navigate(role === 'customer' ? '/customer' : role === 'artisan' ? '/artisan' : '/admin')
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 560 }}>
        <h1 className="page-title">Create account</h1>
        <p className="kicker">Phone + basic profile. Artisans never pay to be listed or verified.</p>

        <form className="panel stack" onSubmit={onSubmit}>
          <div className="field">
            <label className="label" htmlFor="name">
              Full name
            </label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label className="label" htmlFor="reg-phone">
              Phone number
            </label>
            <input
              id="reg-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+237..."
              required
            />
          </div>
          <div className="field">
            <label className="label" htmlFor="role">
              I am a…
            </label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="customer">Customer</option>
              <option value="artisan">Artisan (plumber)</option>
              <option value="verifier">Verifier / assessor</option>
            </select>
          </div>
          {error ? <div className="alert alert-error">{error}</div> : null}
          <button type="submit" className="btn btn-primary">
            Register
          </button>
          <p className="muted" style={{ margin: 0 }}>
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </section>
  )
}
