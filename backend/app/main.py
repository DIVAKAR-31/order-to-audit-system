import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .seed_data import seed_database
from .routers import (
    auth, dashboard, products, customers, orders,
    inventory, production, invoices, payments, reports
)

# Initialize database tables
Base.metadata.create_all(bind=engine)

# Auto seed initial authentic data
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title="Order-to-Audit System API",
    description="Backend API for South Indian Snacks Manufacturing (Murukku, Mixture, Chips, Sweets)",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow any origin for local dev/testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(inventory.router)
app.include_router(production.router)
app.include_router(invoices.router)
app.include_router(payments.router)
app.include_router(reports.router)

# Serve built frontend static files if available
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            return {"detail": "Not Found"}
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "system": "Order-to-Audit System",
            "company": "South Indian Snacks Manufacturing Co.",
            "status": "online",
            "docs_url": "/docs"
        }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
