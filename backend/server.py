from dotenv import load_dotenv

load_dotenv()

import os
import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware

from db import db, client
from auth import auth_router, seed_admin
from routes_products import products_router
from routes_orders import orders_router
from routes_payments import payments_router
from routes_content import content_router, seed_content
from routes_assistant import assistant_router

Path("/app/backend/uploads").mkdir(parents=True, exist_ok=True)

app = FastAPI(title="PIMPS OUT API")

for r in (auth_router, products_router, orders_router, payments_router, content_router, assistant_router):
    app.include_router(r)

app.mount("/api/uploads", StaticFiles(directory="/app/backend/uploads"), name="uploads")

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
    await seed_admin()
    await seed_content()
    logger.info("PIMPS OUT API ready")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
