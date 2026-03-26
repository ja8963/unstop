from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import medicine, compliance, rag, inventory, recommend

app = FastAPI(
    title="AI Pharmacy Assistant API",
    description="Backend for the AI Pharmacy Assistant dashboard. Provides compliance checks, RAG-based regulatory explanations, inventory alerts, and AI restocking recommendations.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(medicine.router)
app.include_router(compliance.router)
app.include_router(rag.router)
app.include_router(inventory.router)
app.include_router(recommend.router)


@app.get("/")
def root():
    return {
        "service": "AI Pharmacy Assistant API",
        "version": "1.0.0",
        "endpoints": {
            "medicines": "/api/medicines",
            "medicine_detail": "/api/medicine/{name}",
            "compliance": "POST /api/compliance",
            "explain": "POST /api/explain",
            "inventory": "POST /api/inventory",
            "recommend": "POST /api/recommend",
            "docs": "/docs"
        }
    }


@app.get("/health")
def health():
    return {"status": "ok"}
