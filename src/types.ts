export type Role = 'customer' | 'artisan' | 'verifier' | 'admin'

export type VerificationLevel =
  | 'registered'
  | 'community_verified'
  | 'skill_verified'
  | 'proven_artisan'

export type RequestStatus =
  | 'open'
  | 'matched'
  | 'quoted'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type JobStatus = 'quoted' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'

export type Urgency = 'low' | 'normal' | 'urgent'

export interface User {
  id: string
  phone: string
  name: string
  role: Role
  status: 'active' | 'suspended'
  createdAt: string
}

export interface ArtisanProfile {
  id: string
  userId: string
  trade: string
  skills: string[]
  serviceAreas: string[]
  contactMethod: string
  availability: 'available' | 'busy' | 'offline'
  experienceYears: number
  priceMin: number
  priceMax: number
  verificationLevel: VerificationLevel
  completedJobs: number
  bio: string
}

export interface Endorsement {
  id: string
  artisanId: string
  endorserId: string
  endorserName: string
  relationship: string
  note: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export interface Assessment {
  id: string
  artisanId: string
  assessorId: string
  assessorName: string
  tasks: string
  outcome: 'pass' | 'fail' | 'partial'
  evidence: string
  date: string
}

export interface ServiceRequest {
  id: string
  customerId: string
  customerName: string
  skill: string
  description: string
  location: string
  urgency: Urgency
  status: RequestStatus
  createdAt: string
}

export interface MatchScore {
  requestId: string
  artisanId: string
  eligible: boolean
  ineligibleReason?: string
  total: number
  breakdown: {
    skill: number
    verification: number
    history: number
    distance: number
    availability: number
  }
  reasons: string[]
  generatedAt: string
}

export interface Job {
  id: string
  requestId: string
  customerId: string
  artisanId: string
  quote: number
  quoteNote: string
  status: JobStatus
  completionPin: string | null
  pinUsed: boolean
  createdAt: string
  acceptedAt?: string
  completedAt?: string
}

export interface Review {
  id: string
  jobId: string
  customerId: string
  artisanId: string
  rating: number
  comment: string
  moderated: boolean
  createdAt: string
}

export interface ReputationEvent {
  id: string
  subjectId: string
  type: string
  evidenceRef: string
  actorId: string
  timestamp: string
}

export interface AppState {
  users: User[]
  artisans: ArtisanProfile[]
  endorsements: Endorsement[]
  assessments: Assessment[]
  requests: ServiceRequest[]
  matches: MatchScore[]
  jobs: Job[]
  reviews: Review[]
  reputationEvents: ReputationEvent[]
  currentUserId: string | null
}
