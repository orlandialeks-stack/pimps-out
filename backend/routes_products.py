import re
import uuid
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends

from db import db, pub, pubs
from models import ProductIn, TaxonomyIn
from auth import require_admin
from storage import put_object, APP_NAME

products_router = APIRouter(prefix="/api", tags=["products"])
ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}


def _slugify(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "product"
    return f"{base}-{uuid.uuid4().hex[:6]}"


def _with_stock(p: dict) -> dict:
    p["total_stock"] = sum(v.get("stock", 0) for v in p.get("variants", []))
    p["sizes"] = sorted({v.get("size", "") for v in p.get("variants", []) if v.get("size")})
    p["colors"] = sorted({v.get("color", "") for v in p.get("variants", []) if v.get("color")})
    return p


@products_router.get("/products")
async def list_products(category: str = "", collection: str = "", featured: bool = False, search: str = ""):
    q = {"status": "published"}
    if category:
        q["category"] = category
    if collection:
        q["collection"] = collection
    if featured:
        q["featured"] = True
    if search:
        q["name"] = {"$regex": search, "$options": "i"}
    docs = await db.products.find(q).sort([("sort_order", 1), ("created_at", -1)]).to_list(500)
    return [_with_stock(pub(d)) for d in docs]


@products_router.get("/products/{slug}")
async def get_product(slug: str):
    doc = await db.products.find_one({"slug": slug, "status": "published"})
    if not doc:
        raise HTTPException(404, "Product not found")
    return _with_stock(pub(doc))


@products_router.get("/taxonomies")
async def list_taxonomies():
    docs = await db.taxonomies.find({}).to_list(200)
    return pubs(docs)


# ---------- admin ----------

@products_router.get("/admin/products-by-slug/{slug}")
async def admin_product_by_slug(slug: str, _: dict = Depends(require_admin)):
    doc = await db.products.find_one({"slug": slug})
    if not doc:
        raise HTTPException(404, "Product not found")
    return _with_stock(pub(doc))


@products_router.get("/admin/products")
async def admin_list_products(_: dict = Depends(require_admin)):
    docs = await db.products.find({}).sort([("sort_order", 1), ("created_at", -1)]).to_list(1000)
    return [_with_stock(pub(d)) for d in docs]


@products_router.post("/admin/products")
async def admin_create_product(data: ProductIn, _: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["slug"] = _slugify(data.name)
    doc["created_at"] = datetime.now(timezone.utc)
    doc["updated_at"] = datetime.now(timezone.utc)
    res = await db.products.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return _with_stock(doc)


@products_router.get("/admin/products/{pid}")
async def admin_get_product(pid: str, _: dict = Depends(require_admin)):
    doc = await db.products.find_one({"_id": ObjectId(pid)})
    if not doc:
        raise HTTPException(404, "Product not found")
    return _with_stock(pub(doc))


@products_router.put("/admin/products/{pid}")
async def admin_update_product(pid: str, data: ProductIn, _: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["updated_at"] = datetime.now(timezone.utc)
    res = await db.products.update_one({"_id": ObjectId(pid)}, {"$set": doc})
    if res.matched_count == 0:
        raise HTTPException(404, "Product not found")
    updated = await db.products.find_one({"_id": ObjectId(pid)})
    return _with_stock(pub(updated))


@products_router.delete("/admin/products/{pid}")
async def admin_delete_product(pid: str, _: dict = Depends(require_admin)):
    res = await db.products.delete_one({"_id": ObjectId(pid)})
    if res.deleted_count == 0:
        raise HTTPException(404, "Product not found")
    return {"ok": True}


@products_router.post("/admin/uploads")
async def admin_upload(file: UploadFile = File(...), _: dict = Depends(require_admin)):
    ext = ALLOWED.get(file.content_type)
    if not ext:
        raise HTTPException(400, "Only JPG, PNG, WEBP or GIF images are allowed")
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(400, "Image too large (max 15 MB)")
    path = f"{APP_NAME}/uploads/{uuid.uuid4().hex}{ext}"
    result = put_object(path, data, file.content_type)
    await db.files.insert_one({
        "storage_path": result["path"], "original_filename": file.filename,
        "content_type": file.content_type, "size": result.get("size", len(data)),
        "is_deleted": False, "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": f"/api/files/{result['path']}"}


@products_router.post("/admin/taxonomies")
async def admin_create_taxonomy(data: TaxonomyIn, _: dict = Depends(require_admin)):
    if data.type not in ("category", "collection"):
        raise HTTPException(400, "Type must be category or collection")
    if await db.taxonomies.find_one({"type": data.type, "name": data.name}):
        raise HTTPException(400, "Already exists")
    doc = data.model_dump()
    res = await db.taxonomies.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@products_router.delete("/admin/taxonomies/{tid}")
async def admin_delete_taxonomy(tid: str, _: dict = Depends(require_admin)):
    await db.taxonomies.delete_one({"_id": ObjectId(tid)})
    return {"ok": True}
