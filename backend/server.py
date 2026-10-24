from dotenv import load_dotenv

load_dotenv()

import os
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware

from db import db, client
from auth import auth_router, seed_admin
from routes_products import products_router
from routes_orders import orders_router
from routes_payments import payments_router
from routes_content import content_router, seed_content
from routes_assistant import assistant_router
from storage import init_storage, get_object

app = FastAPI(title="PIMPS OUT API")

for r in (auth_router, products_router, orders_router, payments_router, content_router, assistant_router):
    app.include_router(r)


@app.get("/api/files/{path:path}")
async def serve_file(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False})
    if not record:
        raise HTTPException(404, "File not found")
    data, content_type = get_object(path)
    return Response(content=data, media_type=record.get("content_type", content_type),
                    headers={"Cache-Control": "public, max-age=86400"})

origins = [o for o in [os.environ.get("FRONTEND_URL"), "http://localhost:3000"] if o]
extra = os.environ.get("CORS_ORIGINS", "")
if extra and extra != "*":
    origins.extend(extra.split(","))

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


@app.get("/api/")
async def root():
    return {"message": "PIMPS OUT API", "status": "ok"}


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.products.create_index("slug", unique=True)
    await db.products.create_index([("status", 1), ("featured", 1)])
    await db.orders.create_index("session_id", unique=True)
    await db.discounts.create_index("code", unique=True)
    await db.leads.create_index("email", unique=True)
    await db.files.create_index("storage_path", unique=True)
    await seed_admin()
    await seed_content()
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    logger.info("PIMPS OUT API ready")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
