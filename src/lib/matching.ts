import type { ArtisanProfile, MatchScore, ServiceRequest, VerificationLevel } from '../types'

const VERIFICATION_SCORE: Record<VerificationLevel, number> = {
  registered: 25,
  community_verified: 50,
  skill_verified: 75,
  proven_artisan: 100,
}

const WEIGHTS = {
  skill: 0.3,
  verification: 0.25,
  history: 0.2,
  distance: 0.15,
  availability: 0.1,
}

const AREA_NEARBY: Record<string, string[]> = {
  molyko: ['molyko', 'checkpoint', 'bonduma', 'great soppo'],
  checkpoint: ['checkpoint', 'molyko', 'bomaka'],
  bomaka: ['bomaka', 'checkpoint', 'mile 16'],
  'mile 16': ['mile 16', 'bomaka', 'bolifamba'],
  bonduma: ['bonduma', 'molyko', 'buea town'],
  'buea town': ['buea town', 'bonduma', 'great soppo'],
  'great soppo': ['great soppo', 'molyko', 'buea town'],
}

function normalize(s: string) {
  return s.trim().toLowerCase()
}

function skillScore(artisan: ArtisanProfile, skill: string): number {
  const needed = normalize(skill)
  const skills = artisan.skills.map(normalize)
  if (skills.some((s) => s.includes(needed) || needed.includes(s))) return 100
  if (normalize(artisan.trade).includes(needed) || needed.includes('plumb')) return 70
  return 0
}

function distanceScore(artisan: ArtisanProfile, location: string): number {
  const loc = normalize(location)
  const areas = artisan.serviceAreas.map(normalize)
  if (areas.some((a) => loc.includes(a) || a.includes(loc))) return 100

  for (const area of areas) {
    const nearby = AREA_NEARBY[area] ?? []
    if (nearby.some((n) => loc.includes(n))) return 70
  }
  if (areas.some((a) => a.includes('buea') || loc.includes('buea'))) return 40
  return 15
}

function historyScore(completedJobs: number): number {
  if (completedJobs >= 10) return 100
  if (completedJobs >= 5) return 80
  if (completedJobs >= 2) return 60
  if (completedJobs >= 1) return 40
  return 10
}

function availabilityScore(availability: ArtisanProfile['availability']): number {
  if (availability === 'available') return 100
  if (availability === 'busy') return 40
  return 0
}

export function rankArtisans(
  request: ServiceRequest,
  artisans: ArtisanProfile[],
): MatchScore[] {
  const now = new Date().toISOString()

  return artisans
    .map((artisan) => {
      const skill = skillScore(artisan, request.skill)
      const verification = VERIFICATION_SCORE[artisan.verificationLevel]
      const history = historyScore(artisan.completedJobs)
      const distance = distanceScore(artisan, request.location)
      const availability = availabilityScore(artisan.availability)

      const reasons: string[] = []
      let eligible = true
      let ineligibleReason: string | undefined

      if (skill < 40) {
        eligible = false
        ineligibleReason = 'Does not offer the requested plumbing skill'
      } else if (artisan.availability === 'offline') {
        eligible = false
        ineligibleReason = 'Currently offline'
      } else if (distance < 20) {
        eligible = false
        ineligibleReason = 'Outside requested service area'
      }

      if (eligible) {
        if (skill >= 90) reasons.push('Strong skill match for this job')
        else reasons.push('Offers related plumbing skills')

        if (artisan.verificationLevel === 'proven_artisan') {
          reasons.push('Proven Artisan with confirmed job history')
        } else if (artisan.verificationLevel === 'skill_verified') {
          reasons.push('Skill Verified through practical assessment')
        } else if (artisan.verificationLevel === 'community_verified') {
          reasons.push('Community Verified local presence')
        } else {
          reasons.push('Registered profile — not yet skill-verified')
        }

        if (history >= 60) reasons.push(`${artisan.completedJobs} verified completed jobs`)
        if (distance >= 70) reasons.push(`Serves ${request.location} / nearby areas`)
        if (availability === 100) reasons.push('Available now')
        else if (availability === 40) reasons.push('Busy but can respond')
      }

      const total = Math.round(
        skill * WEIGHTS.skill +
          verification * WEIGHTS.verification +
          history * WEIGHTS.history +
          distance * WEIGHTS.distance +
          availability * WEIGHTS.availability,
      )

      return {
        requestId: request.id,
        artisanId: artisan.id,
        eligible,
        ineligibleReason,
        total: eligible ? total : 0,
        breakdown: { skill, verification, history, distance, availability },
        reasons,
        generatedAt: now,
      } satisfies MatchScore
    })
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1
      return b.total - a.total
    })
}

export const VERIFICATION_LABELS: Record<VerificationLevel, string> = {
  registered: 'Registered',
  community_verified: 'Community Verified',
  skill_verified: 'Skill Verified',
  proven_artisan: 'Proven Artisan',
}

export function nextVerificationLevel(
  current: VerificationLevel,
  hasAssessmentPass: boolean,
  approvedEndorsements: number,
  completedJobs: number,
): VerificationLevel {
  if (completedJobs >= 3 && hasAssessmentPass && approvedEndorsements >= 2) {
    return 'proven_artisan'
  }
  if (hasAssessmentPass && approvedEndorsements >= 2) return 'skill_verified'
  if (approvedEndorsements >= 1 || hasAssessmentPass) return 'community_verified'
  return current === 'registered' ? 'registered' : current
}
