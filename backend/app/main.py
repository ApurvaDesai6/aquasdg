import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from .routers import regions, simulation, policy, statistics, agent
from .services.regions import load_all_regions


@asynccontextmanager
async def lifespan(app: FastAPI):
    await load_all_regions()
    yield


app = FastAPI(
    title="AquaSDG API",
    description="AI-Powered Freshwater Access Intelligence Platform",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "https://aquasdg.vercel.app",
        "https://aquasdg.apurvad.xyz",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(regions.router)
app.include_router(simulation.router)
app.include_router(policy.router)
app.include_router(statistics.router)
app.include_router(agent.router)


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "version": "3.0.0",
        "services": {
            "data_pipeline": "active",
            "ml_engine": "active",
            "gemini_llm": "active" if os.getenv("GEMINI_API_KEY") else "unconfigured",
        },
    }
