import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { MatchCard } from '../components/MatchCard'
import { useStore } from '../lib/store'
import type { Urgency } from '../types'

export function CustomerDashboard() {
  const {
    currentUser,
    state,
    createRequest,
    getMatchesForRequest,
    getArtisan,
    acceptJob,
    confirmCompletionWithPin,
    submitReview,
  } = useStore()

  const [skill, setSkill] = useState('Pipe repair')
  const [description, setDescription] = useState('Burst pipe under kitchen sink, water spreading.')
  const [location, setLocation] = useState('Molyko, Buea')
  const [urgency, setUrgency] = useState<Urgency>('urgent')
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const myRequests = useMemo(
    () =>
      currentUser
        ? state.requests.filter((r) => r.customerId === currentUser.id)
        : [],
    [state.requests, currentUser],
  )

  const activeRequest =
    myRequests.find((r) => r.id === activeRequestId) ?? myRequests[0] ?? null

  const matches = activeRequest
    ? getMatchesForRequest(activeRequest.id).filter((m) => m.eligible)
    : []

  const myJobs = useMemo(
    () =>
      currentUser
        ? state.jobs.filter((j) => j.customerId === currentUser.id)
        : [],
    [state.jobs, currentUser],
  )

  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'customer') return <Navigate to="/" replace />

  function onCreate(e: FormEvent) {
    e.preventDefault()
    const req = createRequest({ skill, description, location, urgency })
    setActiveRequestId(req.id)
    setMessage('Request submitted. Eligible plumbers are ranked below.')
    setError('')
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Customer desk</h1>
        <p className="kicker">
          Hello {currentUser.name}. Request a plumber in Buea, compare trusted matches, then
          complete with a one-time PIN.
        </p>

        <div className="grid-2">
          <form className="panel stack" onSubmit={onCreate}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
              New service request
            </h3>
            <div className="field">
              <label className="label" htmlFor="skill">
                Service needed
              </label>
              <select id="skill" value={skill} onChange={(e) => setSkill(e.target.value)}>
                <option>Pipe repair</option>
                <option>Leak detection</option>
                <option>Tap installation</option>
                <option>Toilet repair</option>
                <option>Drain clearing</option>
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="desc">
                Short description
              </label>
              <textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="loc">
                Location
              </label>
              <input
                id="loc"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="label" htmlFor="urgency">
                Urgency
              </label>
              <select
                id="urgency"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as Urgency)}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Find plumbers
            </button>
          </form>

          <div className="panel">
            <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
              Your requests
            </h3>
            {myRequests.length === 0 ? (
              <div className="empty">No requests yet. Submit one to see ranked matches.</div>
            ) : (
              <div className="stack">
                {myRequests.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="demo-chip"
                    style={{
                      cursor: 'pointer',
                      borderStyle: 'solid',
                      outline: activeRequest?.id === r.id ? '2px solid var(--mint-deep)' : undefined,
                    }}
                    onClick={() => setActiveRequestId(r.id)}
                  >
                    <span>
                      <strong>{r.skill}</strong>
                      <br />
                      <span className="muted" style={{ fontSize: '0.85rem' }}>
                        {r.location} · {r.status}
                      </span>
                    </span>
                    {r.urgency === 'urgent' ? <span className="badge badge-urgent">Urgent</span> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {message ? <div className="alert" style={{ marginTop: '1rem' }}>{message}</div> : null}
        {error ? <div className="alert alert-error" style={{ marginTop: '1rem' }}>{error}</div> : null}

        {activeRequest ? (
          <div className="panel" style={{ marginTop: '1rem' }}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
                Ranked matches for {activeRequest.location}
              </h3>
              <span className="muted">{matches.length} eligible</span>
            </div>
            {matches.length === 0 ? (
              <div className="empty" style={{ marginTop: '1rem' }}>
                No eligible artisans yet.
              </div>
            ) : (
              matches.map((m) => {
                const artisan = getArtisan(m.artisanId)
                if (!artisan) return null
                const quoted = myJobs.find(
                  (j) => j.requestId === activeRequest.id && j.artisanId === artisan.id,
                )
                return (
                  <MatchCard
                    key={m.artisanId}
                    match={m}
                    artisan={artisan}
                    requestId={activeRequest.id}
                    action={
                      quoted ? (
                        <span className="badge">Quote: {quoted.quote.toLocaleString()} XAF</span>
                      ) : (
                        <Link
                          to={`/artisans/${artisan.id}?request=${activeRequest.id}`}
                          className="btn btn-mint btn-sm"
                        >
                          Select / review
                        </Link>
                      )
                    }
                  />
                )
              })
            )}
          </div>
        ) : null}

        <div className="panel" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
            Quotes & jobs
          </h3>
          {myJobs.length === 0 ? (
            <div className="empty">When an artisan sends a quote, it appears here.</div>
          ) : (
            myJobs.map((job) => {
              const artisan = getArtisan(job.artisanId)
              const reviewed = state.reviews.some((r) => r.jobId === job.id)
              return (
                <div className="list-item" key={job.id}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <ArtisanName artisanId={job.artisanId} />
                      <div className="muted">
                        {job.quote.toLocaleString()} XAF · {job.status}
                        {job.quoteNote ? ` · ${job.quoteNote}` : ''}
                        {artisan ? ` · ${artisan.serviceAreas[0]}` : ''}
                      </div>
                    </div>
                    <span className="badge">{job.status}</span>
                  </div>

                  {job.status === 'quoted' ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        acceptJob(job.id)
                        setMessage('Job accepted. Ask the artisan for the completion PIN when work is done.')
                      }}
                    >
                      Accept quote
                    </button>
                  ) : null}

                  {(job.status === 'accepted' || job.status === 'in_progress') && !job.pinUsed ? (
                    <div className="row">
                      <div className="field" style={{ flex: 1, minWidth: 160 }}>
                        <label className="label" htmlFor={`pin-${job.id}`}>
                          Completion PIN from artisan
                        </label>
                        <input
                          id={`pin-${job.id}`}
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          placeholder="4-digit PIN"
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-mint"
                        onClick={() => {
                          const result = confirmCompletionWithPin(job.id, pin)
                          if (!result.ok) {
                            setError(result.error ?? 'PIN failed')
                            return
                          }
                          setError('')
                          setMessage('Job completed. You can leave a verified review.')
                          setPin('')
                        }}
                      >
                        Confirm completion
                      </button>
                    </div>
                  ) : null}

                  {job.status === 'completed' && !reviewed ? (
                    <div className="stack">
                      <div className="alert">Verified feedback unlocked for this completed job.</div>
                      <div className="field">
                        <label className="label" htmlFor={`rating-${job.id}`}>
                          Rating (1–5)
                        </label>
                        <input
                          id={`rating-${job.id}`}
                          type="number"
                          min={1}
                          max={5}
                          value={rating}
                          onChange={(e) => setRating(Number(e.target.value))}
                        />
                      </div>
                      <div className="field">
                        <label className="label" htmlFor={`comment-${job.id}`}>
                          Comment
                        </label>
                        <textarea
                          id={`comment-${job.id}`}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          const result = submitReview({ jobId: job.id, rating, comment })
                          if (!result.ok) {
                            setError(result.error ?? 'Review failed')
                            return
                          }
                          setMessage('Review saved. Artisan reputation updated.')
                          setComment('')
                        }}
                      >
                        Submit verified review
                      </button>
                    </div>
                  ) : null}

                  {reviewed ? <div className="badge">Review submitted</div> : null}
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

function ArtisanName({ artisanId }: { artisanId: string }) {
  const { getArtisan, getUser } = useStore()
  const artisan = getArtisan(artisanId)
  const user = artisan ? getUser(artisan.userId) : undefined
  return <strong>{user?.name ?? 'Artisan'}</strong>
}
