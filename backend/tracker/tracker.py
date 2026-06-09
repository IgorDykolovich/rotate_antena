import asyncio

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class TrackerCommand(BaseModel):
    azimuth: float
    elevation: float


tracker_state = {

    "connected": True,

    "target_azimuth": 0.0,
    "target_elevation": 0.0,

    "current_azimuth": 0.0,
    "current_elevation": 0.0
}


@router.post("/tracker")
async def set_tracker_position(
    command: TrackerCommand
):

    tracker_state["target_azimuth"] = (
        command.azimuth
    )

    tracker_state["target_elevation"] = (
        command.elevation
    )

    return {
        "status": "ok",
        "azimuth": command.azimuth,
        "elevation": command.elevation
    }


@router.get("/tracker/status")
async def get_tracker_status():

    return tracker_state


async def tracker_simulator():

    while True:

        az_diff = (
            tracker_state["target_azimuth"]
            -
            tracker_state["current_azimuth"]
        )

        if az_diff > 180:
            az_diff -= 360

        if az_diff < -180:
            az_diff += 360

        if abs(az_diff) > 1:

            tracker_state["current_azimuth"] += (
                1 if az_diff > 0 else -1
            )

        else:

            tracker_state["current_azimuth"] = (
                tracker_state["target_azimuth"]
            )

        tracker_state["current_azimuth"] %= 360

        el_diff = (
            tracker_state["target_elevation"]
            -
            tracker_state["current_elevation"]
        )

        if abs(el_diff) > 1:

            tracker_state["current_elevation"] += (
                1 if el_diff > 0 else -1
            )

        else:

            tracker_state["current_elevation"] = (
                tracker_state["target_elevation"]
            )

        await asyncio.sleep(0.05)