import os
from datetime import datetime, timezone

import stripe
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Request

from db import db, pub
from models import CheckoutReq
from routes_orders import find_valid_discount, _discount_value

payments_router = APIRouter(prefix="/api", tags=["payments"])
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
CURRENCY = "eur"


def _effective_price(p: dict) -> float:
    sp = p.get("sale_price")
    return float(sp) if sp else float(p.get("price", 0))


async def _mark_paid(session_id: str, session_obj=None):
    guard = {"session_id": session_id, "payment_status": {"$ne": "paid"}}
    update = {"status": "confirmed", "payment_status": "paid", "updated_at": datetime.now(timezone.utc)}
    if session_obj is not None:
        update["stripe_payment_intent_id"] = session_obj.get("payment_intent")
    res = await db.orders.update_one(guard, {"$set": update})
    if res.modified_count:
        order = await db.orders.find_one({"session_id": session_id})
        if order and not order.get("stock_applied"):
            for item in order.get("items", []):
                await db.products.update_one(
                    {"_id": ObjectId(item["product_id"]), "variants.sku": item["sku"]},
                    {"$inc": {"variants.$.stock": -item["qty"]}})
            await db.orders.update_one({"_id": order["_id"]}, {"$set": {"stock_applied": True}})
        if order and order.get("discount_code"):
            await db.discounts.update_one({"code": order["discount_code"]}, {"$inc": {"used_count": 1}})


@payments_router.post("/payments/checkout")
async def create_checkout(req: CheckoutReq):
    if not req.items:
        raise HTTPException(400, "Your cart is empty")
    line_items = []
    order_items = []
    subtotal = 0.0
    for item in req.items:
        try:
            p = await db.products.find_one({"_id": ObjectId(item.product_id)})
        except Exception:
            p = None
        if not p or p.get("status") != "published":
            raise HTTPException(400, "A product in your cart is no longer available")
        variant = next((v for v in p.get("variants", []) if v.get("sku") == item.sku), None)
        if not variant:
            raise HTTPException(400, f"Please choose a size/colour for {p['name']}")
        if variant.get("stock", 0) < item.qty:
            raise HTTPException(400, f"{p['name']} ({variant.get('size')}/{variant.get('color')}) is out of stock")
        unit = _effective_price(p)
        subtotal += unit * item.qty
        order_items.append({
            "product_id": str(p["_id"]), "name": p["name"], "sku": item.sku,
            "size": variant.get("size", ""), "color": variant.get("color", ""),
            "qty": item.qty, "unit_price": unit,
            "image": variant.get("image") or (p.get("images") or [None])[0],
        })
        line_items.append({
            "price_data": {"currency": CURRENCY, "unit_amount": int(round(unit * 100)),
                           "product_data": {"name": f"{p['name']} — {variant.get('size','')}/{variant.get('color','')}"}},
            "quantity": item.qty,
        })

    discount_code, discount_amt = None, 0.0
    stripe_discounts = []
    if req.discount_code:
        d, err = await find_valid_discount(req.discount_code, subtotal)
        if err:
            raise HTTPException(400, err)
        discount_code = d["code"]
        discount_amt = _discount_value(d, subtotal)
        if d["type"] == "percent":
            coupon = stripe.Coupon.create(percent_off=d["value"], duration="once")
        else:
            coupon = stripe.Coupon.create(amount_off=int(round(discount_amt * 100)), currency=CURRENCY, duration="once")
        stripe_discounts = [{"coupon": coupon.id}]

    total = round(subtotal - discount_amt, 2)
    kwargs = dict(
        line_items=line_items, mode="payment",
        success_url=f"{req.origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{req.origin_url}/payment/cancel",
        customer_email=req.customer.email,
        metadata={"source": "pimpsout_store"},
    )
    if stripe_discounts:
        kwargs["discounts"] = stripe_discounts
    try:
        session = stripe.checkout.Session.create(**kwargs, automatic_tax={"enabled": True},
                                                 billing_address_collection="required")
    except stripe.error.InvalidRequestError:
        session = stripe.checkout.Session.create(**kwargs)

    order = {
        "items": order_items, "subtotal": round(subtotal, 2),
        "discount_code": discount_code, "discount_amount": discount_amt,
        "total": total, "currency": CURRENCY.upper(),
        "customer": req.customer.model_dump(),
        "status": "awaiting_payment", "payment_status": "pending",
        "session_id": session.id, "stock_applied": False,
        "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc),
    }
    await db.orders.insert_one(order)
    await db.payment_transactions.insert_one({
        "session_id": session.id, "amount": int(round(total * 100)), "currency": CURRENCY,
        "status": "initiated", "payment_status": "pending",
        "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)})
    return {"checkout_url": session.url, "session_id": session.id}


@payments_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str):
    order = await db.orders.find_one({"session_id": session_id})
    if not order:
        raise HTTPException(404, "Order not found")
    if order.get("payment_status") != "paid":
        try:
            s = stripe.checkout.Session.retrieve(session_id)
            if s.payment_status == "paid" or s.status == "complete":
                await _mark_paid(session_id, s.to_dict())
            elif s.status == "expired":
                await db.orders.update_one({"session_id": session_id},
                    {"$set": {"status": "cancelled", "payment_status": "expired",
                              "updated_at": datetime.now(timezone.utc)}})
        except stripe.error.StripeError:
            pass
        order = await db.orders.find_one({"session_id": session_id})
    return {"session_id": session_id, "status": order["status"], "payment_status": order["payment_status"]}


@payments_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")
    obj, t = event["data"]["object"], event["type"]
    if t == "checkout.session.completed":
        await _mark_paid(obj["id"], obj)
        await db.payment_transactions.update_one({"session_id": obj["id"]},
            {"$set": {"status": "completed", "payment_status": "paid", "updated_at": datetime.now(timezone.utc)}})
    elif t == "checkout.session.expired":
        await db.orders.update_one({"session_id": obj["id"], "payment_status": {"$ne": "paid"}},
            {"$set": {"status": "cancelled", "payment_status": "expired", "updated_at": datetime.now(timezone.utc)}})
    elif t == "charge.refunded":
        await db.orders.update_one({"stripe_payment_intent_id": obj.get("payment_intent")},
            {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": datetime.now(timezone.utc)}})
    return {"status": "ok"}
