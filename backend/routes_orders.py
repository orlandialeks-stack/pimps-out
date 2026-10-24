from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends

from db import db, pub, pubs
from models import DiscountIn, DiscountCheck, OrderUpdate
from auth import require_admin, get_current_user

orders_router = APIRouter(prefix="/api", tags=["orders"])


def _discount_value(d: dict, subtotal: float) -> float:
    if d["type"] == "percent":
        return round(subtotal * d["value"] / 100, 2)
    return min(round(d["value"], 2), subtotal)


async def find_valid_discount(code: str, subtotal: float):
    d = await db.discounts.find_one({"code": code.upper().strip(), "active": True})
    if not d:
        return None, "Invalid discount code"
    if d.get("expires_at"):
        try:
            if datetime.fromisoformat(d["expires_at"].replace("Z", "+00:00")) < datetime.now(timezone.utc):
                return None, "This discount code has expired"
        except ValueError:
            pass
    if d.get("usage_limit") and d.get("used_count", 0) >= d["usage_limit"]:
        return None, "This discount code has been fully used"
    if subtotal < d.get("min_subtotal", 0):
        return None, f"Minimum order of EUR {d['min_subtotal']:.2f} required"
    return d, None


@orders_router.post("/orders/check-discount")
async def check_discount(data: DiscountCheck):
    d, err = await find_valid_discount(data.code, data.subtotal)
    if err:
        raise HTTPException(400, err)
    return {"code": d["code"], "type": d["type"], "value": d["value"],
            "discount": _discount_value(d, data.subtotal)}


@orders_router.get("/orders/my")
async def my_orders(user: dict = Depends(get_current_user)):
    docs = await db.orders.find({"$or": [{"user_id": user["id"]}, {"customer.email": user["email"]}]}) \
        .sort("created_at", -1).to_list(200)
    return pubs(docs)


# ---------- admin ----------

@orders_router.get("/admin/orders")
async def admin_orders(_: dict = Depends(require_admin)):
    docs = await db.orders.find({}).sort("created_at", -1).to_list(1000)
    return pubs(docs)


@orders_router.get("/admin/orders/{oid}")
async def admin_order(oid: str, _: dict = Depends(require_admin)):
    doc = await db.orders.find_one({"_id": ObjectId(oid)})
    if not doc:
        raise HTTPException(404, "Order not found")
    return pub(doc)


@orders_router.put("/admin/orders/{oid}")
async def admin_update_order(oid: str, data: OrderUpdate, _: dict = Depends(require_admin)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.now(timezone.utc)
    res = await db.orders.update_one({"_id": ObjectId(oid)}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(404, "Order not found")
    return pub(await db.orders.find_one({"_id": ObjectId(oid)}))


@orders_router.post("/admin/orders/{oid}/refund")
async def admin_refund_order(oid: str, _: dict = Depends(require_admin)):
    import stripe, os
    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
    order = await db.orders.find_one({"_id": ObjectId(oid)})
    if not order:
        raise HTTPException(404, "Order not found")
    if order.get("payment_status") != "paid":
        raise HTTPException(400, "Only paid orders can be refunded")
    pi = order.get("stripe_payment_intent_id")
    if pi:
        stripe.Refund.create(payment_intent=pi)
    await db.orders.update_one({"_id": ObjectId(oid)},
        {"$set": {"status": "refunded", "payment_status": "refunded", "updated_at": datetime.now(timezone.utc)}})
    return pub(await db.orders.find_one({"_id": ObjectId(oid)}))


# ---------- discounts admin ----------

@orders_router.get("/admin/discounts")
async def admin_discounts(_: dict = Depends(require_admin)):
    return pubs(await db.discounts.find({}).sort("code", 1).to_list(500))


@orders_router.post("/admin/discounts")
async def admin_create_discount(data: DiscountIn, _: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["code"] = doc["code"].upper().strip()
    if await db.discounts.find_one({"code": doc["code"]}):
        raise HTTPException(400, "Code already exists")
    doc["used_count"] = 0
    doc["created_at"] = datetime.now(timezone.utc)
    res = await db.discounts.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@orders_router.put("/admin/discounts/{did}")
async def admin_update_discount(did: str, data: DiscountIn, _: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["code"] = doc["code"].upper().strip()
    await db.discounts.update_one({"_id": ObjectId(did)}, {"$set": doc})
    return pub(await db.discounts.find_one({"_id": ObjectId(did)}))


@orders_router.delete("/admin/discounts/{did}")
async def admin_delete_discount(did: str, _: dict = Depends(require_admin)):
    await db.discounts.delete_one({"_id": ObjectId(did)})
    return {"ok": True}
