from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import asyncio

from app.api.incidents import router as incidents_router
from app.api.evaluation import router as evaluation_router
from app.db.mongodb import connect_to_mongodb, close_mongodb_connection

# Create FastAPI app
app = FastAPI(
    title="Incident Analysis API",
    description="API for analyzing data pipeline incidents with LLM assistance and human review",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(incidents_router)
app.include_router(evaluation_router)

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    await connect_to_mongodb()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongodb_connection()

# Exception handler
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected error occurred: {str(exc)}"},
    )

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to the Incident Analysis API",
        "documentation": "/docs",
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
