import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { VerificationBadge } from '../components/VerificationBadge'
import { VERIFICATION_LABELS } from '../lib/matching'
import { useStore } from '../lib/store'
import type { VerificationLevel } from '../types'

export function AdminDashboard() {
  const {
    currentUser,
    state,
    addAssessment,
    approveEndorsement,
    setVerification,
    getUser,
  } = useStore()

  const [artisanId, setArtisanId] = useState(state.artisans[0]?.id ?? '')
  const [tasks, setTasks] = useState('Leak isolation, PVC join, tap reseating')
  const [outcome, setOutcome] = useState<'pass' | 'fail' | 'partial'>('pass')
  const [evidence, setEvidence] = useState('Practical demo at Checkpoint workshop (fictional).')
  const [message, setMessage] = useState('')

  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'verifier' && currentUser.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  function onAssess(e: FormEvent) {
    e.preventDefault()
    addAssessment({ artisanId, tasks, outcome, evidence })
    setMessage('Assessment recorded. Verification level may auto-update from evidence rules.')
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">
          {currentUser.role === 'admin' ? 'Admin' : 'Verifier'} console
        </h1>
        <p className="kicker">
          Record practical assessments, approve peer endorsements, and assign evidence-based
          verification levels.
        </p>

        {message ? <div className="alert" style={{ marginBottom: '1rem' }}>{message}</div> : null}

        <div className="grid-2">
          <form className="panel stack" onSubmit={onAssess}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
              Practical assessment
            </h3>
            <div className="field">
              <label className="label" htmlFor="artisan">
                Artisan
              </label>
              <select
                id="artisan"
                value={artisanId}
                onChange={(e) => setArtisanId(e.target.value)}
              >
                {state.artisans.map((a) => {
                  const u = getUser(a.userId)
                  return (
                    <option key={a.id} value={a.id}>
                      {u?.name ?? a.id} · {VERIFICATION_LABELS[a.verificationLevel]}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="tasks">
                Tasks assessed
              </label>
              <textarea id="tasks" value={tasks} onChange={(e) => setTasks(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="outcome">
                Outcome
              </label>
              <select
                id="outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as 'pass' | 'fail' | 'partial')}
              >
                <option value="pass">Pass</option>
                <option value="partial">Partial</option>
                <option value="fail">Fail</option>
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="evidence">
                Evidence notes
              </label>
              <textarea
                id="evidence"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Save assessment
            </button>
          </form>

          <div className="panel">
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
              Pending endorsements
            </h3>
            {state.endorsements.filter((e) => e.status === 'pending').length === 0 ? (
              <div className="empty">No pending endorsements.</div>
            ) : (
              state.endorsements
                .filter((e) => e.status === 'pending')
                .map((e) => {
                  const artisan = state.artisans.find((a) => a.id === e.artisanId)
                  const name = artisan ? getUser(artisan.userId)?.name : e.artisanId
                  return (
                    <div className="list-item" key={e.id}>
                      <strong>
                        {e.endorserName} → {name}
                      </strong>
                      <div className="muted">
                        {e.relationship}: {e.note}
                      </div>
                      <div className="row">
                        <button
                          type="button"
                          className="btn btn-mint btn-sm"
                          onClick={() => {
                            approveEndorsement(e.id, true)
                            setMessage('Endorsement approved.')
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => approveEndorsement(e.id, false)}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        <div className="panel" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
            Artisans & verification
          </h3>
          {state.artisans.map((a) => {
            const user = getUser(a.userId)
            const endorsements = state.endorsements.filter(
              (e) => e.artisanId === a.id && e.status === 'approved',
            )
            const assessments = state.assessments.filter((x) => x.artisanId === a.id)
            return (
              <div className="list-item" key={a.id}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <strong>{user?.name}</strong>
                    <div className="muted">
                      {a.skills.join(', ')} · {a.serviceAreas.join(', ')} · {a.completedJobs}{' '}
                      verified jobs
                    </div>
                  </div>
                  <VerificationBadge level={a.verificationLevel} />
                </div>
                <div className="muted" style={{ fontSize: '0.9rem' }}>
                  Evidence: {assessments.length} assessment(s), {endorsements.length} approved
                  endorsement(s). Why it matters: badges follow assessments + endorsements +
                  completed jobs — not payment.
                </div>
                <div className="field" style={{ maxWidth: 280 }}>
                  <label className="label" htmlFor={`level-${a.id}`}>
                    Set verification level
                  </label>
                  <select
                    id={`level-${a.id}`}
                    value={a.verificationLevel}
                    onChange={(e) => {
                      setVerification(a.id, e.target.value as VerificationLevel)
                      setMessage(`Updated ${user?.name} to ${VERIFICATION_LABELS[e.target.value as VerificationLevel]}.`)
                    }}
                  >
                    {(Object.keys(VERIFICATION_LABELS) as VerificationLevel[]).map((k) => (
                      <option key={k} value={k}>
                        {VERIFICATION_LABELS[k]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </div>

        <div className="panel" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
            Reputation audit trail
          </h3>
          {state.reputationEvents.length === 0 ? (
            <div className="empty">No events yet.</div>
          ) : (
            [...state.reputationEvents]
              .reverse()
              .slice(0, 12)
              .map((ev) => (
                <div className="list-item" key={ev.id}>
                  <strong>{ev.type}</strong>
                  <div className="muted">
                    subject {ev.subjectId} · actor {ev.actorId} · {new Date(ev.timestamp).toLocaleString()} ·
                    ref {ev.evidenceRef}
                  </div>
                </div>
              ))
          )}
        </div>

        {currentUser.role === 'admin' ? (
          <div className="panel" style={{ marginTop: '1rem' }}>
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
              Users
            </h3>
            {state.users.map((u) => (
              <div className="list-item" key={u.id}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <span>
                    <strong>{u.name}</strong> · {u.phone}
                  </span>
                  <span className="badge">
                    {u.role} · {u.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
