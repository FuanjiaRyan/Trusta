import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { VerificationBadge } from '../components/VerificationBadge'
import { useStore } from '../lib/store'

export function ArtisanProfilePage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const requestId = params.get('request')
  const {
    currentUser,
    getArtisan,
    getUser,
    state,
    sendQuote,
  } = useStore()

  const artisan = id ? getArtisan(id) : undefined
  const user = artisan ? getUser(artisan.userId) : undefined
  const [quote, setQuote] = useState(artisan?.priceMin ?? 5000)
  const [note, setNote] = useState('Available today')
  const [message, setMessage] = useState('')

  const endorsements = useMemo(
    () =>
      state.endorsements.filter(
        (e) => e.artisanId === artisan?.id && e.status === 'approved',
      ),
    [state.endorsements, artisan?.id],
  )

  const assessments = useMemo(
    () => state.assessments.filter((a) => a.artisanId === artisan?.id),
    [state.assessments, artisan?.id],
  )

  const reviews = useMemo(
    () => state.reviews.filter((r) => r.artisanId === artisan?.id),
    [state.reviews, artisan?.id],
  )

  if (!artisan || !user) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty">Artisan not found.</div>
          <Link to="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            Home
          </Link>
        </div>
      </section>
    )
  }

  if (!currentUser) return <Navigate to="/login" replace />

  function onQuote(e: FormEvent) {
    e.preventDefault()
    if (!requestId || !artisan) return
    sendQuote({
      requestId,
      artisanId: artisan.id,
      quote,
      quoteNote: note,
    })
    setMessage('Quote sent to the customer.')
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <Link to={currentUser.role === 'customer' ? '/customer' : '/artisan'} className="muted">
          ← Back
        </Link>
        <h1 className="page-title" style={{ marginTop: '0.75rem' }}>
          {user.name}
        </h1>
        <div className="row" style={{ marginBottom: '1rem' }}>
          <VerificationBadge level={artisan.verificationLevel} />
          <span className="badge">{artisan.availability}</span>
          <span className="badge">{artisan.completedJobs} verified jobs</span>
        </div>
        <p className="kicker">{artisan.bio}</p>

        {message ? <div className="alert" style={{ marginBottom: '1rem' }}>{message}</div> : null}

        <div className="panel stack">
          <div>
            <strong>Skills</strong>
            <div className="muted">{artisan.skills.join(' · ')}</div>
          </div>
          <div>
            <strong>Service areas</strong>
            <div className="muted">{artisan.serviceAreas.join(' · ')}</div>
          </div>
          <div>
            <strong>Indicative price range</strong>
            <div className="muted">
              {artisan.priceMin.toLocaleString()}–{artisan.priceMax.toLocaleString()} XAF (job
              quotes are specific; price never buys trust)
            </div>
          </div>
          <div>
            <strong>Contact</strong>
            <div className="muted">{artisan.contactMethod}</div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
            Why this trust status
          </h3>
          {assessments.length === 0 && endorsements.length === 0 ? (
            <div className="empty">No assessment or endorsement evidence yet.</div>
          ) : null}
          {assessments.map((a) => (
            <div className="list-item" key={a.id}>
              <strong>Assessment · {a.outcome}</strong>
              <div className="muted">
                Assessor {a.assessorName} · {new Date(a.date).toLocaleDateString()}
              </div>
              <div>{a.tasks}</div>
              <div className="muted">{a.evidence}</div>
            </div>
          ))}
          {endorsements.map((e) => (
            <div className="list-item" key={e.id}>
              <strong>Peer endorsement · {e.endorserName}</strong>
              <div className="muted">{e.relationship}</div>
              <div>{e.note}</div>
            </div>
          ))}
        </div>

        <div className="panel" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
            Job-verified reviews
          </h3>
          {reviews.length === 0 ? (
            <div className="empty">No completed-job reviews yet.</div>
          ) : (
            reviews.map((r) => (
              <div className="list-item" key={r.id}>
                <strong>{r.rating}/5</strong>
                <div>{r.comment}</div>
                <div className="muted">{new Date(r.createdAt).toLocaleString()}</div>
              </div>
            ))
          )}
        </div>

        {currentUser.role === 'artisan' &&
        currentUser.id === artisan.userId &&
        requestId ? (
          <form className="panel stack" style={{ marginTop: '1rem' }} onSubmit={onQuote}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
              Send quote for this request
            </h3>
            <div className="field">
              <label className="label" htmlFor="quote">
                Quote (XAF)
              </label>
              <input
                id="quote"
                type="number"
                value={quote}
                onChange={(e) => setQuote(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="note">
                Note
              </label>
              <input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary">
              Send quote
            </button>
          </form>
        ) : null}

        {currentUser.role === 'customer' && requestId ? (
          <div className="alert" style={{ marginTop: '1rem' }}>
            To hire this artisan, wait for their quote on your dashboard — or ask them (demo: sign
            in as Paul or Grace) to quote request {requestId.slice(-6)}.
          </div>
        ) : null}
      </div>
    </section>
  )
}
