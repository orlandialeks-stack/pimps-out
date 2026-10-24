# PIMPS OUT — Premium Streetwear E-Commerce

**We don't follow trends. We create our own rules.**

A complete, portable e-commerce platform: storefront, admin dashboard, AI shopping assistant (text + voice), Stripe checkout, and full content management.

## Stack (standard & portable)

| Layer | Technology | Why it's portable |
|---|---|---|
| Frontend | React 19 (Create React App / craco), Tailwind CSS, Framer Motion, Lenis | Builds to static files — deployable on Vercel, Netlify, Cloudflare Pages, any static host |
| Backend | Python FastAPI | Runs anywhere Python runs — Render, Railway, Fly.io, a VPS, Docker |
| Database | MongoDB | Industry standard. Free hosted tier at MongoDB Atlas; local via Docker. Export with `mongodump` |
| Payments | Stripe | Your own Stripe account, test + live modes |
| AI assistant | OpenAI (chat / TTS / Whisper) via one server-side key | Swap the key for your own OpenAI key anytime |

> Note on databases: this project uses **MongoDB**, not PostgreSQL/Supabase. MongoDB is equally standard and portable — hosted free on MongoDB Atlas, fully exportable and importable by you at any time (see `docs/DATABASE.md`). No proprietary lock-in.

## Project structure

```
backend/            FastAPI API (all routes under /api)
  server.py         app entry, startup seeds (admin + default site content)
  auth.py           JWT auth, roles (admin/customer), admin seeding
  routes_products.py  products, variants, uploads, categories/collections
  routes_orders.py    orders, discounts, refunds
  routes_payments.py  Stripe checkout, webhooks, payment status
  routes_content.py   site content, FAQ, leads, contact messages
  routes_assistant.py AI chat (streaming), text-to-speech, speech-to-text
frontend/           React storefront + admin dashboard (/admin)
docs/               Ownership report, database guide, first-product guide
```

## Run locally

Prerequisites: Node 18+, Python 3.10+, MongoDB (local or a free Atlas URL).

```bash
# Backend
cd backend
cp .env.example .env          # fill in values
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# Frontend (new terminal)
cd frontend
cp .env.example .env          # point REACT_APP_BACKEND_URL at your backend
yarn install
yarn start                    # http://localhost:3000
```

On first start the backend creates the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and seeds the default site content. Log in at `/admin`.

## Deploy elsewhere (summary)

1. **Database**: create a free cluster at [MongoDB Atlas](https://cloud.mongodb.com), get the connection string → `MONGO_URL`.
2. **Backend**: Render / Railway / Fly.io — build `pip install -r requirements.txt`, start `uvicorn server:app --host 0.0.0.0 --port $PORT`. Set all env vars from `.env.example`. Persistent disk recommended for `backend/uploads/` (product photos) — or move uploads to S3-compatible storage later.
3. **Frontend**: `yarn build` produces static files in `frontend/build` — deploy to Vercel/Netlify. Set `REACT_APP_BACKEND_URL` to your backend's public URL and rebuild. Set backend `FRONTEND_URL` to your frontend domain (CORS + cookies).
4. **Stripe**: add your own keys; register the webhook `https://YOUR-BACKEND/api/stripe/webhook` for events `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`.
5. **AI**: set `EMERGENT_LLM_KEY` (or adapt `routes_assistant.py` to your own OpenAI key — two functions, `_openai()` and the chat route).

Full details in `docs/OWNERSHIP.md` and `docs/DATABASE.md`.

## Environment variables

Every secret lives in `.env` files (never committed — see `.gitignore`). See `backend/.env.example` and `frontend/.env.example` for the complete documented list.

## Security notes

- Admin endpoints check the `admin` role server-side on every request.
- Passwords are bcrypt-hashed; sessions use httpOnly JWT cookies; login has brute-force lockout (5 tries / 15 min).
- Stripe card data never touches this server; payment confirmation is verified server-side via webhook + API polling.
- The AI assistant only sees published products and your published policies — it cannot invent stock or prices.
