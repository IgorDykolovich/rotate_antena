import asyncio

from telemetry.base import BaseTelemetry
from state.drone_state import drone_state


class SimulatorTelemetry(BaseTelemetry):

    async def start(self):

        print("Simulator telemetry started")

    async def update(self):

        from config import TELEMETRY_UPDATE_HZ

        await asyncio.sleep(
            1 / TELEMETRY_UPDATE_HZ
        )
        return drone_state

    async def stop(self):

        print("Simulator telemetry stopped")