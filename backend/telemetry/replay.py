import asyncio

from telemetry.base import BaseTelemetry


class ReplayTelemetry(BaseTelemetry):

    async def start(self):

        print("Replay telemetry started")

    async def update(self):

        await asyncio.sleep(0.05)

    async def stop(self):

        print("Replay telemetry stopped")