# Test Credentials — PIMPS OUT

## Admin (role: admin)
- Email: admin@pimpsout.com
- Password: PimpsOut2026!
- Login at: /account (or /admin which has its own login form)
- Admin dashboard: /admin

## Test customer (role: customer)
- Not seeded — register any account via /account to test customer flows.

## Auth endpoints
- POST /api/auth/register {email, password, name}
- POST /api/auth/login {email, password}
- POST /api/auth/logout
- GET  /api/auth/me
- POST /api/auth/refresh

## Payments (Stripe TEST mode — sandbox)
- Test card: 4242 4242 4242 4242, any future expiry, any CVC
- Never charges real money while STRIPE_MODE=test

## AI Assistant
- Powered by Emergent Universal Key (EMERGENT_LLM_KEY) — OpenAI gpt-5.4-mini chat, tts-1 voice, whisper-1 transcription
- Assistant panel: floating button bottom-right on every page
