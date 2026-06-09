from fastapi import APIRouter
from core.geometry import haversine, bearing, elevation

router = APIRouter()


@router.post("/calculate")
async def calculate(data: dict):
    home = data["home"]
    drone = data["drone"]

    distance = haversine(
        home["lat"],
        home["lon"],
        drone["lat"],
        drone["lon"]
    )

    azimuth = bearing(
        home["lat"],
        home["lon"],
        drone["lat"],
        drone["lon"]
    )

    relative_height = (
        drone["altitude"] - home["height"]
    )

    el = elevation(distance, relative_height)

    return {
        "distance_km": round(distance, 2),
        "azimuth_deg": round(azimuth, 2),
        "elevation_deg": round(el, 2),
        "relative_height": relative_height
    }