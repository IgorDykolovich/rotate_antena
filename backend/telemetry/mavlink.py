import asyncio
import time
from pymavlink import mavutil
from enum import Enum
from telemetry.mavlink_parser import MavlinkParser
from telemetry.base import BaseTelemetry
from config import (
    MAVLINK_PORT,
    MAVLINK_BAUD,
    MAVLINK_RECONNECT_DELAY,
    TELEMETRY_UPDATE_HZ
)

class ConnectionState(Enum):

    DISCONNECTED = 0

    CONNECTING = 1

    CONNECTED = 2

class MavlinkTelemetry(BaseTelemetry):

    def __init__(self):

        self.master = None

        self.state = ConnectionState.DISCONNECTED

        self.last_packet_time = 0

        self.parser = MavlinkParser()

    async def start(self):

        print("MAVLink telemetry service started")


    async def update(self):

        if self.state != ConnectionState.CONNECTED:

            await self.connect()

            return

        msg = self.master.recv_match(
            blocking=False
        )

        if msg:

            self.last_packet_time = time.time()
            
            self.parser.parse(msg)


        if (
            self.last_packet_time != 0
            and
            time.time() - self.last_packet_time > MAVLINK_PACKET_TIMEOUT
        ):

            print("Connection timeout")

            self.state = ConnectionState.DISCONNECTED

        await asyncio.sleep(
            1 / TELEMETRY_UPDATE_HZ
        )


    async def connect(self):

        self.state = ConnectionState.CONNECTING
        try:

            print(
                f"Connecting to "
                f"{MAVLINK_PORT}..."
            )

            self.master = mavutil.mavlink_connection(
                MAVLINK_PORT,
                baud=MAVLINK_BAUD
            )

            print("Connected.")

            self.state = ConnectionState.CONNECTED
        except Exception as error:

            print(error)

            self.state = ConnectionState.DISCONNECTED

            await asyncio.sleep(
                MAVLINK_RECONNECT_DELAY
            )

    async def stop(self):

        if self.master:

            self.master.close()