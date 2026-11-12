# TRUSTA

Making skills visible. Making trust verifiable.

Hackathon MVP for plumbing services in Buea, Cameroon — artisan verification, customer requests, explainable matching, completion PIN, and job-verified reviews.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Demo walkthrough

1. **Sign in** → Customer (Amina) → submit an urgent pipe-repair request in Molyko.
2. Review ranked matches with score breakdowns.
3. Sign out → **Artisan Paul** → send a quote.
4. Back as **Customer** → accept quote.
5. As **Paul** → reveal completion PIN → share with customer.
6. As **Customer** → enter PIN → submit verified review.
7. As **Verifier** → record assessments / approve endorsements.

All demo profiles are fictional. Data persists in `localStorage` (reset from the Sign in page).

## Stack

- React + Vite + TypeScript
- Client-side store mirroring the SRS Firestore collections
- Weighted matching: skill 30% · verification 25% · history 20% · distance 15% · availability 10%
