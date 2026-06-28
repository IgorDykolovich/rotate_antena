from models.telemetry import *

from state.drone_state import drone_state


def build_telemetry():

    return TelemetryModel(

        position=PositionModel(

            lat=drone_state["lat"],
            lon=drone_state["lon"],
            altitude=drone_state["altitude"]

        ),

        attitude=AttitudeModel(

            heading=drone_state["heading"],
            yaw=drone_state["yaw"],
            roll=drone_state["roll"],
            pitch=drone_state["pitch"]

        ),

        gps=GPSModel(

            fix=drone_state["gps_fix"],
            satellites=drone_state["satellites"],
            hdop=drone_state["hdop"]

        ),

        battery=BatteryModel(

            voltage=drone_state["voltage"],
            current=drone_state["current"],
            remaining=drone_state["battery_remaining"]

        ),

        telemetry=TelemetryStatusModel(

            connected=drone_state["telemetry"]["connected"],

            source=drone_state["telemetry"]["source"],

            packet_rate=drone_state["telemetry"]["packet_rate"]

        )
    )