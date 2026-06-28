from pydantic import BaseModel


class PositionModel(BaseModel):

    lat: float
    lon: float
    altitude: float


class AttitudeModel(BaseModel):

    heading: float
    yaw: float
    roll: float
    pitch: float


class GPSModel(BaseModel):

    fix: int
    satellites: int
    hdop: float


class BatteryModel(BaseModel):

    voltage: float
    current: float
    remaining: int


class TelemetryStatusModel(BaseModel):

    connected: bool
    source: str
    packet_rate: float


class TelemetryModel(BaseModel):

    position: PositionModel

    attitude: AttitudeModel

    gps: GPSModel

    battery: BatteryModel

    telemetry: TelemetryStatusModel