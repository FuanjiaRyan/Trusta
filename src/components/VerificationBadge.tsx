import { VERIFICATION_LABELS } from '../lib/matching'
import type { VerificationLevel } from '../types'

const CLASS: Record<VerificationLevel, string> = {
  registered: 'badge-registered',
  community_verified: 'badge-community',
  skill_verified: 'badge-skill',
  proven_artisan: 'badge-proven',
}

export function VerificationBadge({ level }: { level: VerificationLevel }) {
  return <span className={`badge ${CLASS[level]}`}>{VERIFICATION_LABELS[level]}</span>
}
