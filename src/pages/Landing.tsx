import { Link } from 'react-router-dom'
import { useStore } from '../lib/store'

export function Landing() {
  const { currentUser } = useStore()
  const start = currentUser
    ? currentUser.role === 'customer'
      ? '/customer'
      : currentUser.role === 'artisan'
        ? '/artisan'
        : '/admin'
    : '/register'

  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <h1 className="hero-brand">TRUSTA</h1>
          <p className="hero-tag">Making skills visible. Making trust verifiable.</p>
          <p className="hero-support">
            Find reliable plumbers in Buea through practical assessments, peer endorsements, and
            verified job history — not paid badges.
          </p>
          <div className="hero-cta">
            <Link to={start} className="btn btn-mint">
              Start a request
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ color: '#f4fff9', borderColor: 'rgba(244,255,249,0.35)' }}>
              Use demo accounts
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid-2">
          <div>
            <div className="section-head">
              <h2>One clear service journey</h2>
              <p>
                Built for the hackathon MVP: register, verify, match, complete, and leave
                job-linked feedback.
              </p>
            </div>
            <div className="journey-steps panel">
              {[
                'Artisan registers as a plumber and builds a profile',
                'Verifier records assessment + peer endorsements',
                'Customer in Molyko requests an urgent pipe repair',
                'Matching ranks eligible artisans with explainable scores',
                'Job completes with a one-time PIN; verified review unlocks',
              ].map((text, i) => (
                <div className="journey-step" key={text}>
                  <div className="step-num">{i + 1}</div>
                  <div>{text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="stack">
            <div className="panel">
              <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
                Trust you can explain
              </h3>
              <p className="muted">
                Verification levels are evidence-based: Registered → Community Verified → Skill
                Verified → Proven Artisan. Payment never buys a higher badge or better match rank.
              </p>
            </div>
            <div className="panel">
              <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
                Matching that shows its work
              </h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Skill 30% · Verification 25% · Verified jobs 20% · Distance 15% · Availability 10%.
                Price is shown transparently as a quote or indicative range.
              </p>
            </div>
            <div className="panel">
              <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', color: 'var(--forest)' }}>
                Mobile-first for Buea
              </h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Simple language, clear actions, low-data friendly screens — designed for real phones
                on typical connections.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
