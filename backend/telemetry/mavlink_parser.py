import math
import time

from state.drone_state import drone_state


class MavlinkParser:

    def __init__(self):

        self.last_rate_time = time.time()

        self.last_packet_count = 0

        self.handlers = {

            "HEARTBEAT":
                self.parse_heartbeat,

            "GLOBAL_POSITION_INT":
                self.parse_global_position_int,

            "ATTITUDE":
                self.parse_attitude,

            "GPS_RAW_INT":
                self.parse_gps_raw_int,

            "SYS_STATUS":
                self.parse_sys_status,

            "VFR_HUD":
                self.parse_vfr_hud,
        }

    def parse(self, msg):

        if msg is None:
            return

        telemetry = drone_state["telemetry"]
      
        telemetry["packet_count"] += 1

        handler = self.handlers.get(
            msg.get_type()
        )

        if handler:

            handler(msg)

        self.update_packet_rate()

        self.check_connection()    

    def parse_heartbeat(self, msg):

        now = time.time()

        drone_state["last_update"] = now

        telemetry = drone_state["telemetry"]

        telemetry["connected"] = True

        telemetry["source"] = "MAVLINK"

        telemetry["last_packet"] = now

        drone_state["armed"] = bool(
            msg.base_mode &
            0b10000000
        )

        try:

            drone_state["flight_mode"] = msg.mode_string()

        except Exception:

            drone_state["flight_mode"] = "UNKNOWN"

    def parse_global_position_int(self, msg):

        drone_state["lat"] = msg.lat / 1e7

        drone_state["lon"] = msg.lon / 1e7

        drone_state["altitude"] = msg.relative_alt / 1000

        if msg.hdg != 65535:

            drone_state["heading"] = msg.hdg / 100

    def parse_attitude(self, msg):

        drone_state["roll"] = math.degrees(
            msg.roll
        )

        drone_state["pitch"] = math.degrees(
            msg.pitch
        )

        yaw = math.degrees(msg.yaw)

        if yaw < 0:
            yaw += 360

        drone_state["yaw"] = yaw

    def parse_gps_raw_int(self, msg):

        drone_state["gps_fix"] = msg.fix_type

        drone_state["satellites"] = msg.satellites_visible

        drone_state["hdop"] = msg.eph / 100

    def parse_sys_status(self, msg):

        drone_state["voltage"] = msg.voltage_battery / 1000

        drone_state["current"] = msg.current_battery / 100

        drone_state["battery_remaining"] = (
            msg.battery_remaining
        )

    def parse_vfr_hud(self, msg):

        drone_state["air_speed"] = msg.airspeed

        drone_state["ground_speed"] = msg.groundspeed

        drone_state["climb_rate"] = msg.climb
        
    def update_packet_rate(self):

        telemetry = drone_state["telemetry"]

        now = time.time()

        elapsed = now - self.last_rate_time

        if elapsed < 1:

            return

        packets = (
            telemetry["packet_count"] -
            self.last_packet_count
        )

        telemetry["packet_rate"] = packets / elapsed

        self.last_packet_count = telemetry["packet_count"]

        self.last_rate_time = now

    def check_connection(self):

        telemetry = drone_state["telemetry"]

        if (
            time.time() -
            telemetry["last_packet"]
            > 3
        ):

            telemetry["connected"] = False        