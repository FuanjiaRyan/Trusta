import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { VerificationBadge } from '../components/VerificationBadge'
import { useStore } from '../lib/store'

export function ArtisanDashboard() {
  const {
    currentUser,
    currentArtisan,
    state,
    upsertArtisanProfile,
    sendQuote,
    startJob,
    artisanConfirmCompletion,
    addEndorsement,
  } = useStore()

  const profile = currentArtisan

  const [skills, setSkills] = useState('Pipe repair, Leak detection')
  const [areas, setAreas] = useState('Molyko, Checkpoint')
  const [bio, setBio] = useState('')
  const [priceMin, setPriceMin] = useState(4000)
  const [priceMax, setPriceMax] = useState(18000)
  const [availability, setAvailability] = useState<'available' | 'busy' | 'offline'>('available')
  const [experienceYears, setExperienceYears] = useState(3)
  const [hydrated, setHydrated] = useState(false)
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, number>>({})
  const [quoteNotes, setQuoteNotes] = useState<Record<string, string>>({})
  const [pinReveal, setPinReveal] = useState<Record<string, string>>({})
  const [endorseArtisanId, setEndorseArtisanId] = useState('a-3')
  const [endorseNote, setEndorseNote] = useState('Reliable local plumber; I have seen their work.')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!profile || hydrated) return
    setSkills(profile.skills.join(', '))
    setAreas(profile.serviceAreas.join(', '))
    setBio(profile.bio)
    setPriceMin(profile.priceMin)
    setPriceMax(profile.priceMax)
    setAvailability(profile.availability)
    setExperienceYears(profile.experienceYears)
    setHydrated(true)
  }, [profile, hydrated])

  const openRequests = useMemo(
    () =>
      state.requests.filter((r) =>
        ['open', 'matched', 'quoted', 'accepted', 'in_progress'].includes(r.status),
      ),
    [state.requests],
  )

  const myJobs = useMemo(
    () => state.jobs.filter((j) => profile && j.artisanId === profile.id),
    [state.jobs, profile],
  )

  if (!currentUser) return <Navigate to="/login" replace />
  if (currentUser.role !== 'artisan') return <Navigate to="/" replace />

  function saveProfile(e: FormEvent) {
    e.preventDefault()
    upsertArtisanProfile({
      trade: 'Plumbing',
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      serviceAreas: areas.split(',').map((s) => s.trim()).filter(Boolean),
      contactMethod: 'WhatsApp / Call',
      availability,
      experienceYears,
      priceMin,
      priceMax,
      bio: bio || `Plumber based in ${areas.split(',')[0]?.trim() || 'Buea'}.`,
    })
    setMessage('Profile saved. Verification starts at Registered until a verifier upgrades you.')
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="page-title">Artisan workspace</h1>
        <p className="kicker">
          {currentUser.name} · Plumbing pilot · Build evidence, quote jobs, share a one-time
          completion PIN.
        </p>

        {message ? <div className="alert" style={{ marginBottom: '1rem' }}>{message}</div> : null}

        <div className="grid-2">
          <form className="panel stack" onSubmit={saveProfile}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
                Plumber profile
              </h3>
              {profile ? (
                <VerificationBadge level={profile.verificationLevel} />
              ) : (
                <span className="badge badge-registered">Not created</span>
              )}
            </div>
            <div className="field">
              <label className="label" htmlFor="skills">
                Skills (comma-separated)
              </label>
              <input id="skills" value={skills} onChange={(e) => setSkills(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="areas">
                Service areas
              </label>
              <input id="areas" value={areas} onChange={(e) => setAreas(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="bio">
                Bio
              </label>
              <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="pmin">
                  Price min (XAF)
                </label>
                <input
                  id="pmin"
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="pmax">
                  Price max (XAF)
                </label>
                <input
                  id="pmax"
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label className="label" htmlFor="avail">
                  Availability
                </label>
                <select
                  id="avail"
                  value={availability}
                  onChange={(e) =>
                    setAvailability(e.target.value as 'available' | 'busy' | 'offline')
                  }
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="offline">Offline</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="exp">
                  Experience (years)
                </label>
                <input
                  id="exp"
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Save profile
            </button>
            {profile ? (
              <p className="muted" style={{ margin: 0 }}>
                {profile.completedJobs} verified completed jobs on record.
              </p>
            ) : null}
          </form>

          <div className="panel stack">
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
              Peer endorsement
            </h3>
            <p className="muted" style={{ margin: 0 }}>
              Endorse another artisan’s work or local presence. Verifiers approve before it counts.
            </p>
            <div className="field">
              <label className="label" htmlFor="endorse">
                Artisan
              </label>
              <select
                id="endorse"
                value={endorseArtisanId}
                onChange={(e) => setEndorseArtisanId(e.target.value)}
              >
                {state.artisans
                  .filter((a) => a.userId !== currentUser.id)
                  .map((a) => {
                    const u = state.users.find((x) => x.id === a.userId)
                    return (
                      <option key={a.id} value={a.id}>
                        {u?.name ?? a.id}
                      </option>
                    )
                  })}
              </select>
            </div>
            <div className="field">
              <label className="label" htmlFor="enote">
                Evidence note
              </label>
              <textarea
                id="enote"
                value={endorseNote}
                onChange={(e) => setEndorseNote(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                addEndorsement({
                  artisanId: endorseArtisanId,
                  relationship: 'Peer plumber',
                  note: endorseNote,
                })
                setMessage('Endorsement submitted for verifier review.')
              }}
            >
              Submit endorsement
            </button>
          </div>
        </div>

        <div className="panel" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
            Open customer requests
          </h3>
          {!profile ? (
            <div className="empty">Create your profile before sending quotes.</div>
          ) : openRequests.length === 0 ? (
            <div className="empty">No open requests. Ask the customer demo account to submit one.</div>
          ) : (
            openRequests.map((req) => {
              const already = myJobs.find((j) => j.requestId === req.id)
              return (
                <div className="list-item" key={req.id}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <strong>
                        {req.skill} · {req.location}
                      </strong>
                      <div className="muted">
                        {req.customerName}: {req.description}
                      </div>
                    </div>
                    {req.urgency === 'urgent' ? (
                      <span className="badge badge-urgent">Urgent</span>
                    ) : (
                      <span className="badge">{req.urgency}</span>
                    )}
                  </div>
                  {already ? (
                    <span className="badge">You quoted {already.quote.toLocaleString()} XAF</span>
                  ) : (
                    <div className="row">
                      <div className="field" style={{ minWidth: 140 }}>
                        <label className="label" htmlFor={`q-${req.id}`}>
                          Quote (XAF)
                        </label>
                        <input
                          id={`q-${req.id}`}
                          type="number"
                          value={quoteAmounts[req.id] ?? profile.priceMin}
                          onChange={(e) =>
                            setQuoteAmounts((s) => ({ ...s, [req.id]: Number(e.target.value) }))
                          }
                        />
                      </div>
                      <div className="field" style={{ flex: 1, minWidth: 180 }}>
                        <label className="label" htmlFor={`qn-${req.id}`}>
                          Availability note
                        </label>
                        <input
                          id={`qn-${req.id}`}
                          value={quoteNotes[req.id] ?? 'Can arrive within 2 hours'}
                          onChange={(e) =>
                            setQuoteNotes((s) => ({ ...s, [req.id]: e.target.value }))
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          sendQuote({
                            requestId: req.id,
                            artisanId: profile.id,
                            quote: quoteAmounts[req.id] ?? profile.priceMin,
                            quoteNote: quoteNotes[req.id] ?? 'Can arrive within 2 hours',
                          })
                          setMessage('Quote sent. Customer can accept from their dashboard.')
                        }}
                      >
                        Send quote
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        <div className="panel" style={{ marginTop: '1rem' }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
            Your jobs
          </h3>
          {myJobs.length === 0 ? (
            <div className="empty">No jobs yet.</div>
          ) : (
            myJobs.map((job) => (
              <div className="list-item" key={job.id}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <div>
                    <strong>
                      {job.quote.toLocaleString()} XAF · {job.status}
                    </strong>
                    <div className="muted">{job.quoteNote}</div>
                  </div>
                  <span className="badge">{job.status}</span>
                </div>
                <div className="row">
                  {job.status === 'accepted' ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => startJob(job.id)}
                    >
                      Mark in progress
                    </button>
                  ) : null}
                  {job.status !== 'completed' && !job.pinUsed ? (
                    <button
                      type="button"
                      className="btn btn-mint btn-sm"
                      onClick={() => {
                        const pin = artisanConfirmCompletion(job.id)
                        setPinReveal((s) => ({ ...s, [job.id]: pin }))
                        setMessage('Share this one-time PIN with the customer to confirm completion.')
                      }}
                    >
                      Reveal completion PIN
                    </button>
                  ) : null}
                </div>
                {pinReveal[job.id] || (job.completionPin && !job.pinUsed) ? (
                  <div className="alert">
                    One-time completion PIN:{' '}
                    <strong>{pinReveal[job.id] ?? job.completionPin}</strong> — expires after use.
                  </div>
                ) : null}
                {job.pinUsed ? (
                  <div className="muted">Completion confirmed. PIN invalidated.</div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}
