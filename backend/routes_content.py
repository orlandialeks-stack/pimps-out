from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from db import db, pubs
from models import LeadIn, ContactIn
from auth import require_admin

content_router = APIRouter(prefix="/api", tags=["content"])

DEFAULT_CONTENT = {
    "key": "site",
    "hero": {
        "line1": "We don't follow trends.",
        "line2": "We create our own rules.",
        "subtext": "PIMPS OUT — Premium streetwear for those who choose their own direction.",
        "cta_primary": "SHOP COLLECTION",
        "cta_secondary": "DISCOVER OUR PHILOSOPHY",
        "image": "",
    },
    "coming_soon": {
        "enabled": True,
        "title": "COLLECTION 001 — COMING SOON",
        "message": "The first PIMPS OUT drop is being crafted. Leave your email to get early access.",
        "launch_date": "",
    },
    "marquee_text": "WE DON'T FOLLOW TRENDS — WE CREATE OUR OWN RULES — PIMPS OUT — ",
    "about": {
        "title": "We don't follow trends. We create our own rules.",
        "paragraphs": [
            "PIMPS OUT is premium streetwear for those who choose their own direction.",
            "We believe clothing is a statement of individuality, confidence and creativity. Every piece we make is designed to be worn by people who refuse to blend in.",
            "No borrowed playbooks. No borrowed identity. Contemporary streetwear, built on our own terms.",
        ],
        "image": "",
    },
    "faq": [
        {"q": "When does the first collection launch?", "a": "Collection 001 is in production. Join the newsletter and you will be the first to know the exact date."},
        {"q": "Where do you ship?", "a": "We plan to ship across Europe and internationally. Full shipping details will be published at launch."},
        {"q": "What is the price range?", "a": "PIMPS OUT pieces will retail between EUR 50 and EUR 150, reflecting premium materials and quality construction."},
        {"q": "How can I contact you?", "a": "Use the contact page or the AI assistant on this site and we will get back to you."},
    ],
    "shipping_returns": {
        "paragraphs": [
            "Shipping: orders are prepared within 2-4 business days once the store launches. Tracked delivery across Europe and international destinations.",
            "Returns: you will be able to return unworn items within 14 days of delivery for a full refund. Items must be in original condition with tags attached.",
        ]
    },
    "contact": {
        "email": "hello@pimpsout.com",
        "instagram": "",
        "tiktok": "",
        "x": "",
        "youtube": "",
    },
    "newsletter": {
        "title": "JOIN THE MOVEMENT",
        "text": "Early access to drops, stories and releases. No spam — only what matters.",
    },
    "announcement": "",
}


@content_router.get("/content")
async def get_content():
    doc = await db.site_content.find_one({"key": "site"}, {"_id": 0})
    return doc or DEFAULT_CONTENT


@content_router.put("/admin/content")
async def update_content(data: dict, _: dict = Depends(require_admin)):
    data.pop("_id", None)
    data.pop("id", None)
    data["key"] = "site"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.site_content.update_one({"key": "site"}, {"$set": data}, upsert=True)
    doc = await db.site_content.find_one({"key": "site"}, {"_id": 0})
    return doc


@content_router.post("/leads")
async def create_lead(data: LeadIn):
    email = data.email.lower()
    await db.leads.update_one({"email": email},
        {"$set": {"email": email, "source": data.source, "updated_at": datetime.now(timezone.utc)},
         "$setOnInsert": {"created_at": datetime.now(timezone.utc)}}, upsert=True)
    return {"ok": True}


@content_router.get("/admin/leads")
async def list_leads(_: dict = Depends(require_admin)):
    return pubs(await db.leads.find({}).sort("created_at", -1).to_list(2000))


@content_router.post("/contact")
async def create_message(data: ContactIn):
    await db.messages.insert_one({**data.model_dump(), "created_at": datetime.now(timezone.utc), "read": False})
    return {"ok": True}


@content_router.get("/admin/messages")
async def list_messages(_: dict = Depends(require_admin)):
    return pubs(await db.messages.find({}).sort("created_at", -1).to_list(500))


async def seed_content():
    existing = await db.site_content.find_one({"key": "site"})
    if not existing:
        await db.site_content.insert_one(dict(DEFAULT_CONTENT))
