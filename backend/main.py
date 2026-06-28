from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from telemetry.manager import telemetry
from tracker.tracker import (router as tracker_router, tracker_simulator)
from api.telemetry import (router as telemetry_router)
from mavlink.mavlink_listener import (
    mavlink_listener
) 

import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"status": "running"}

app.include_router(tracker_router, prefix="/api/v1")

@app.on_event("startup")
async def startup():

    asyncio.create_task(
        tracker_simulator()
    )
    await telemetry.start()
    
app.include_router(telemetry_router, prefix="/api/v1")