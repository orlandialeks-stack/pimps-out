# PIMPS OUT — Ownership & Independence Report

Honest status of every component, what you own, and what depends on external services.

## 1. What you own and control

- **Source code** — 100% yours, in your GitHub repository. No proprietary Emergent frameworks: React + FastAPI + MongoDB, all open source.
- **Brand assets** — your logo lives in `frontend/public/assets/`.
- **Data** — all products, orders, customers, leads and content live in a standard MongoDB database you can export anytime (`docs/DATABASE.md`).
- **Domain** — register it at any registrar in your name and point it at your hosting.

## 2. What currently depends on Emergent (and how to remove each dependency)

| Component | Current state | How to become independent |
|---|---|---|
| Hosting | Emergent preview/deploy | Deploy frontend to Vercel/Netlify, backend to Render/Railway (README § Deploy) |
| Database | Local MongoDB in the Emergent container | Move to MongoDB Atlas (free tier) — 15 min, see `docs/DATABASE.md` |
| AI assistant | Emergent Universal Key (billed to your Emergent balance) | Create your own OpenAI account, set your key — two functions to point at it in `routes_assistant.py` |
| Stripe | Claimable test sandbox provisioned by Emergent | Claim it (one click — link sent by Stripe email / Payments tab) making it YOUR Stripe account; or drop in keys from your own existing Stripe account |
| Email notifications | Not wired yet | Add Resend/SendGrid with your own account when ready |
| Product photo storage | Emergent object storage | Migrate to your own S3-compatible bucket — procedure in `docs/DATABASE.md` |

## 3. Ongoing costs (all optional until you launch)

- Domain: ~€10–15/year (your registrar)
- MongoDB Atlas: free tier covers launch
- Render/Railway backend: free–$7/month
- Vercel/Netlify frontend: free tier
- OpenAI (assistant): pay-per-use, a few cents per conversation
- Stripe: no monthly fee, ~1.5–2.9% + €0.25 per successful charge (test mode is free forever)

## 4. Can the site run without Emergent?

**Yes.** Nothing in the code calls Emergent infrastructure at runtime except the AI assistant's Universal Key — and that is a single env var you can replace with your own OpenAI key. Everything else (database, payments, auth, storage) is standard and self-hostable.

## 5. Transfer checklist (move to your own hosting)

1. Push/clone this repo (already on your GitHub).
2. Create MongoDB Atlas cluster → export current data (`docs/DATABASE.md`) → import.
3. Deploy backend (Render/Railway) with env vars from `backend/.env.example`.
4. Deploy frontend (Vercel/Netlify) with `REACT_APP_BACKEND_URL` pointing at the backend.
5. Update Stripe webhook URL to the new backend; swap in your own Stripe keys if not using the claimed sandbox.
6. Point your domain DNS at the frontend host; set `FRONTEND_URL` on the backend to match.
7. Replace `EMERGENT_LLM_KEY` with your own OpenAI key (or keep using the Universal Key — it also works off-platform only while hosted here).

## 6. Backup & restore

- Database: `mongodump` / `mongorestore` — full procedure in `docs/DATABASE.md`. Atlas also offers automated snapshots.
- Uploads (product photos): back up the `backend/uploads/` folder (plain files — copy anywhere).
- Code: GitHub is the backup.

## 7. Retaining control

- Domain: registered in YOUR name at your registrar — never transfer it to anyone.
- Source: your GitHub account owns the repo.
- Customer data: lives only in your MongoDB — export it weekly (one command) for your own backups.
