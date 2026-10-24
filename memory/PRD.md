# PIMPS OUT — PRD

## Original problem statement
Build a complete, premium streetwear e-commerce website for PIMPS OUT ("We don't follow trends. We create our own rules."), inspired by scuffers.com / nude-project.com / coldcultureworldwide.com without copying. No products exist yet — build the full product-management infrastructure with a pre-launch state. Requirements: admin dashboard (products/variants/stock/pricing/orders/content), multilingual AI shopping assistant with voice (EN/IT/ES/RU), Stripe e-commerce, customer accounts, wishlist, security, and full independence/portability from Emergent (GitHub ownership, migration docs, own accounts).

## Stack
React 19 + Tailwind + Framer Motion + Lenis (frontend) · FastAPI + Motor (backend) · MongoDB (database) · Stripe test sandbox (payments) · OpenAI via Emergent Universal Key (assistant: gpt-5.4-mini chat, tts-1, whisper-1).

## User personas
- Store owner (admin): manages catalogue, orders, content, discounts, leads without code.
- Streetwear customer: browses, chats with assistant, buys with variants, tracks orders.
- Pre-launch visitor: joins early-access list.

## Implemented (2026-10-24)
- Kinetic hero (masked line reveal), editorial marquee, bento editorial grid, Lenis smooth scroll, dark obsidian design system, user's real logo (transparent + favicon).
- Homepage, Shop (filters, empty pre-launch state), Product detail (gallery, colour/size variants, stock, specs accordions), About/FAQ/Shipping/Contact, Cart drawer, Checkout, Payment success/cancel, Account (auth, orders, wishlist).
- Admin dashboard: metrics, products CRUD + photos + variants + draft/publish/featured + preview, orders (status, tracking, refund), discount codes, full site content editor (hero, coming-soon toggle + countdown, marquee, about, FAQ, shipping, contact, socials, newsletter), leads & messages.
- Auth: JWT httpOnly cookies, bcrypt, roles, brute-force lockout, admin seed.
- Stripe: Flow A sandbox provisioned (acct_1UTNtXPWKha7jswQ), dynamic checkout from server-validated cart, discount coupons, webhook + status polling, stock decrement on payment, refunds. TEST mode.
- AI assistant: streaming chat with real catalogue/policy injection (never invents products; pre-launch aware), 4 languages, voice (TTS replies + mic STT), escalation to contact.
- Portability: GitHub-ready repo (no secrets committed, .env.example files), README, docs/OWNERSHIP.md, docs/DATABASE.md, docs/ADD_FIRST_PRODUCT.md.
- Uploads: Emergent object storage (deployment-safe), served via /api/files, soft-delete tracking in files collection.

## Verified
- Admin login, taxonomy create, product create/publish/list/delete, discount create, checkout session creation, payment status polling, leads, assistant chat streaming, TTS (real MP3), STT (round-trip transcription correct), admin dashboard UI, homepage 375/768/1366, shop empty state.

## Backlog
- P0: Claim Stripe sandbox (user action, onboarding link delivered) · full end-to-end test purchase with 4242 card.
- P1: Order confirmation + shipping emails (Resend) · customer password reset email flow · variant-level image picker in admin · product search UI.
- P2: Lookbook page builder · multi-currency · analytics dashboard charts · S3 object storage for uploads · automated DB backups.

## Next tasks
1. ~~Push to GitHub~~ — DONE 2026-10-24: https://github.com/orlandialeks-stack/pimps-out (main branch, 130 files, no secrets committed).
2. Optional: seed a labelled demo product at user request.
3. Wire email service when user provides preference.
