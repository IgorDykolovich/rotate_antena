from fastapi import APIRouter
from pydantic import BaseModel

from state.drone_state import drone_state
from models.builders import build_telemetry

from models.telemetry import TelemetryModel
router = APIRouter()


class TelemetryData(BaseModel):

    lat: float
    lon: float

    altitude: float
    heading: float


@router.post("/telemetry")
async def update_telemetry(
    data: TelemetryUpdate
):

    drone_state["lat"] = data.lat
    drone_state["lon"] = data.lon

    drone_state["altitude"] = data.altitude
    drone_state["heading"] = data.heading

    return {
        "status": "ok"
    }


@router.get(
    "/telemetry",
    response_model=TelemetryModel
)
async def get_telemetry():

    return build_telemetry()