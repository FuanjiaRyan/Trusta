import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { rankArtisans, nextVerificationLevel } from './matching'
import { createSeedState } from './seed'
import type {
  AppState,
  ArtisanProfile,
  Assessment,
  Endorsement,
  Job,
  Review,
  Role,
  ServiceRequest,
  Urgency,
  User,
  VerificationLevel,
} from '../types'

const STORAGE_KEY = 'trusta-mvp-v1'

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch {
    /* ignore */
  }
  return createSeedState()
}

function generatePin() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

interface StoreApi {
  state: AppState
  currentUser: User | null
  currentArtisan: ArtisanProfile | null
  login: (phone: string) => { ok: boolean; error?: string }
  logout: () => void
  register: (input: {
    name: string
    phone: string
    role: Role
  }) => { ok: boolean; error?: string }
  upsertArtisanProfile: (input: Omit<ArtisanProfile, 'id' | 'userId' | 'verificationLevel' | 'completedJobs'> & {
    verificationLevel?: VerificationLevel
  }) => void
  addEndorsement: (input: {
    artisanId: string
    relationship: string
    note: string
  }) => void
  addAssessment: (input: {
    artisanId: string
    tasks: string
    outcome: Assessment['outcome']
    evidence: string
  }) => void
  setVerification: (artisanId: string, level: VerificationLevel) => void
  approveEndorsement: (id: string, approve: boolean) => void
  createRequest: (input: {
    skill: string
    description: string
    location: string
    urgency: Urgency
  }) => ServiceRequest
  getMatchesForRequest: (requestId: string) => ReturnType<typeof rankArtisans>
  sendQuote: (input: {
    requestId: string
    artisanId: string
    quote: number
    quoteNote: string
  }) => void
  acceptJob: (jobId: string) => void
  startJob: (jobId: string) => void
  confirmCompletionWithPin: (jobId: string, pin: string) => { ok: boolean; error?: string }
  artisanConfirmCompletion: (jobId: string) => string
  submitReview: (input: {
    jobId: string
    rating: number
    comment: string
  }) => { ok: boolean; error?: string }
  resetDemo: () => void
  getUser: (id: string) => User | undefined
  getArtisan: (id: string) => ArtisanProfile | undefined
  getArtisanByUser: (userId: string) => ArtisanProfile | undefined
}

const StoreContext = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const currentUser = useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  )

  const currentArtisan = useMemo(
    () =>
      currentUser
        ? state.artisans.find((a) => a.userId === currentUser.id) ?? null
        : null,
    [currentUser, state.artisans],
  )

  const api: StoreApi = {
    state,
    currentUser,
    currentArtisan,

    login(phone) {
      const normalized = phone.trim()
      const user = state.users.find((u) => u.phone === normalized || u.phone.endsWith(normalized))
      if (!user) return { ok: false, error: 'No account found for that phone. Try a demo number.' }
      if (user.status !== 'active') return { ok: false, error: 'Account suspended.' }
      setState((s) => ({ ...s, currentUserId: user.id }))
      return { ok: true }
    },

    logout() {
      setState((s) => ({ ...s, currentUserId: null }))
    },

    register({ name, phone, role }) {
      if (!name.trim() || !phone.trim()) return { ok: false, error: 'Name and phone are required.' }
      if (state.users.some((u) => u.phone === phone.trim())) {
        return { ok: false, error: 'Phone already registered.' }
      }
      const user: User = {
        id: uid('u'),
        name: name.trim(),
        phone: phone.trim(),
        role,
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      setState((s) => ({
        ...s,
        users: [...s.users, user],
        currentUserId: user.id,
      }))
      return { ok: true }
    },

    upsertArtisanProfile(input) {
      if (!currentUser) return
      setState((s) => {
        const existing = s.artisans.find((a) => a.userId === currentUser.id)
        if (existing) {
          return {
            ...s,
            artisans: s.artisans.map((a) =>
              a.id === existing.id
                ? {
                    ...a,
                    ...input,
                    verificationLevel: a.verificationLevel,
                    completedJobs: a.completedJobs,
                  }
                : a,
            ),
          }
        }
        const profile: ArtisanProfile = {
          id: uid('a'),
          userId: currentUser.id,
          trade: input.trade,
          skills: input.skills,
          serviceAreas: input.serviceAreas,
          contactMethod: input.contactMethod,
          availability: input.availability,
          experienceYears: input.experienceYears,
          priceMin: input.priceMin,
          priceMax: input.priceMax,
          bio: input.bio,
          verificationLevel: 'registered',
          completedJobs: 0,
        }
        return { ...s, artisans: [...s.artisans, profile] }
      })
    },

    addEndorsement({ artisanId, relationship, note }) {
      if (!currentUser) return
      const endorsement: Endorsement = {
        id: uid('e'),
        artisanId,
        endorserId: currentUser.id,
        endorserName: currentUser.name,
        relationship,
        note,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      setState((s) => ({ ...s, endorsements: [...s.endorsements, endorsement] }))
    },

    addAssessment({ artisanId, tasks, outcome, evidence }) {
      if (!currentUser) return
      const assessment: Assessment = {
        id: uid('as'),
        artisanId,
        assessorId: currentUser.id,
        assessorName: currentUser.name,
        tasks,
        outcome,
        evidence,
        date: new Date().toISOString(),
      }
      setState((s) => {
        const endorsements = s.endorsements.filter(
          (e) => e.artisanId === artisanId && e.status === 'approved',
        )
        const assessments = [...s.assessments, assessment]
        const hasPass = assessments.some(
          (a) => a.artisanId === artisanId && a.outcome === 'pass',
        )
        const artisan = s.artisans.find((a) => a.id === artisanId)
        const level = artisan
          ? nextVerificationLevel(
              artisan.verificationLevel,
              hasPass,
              endorsements.length,
              artisan.completedJobs,
            )
          : 'registered'

        return {
          ...s,
          assessments,
          artisans: s.artisans.map((a) =>
            a.id === artisanId ? { ...a, verificationLevel: level } : a,
          ),
          reputationEvents: [
            ...s.reputationEvents,
            {
              id: uid('r'),
              subjectId: artisanId,
              type: 'assessment_recorded',
              evidenceRef: assessment.id,
              actorId: currentUser.id,
              timestamp: new Date().toISOString(),
            },
          ],
        }
      })
    },

    setVerification(artisanId, level) {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'verifier')) return
      setState((s) => ({
        ...s,
        artisans: s.artisans.map((a) =>
          a.id === artisanId ? { ...a, verificationLevel: level } : a,
        ),
        reputationEvents: [
          ...s.reputationEvents,
          {
            id: uid('r'),
            subjectId: artisanId,
            type: 'verification_set',
            evidenceRef: level,
            actorId: currentUser.id,
            timestamp: new Date().toISOString(),
          },
        ],
      }))
    },

    approveEndorsement(id, approve) {
      setState((s) => {
        const endorsements = s.endorsements.map((e) =>
          e.id === id
            ? { ...e, status: (approve ? 'approved' : 'rejected') as Endorsement['status'] }
            : e,
        )
        const target = endorsements.find((e) => e.id === id)
        if (!target || !approve) return { ...s, endorsements }

        const artisan = s.artisans.find((a) => a.id === target.artisanId)
        if (!artisan) return { ...s, endorsements }

        const approvedCount = endorsements.filter(
          (e) => e.artisanId === target.artisanId && e.status === 'approved',
        ).length
        const hasPass = s.assessments.some(
          (a) => a.artisanId === target.artisanId && a.outcome === 'pass',
        )
        const level = nextVerificationLevel(
          artisan.verificationLevel,
          hasPass,
          approvedCount,
          artisan.completedJobs,
        )

        return {
          ...s,
          endorsements,
          artisans: s.artisans.map((a) =>
            a.id === artisan.id ? { ...a, verificationLevel: level } : a,
          ),
        }
      })
    },

    createRequest({ skill, description, location, urgency }) {
      if (!currentUser) throw new Error('Not logged in')
      const request: ServiceRequest = {
        id: uid('req'),
        customerId: currentUser.id,
        customerName: currentUser.name,
        skill,
        description,
        location,
        urgency,
        status: 'open',
        createdAt: new Date().toISOString(),
      }
      const matches = rankArtisans(request, state.artisans)
      setState((s) => ({
        ...s,
        requests: [request, ...s.requests],
        matches: [...matches, ...s.matches.filter((m) => m.requestId !== request.id)],
      }))
      return request
    },

    getMatchesForRequest(requestId) {
      const request = state.requests.find((r) => r.id === requestId)
      if (!request) return []
      return rankArtisans(request, state.artisans)
    },

    sendQuote({ requestId, artisanId, quote, quoteNote }) {
      const pin = generatePin()
      const job: Job = {
        id: uid('job'),
        requestId,
        customerId: state.requests.find((r) => r.id === requestId)?.customerId ?? '',
        artisanId,
        quote,
        quoteNote,
        status: 'quoted',
        completionPin: pin,
        pinUsed: false,
        createdAt: new Date().toISOString(),
      }
      setState((s) => ({
        ...s,
        jobs: [job, ...s.jobs],
        requests: s.requests.map((r) =>
          r.id === requestId ? { ...r, status: 'quoted' } : r,
        ),
      }))
    },

    acceptJob(jobId) {
      setState((s) => ({
        ...s,
        jobs: s.jobs.map((j) =>
          j.id === jobId
            ? { ...j, status: 'accepted', acceptedAt: new Date().toISOString() }
            : j,
        ),
        requests: s.requests.map((r) => {
          const job = s.jobs.find((j) => j.id === jobId)
          return job && r.id === job.requestId ? { ...r, status: 'accepted' } : r
        }),
      }))
    },

    startJob(jobId) {
      setState((s) => ({
        ...s,
        jobs: s.jobs.map((j) =>
          j.id === jobId ? { ...j, status: 'in_progress' } : j,
        ),
        requests: s.requests.map((r) => {
          const job = s.jobs.find((j) => j.id === jobId)
          return job && r.id === job.requestId ? { ...r, status: 'in_progress' } : r
        }),
      }))
    },

    artisanConfirmCompletion(jobId) {
      let pin = ''
      setState((s) => {
        const job = s.jobs.find((j) => j.id === jobId)
        pin = job?.completionPin ?? generatePin()
        return {
          ...s,
          jobs: s.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  completionPin: pin,
                  status: j.status === 'quoted' ? 'accepted' : j.status,
                }
              : j,
          ),
        }
      })
      return pin
    },

    confirmCompletionWithPin(jobId, pin) {
      const job = state.jobs.find((j) => j.id === jobId)
      if (!job) return { ok: false, error: 'Job not found.' }
      if (job.pinUsed || job.status === 'completed') {
        return { ok: false, error: 'Completion already recorded for this job.' }
      }
      if (!job.completionPin || job.completionPin !== pin.trim()) {
        return { ok: false, error: 'Invalid completion PIN.' }
      }

      setState((s) => ({
        ...s,
        jobs: s.jobs.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: 'completed',
                pinUsed: true,
                completedAt: new Date().toISOString(),
              }
            : j,
        ),
        requests: s.requests.map((r) =>
          r.id === job.requestId ? { ...r, status: 'completed' } : r,
        ),
        artisans: s.artisans.map((a) => {
          if (a.id !== job.artisanId) return a
          const completedJobs = a.completedJobs + 1
          const approved = s.endorsements.filter(
            (e) => e.artisanId === a.id && e.status === 'approved',
          ).length
          const hasPass = s.assessments.some(
            (x) => x.artisanId === a.id && x.outcome === 'pass',
          )
          return {
            ...a,
            completedJobs,
            verificationLevel: nextVerificationLevel(
              a.verificationLevel,
              hasPass,
              approved,
              completedJobs,
            ),
          }
        }),
        reputationEvents: [
          ...s.reputationEvents,
          {
            id: uid('r'),
            subjectId: job.artisanId,
            type: 'job_completed',
            evidenceRef: jobId,
            actorId: state.currentUserId ?? 'system',
            timestamp: new Date().toISOString(),
          },
        ],
      }))
      return { ok: true }
    },

    submitReview({ jobId, rating, comment }) {
      if (!currentUser) return { ok: false, error: 'Not logged in.' }
      const job = state.jobs.find((j) => j.id === jobId)
      if (!job) return { ok: false, error: 'Job not found.' }
      if (job.customerId !== currentUser.id) {
        return { ok: false, error: 'Only the linked customer can review this job.' }
      }
      if (job.status !== 'completed') {
        return { ok: false, error: 'Reviews are only allowed after completion.' }
      }
      if (state.reviews.some((r) => r.jobId === jobId)) {
        return { ok: false, error: 'A review already exists for this job.' }
      }

      const review: Review = {
        id: uid('rev'),
        jobId,
        customerId: currentUser.id,
        artisanId: job.artisanId,
        rating,
        comment,
        moderated: false,
        createdAt: new Date().toISOString(),
      }

      setState((s) => ({
        ...s,
        reviews: [review, ...s.reviews],
        reputationEvents: [
          ...s.reputationEvents,
          {
            id: uid('r'),
            subjectId: job.artisanId,
            type: 'review_submitted',
            evidenceRef: review.id,
            actorId: currentUser.id,
            timestamp: new Date().toISOString(),
          },
        ],
      }))
      return { ok: true }
    },

    resetDemo() {
      const fresh = createSeedState()
      setState(fresh)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh))
    },

    getUser(id) {
      return state.users.find((u) => u.id === id)
    },
    getArtisan(id) {
      return state.artisans.find((a) => a.id === id)
    },
    getArtisanByUser(userId) {
      return state.artisans.find((a) => a.userId === userId)
    },
  }

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
