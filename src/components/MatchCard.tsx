import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { VerificationBadge } from './VerificationBadge'
import type { ArtisanProfile, MatchScore } from '../types'

export function MatchCard({
  match,
  artisan,
  requestId,
  action,
}: {
  match: MatchScore
  artisan: ArtisanProfile
  requestId: string
  action?: ReactNode
}) {
  return (
    <div className="list-item">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div>
          <strong style={{ fontSize: '1.05rem' }}>{artisan.bio.split('.')[0]}</strong>
          <div className="muted" style={{ marginTop: 4 }}>
            {artisan.skills.slice(0, 3).join(' · ')} · {artisan.serviceAreas.join(', ')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="score">{match.eligible ? match.total : '—'}</div>
          <div className="muted" style={{ fontSize: '0.8rem' }}>
            match score
          </div>
        </div>
      </div>

      <div className="row">
        <VerificationBadge level={artisan.verificationLevel} />
        <span className="badge">
          {artisan.availability}
        </span>
        <span className="badge">
          {artisan.completedJobs} verified jobs
        </span>
        <span className="badge">
          {artisan.priceMin.toLocaleString()}–{artisan.priceMax.toLocaleString()} XAF
        </span>
      </div>

      {!match.eligible ? (
        <div className="alert alert-error">{match.ineligibleReason}</div>
      ) : (
        <>
          <div className="meter" aria-hidden>
            <span style={{ width: `${match.total}%` }} />
          </div>
          <ul className="muted" style={{ margin: 0, paddingLeft: '1.1rem' }}>
            {match.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <div className="muted" style={{ fontSize: '0.82rem' }}>
            Weights: skill {match.breakdown.skill} · verification {match.breakdown.verification} ·
            history {match.breakdown.history} · distance {match.breakdown.distance} · availability{' '}
            {match.breakdown.availability}
          </div>
        </>
      )}

      <div className="row">
        <Link to={`/artisans/${artisan.id}?request=${requestId}`} className="btn btn-secondary btn-sm">
          View evidence
        </Link>
        {action}
      </div>
    </div>
  )
}
