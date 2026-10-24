# Database Guide — PIMPS OUT

MongoDB. One database (name from `DB_NAME`), plain JSON-like documents, no proprietary formats.

## Collections (schema)

**users** — `{ email (unique), password_hash (bcrypt), name, role: "admin"|"customer", created_at }`

**products** — `{ name, slug (unique), description, price, sale_price, category, collection, images: ["/api/uploads/…"], variants: [{ sku, size, color, color_hex, stock, image }], material, gsm, fit, care, size_guide, status: "draft"|"published", featured, sort_order, created_at, updated_at }`

**orders** — `{ items: [{ product_id, name, sku, size, color, qty, unit_price, image }], subtotal, discount_code, discount_amount, total, currency: "EUR", customer: { email, name, line1, city, postal_code, country }, status, payment_status, session_id (unique Stripe session), stripe_payment_intent_id, tracking_code, stock_applied, created_at, updated_at }`

**discounts** — `{ code (unique, uppercase), type: "percent"|"fixed", value, min_subtotal, expires_at, active, usage_limit, used_count }`

**taxonomies** — `{ type: "category"|"collection", name, description }`

**site_content** — single document `key: "site"`: hero texts/images, coming-soon config, marquee, about, faq[], shipping_returns, contact/socials, newsletter.

**leads** — `{ email (unique), source: "newsletter"|"prelaunch", created_at }`
**messages** — contact-form messages. **assistant_logs** — AI chat history. **payment_transactions** — Stripe session audit trail. **login_attempts** — brute-force lockout counters.

## Back up (export everything)

```bash
# From the machine running MongoDB (or against Atlas with your connection string)
mongodump --uri="YOUR_MONGO_URL" --db=YOUR_DB_NAME --out=./backup-$(date +%F)
```
This creates plain BSON/JSON files you fully own. For a human-readable export of one collection:
```bash
mongoexport --uri="YOUR_MONGO_URL" --db=YOUR_DB_NAME --collection=products --out=products.json --jsonArray
```

## Restore / migrate to a new host (e.g. MongoDB Atlas)

1. Create a free cluster at https://cloud.mongodb.com → Database → Connect → get your `mongodb+srv://…` string.
2. Restore the backup:
```bash
mongorestore --uri="YOUR_ATLAS_URL" --db=YOUR_DB_NAME ./backup-YYYY-MM-DD/YOUR_DB_NAME
```
3. Set `MONGO_URL` / `DB_NAME` in your new backend's environment. Restart — done.

## Product images

Images are stored in Emergent object storage (uploaded via `POST /api/admin/uploads`, served via `GET /api/files/...`, references tracked in the `files` collection with soft-delete). To migrate: list `db.files`, download each object, and re-upload to your own S3-compatible bucket, then update the stored paths.

## Moving to PostgreSQL/Supabase instead?

Possible but unnecessary for portability — MongoDB Atlas is as standard and exportable as Postgres. If you ever want a relational store, the models above map cleanly to tables; plan a one-time script that reads each collection and inserts rows.
