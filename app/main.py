from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import incidents
import logging

logging.basicConfig(level=logging.INFO)
logger=logging.getLogger(__name__)

app = FastAPI(
    title="AI Incident Response API",
    description="FastAPI backend for AI-powered incident response system",
    version="1.0.0"
)

# CORS middleware for react frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include API routes
app.include_router(incidents.router, prefix="/api")


# Include API routes
app.include_router(incidents.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "AI Incident Response API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2025-01-15T10:00:00Z"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)