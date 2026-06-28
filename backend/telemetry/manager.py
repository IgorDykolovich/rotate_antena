import asyncio

from config import TELEMETRY_SOURCE

from telemetry.simulator import SimulatorTelemetry
from telemetry.mavlink import MavlinkTelemetry
from telemetry.replay import ReplayTelemetry


if TELEMETRY_SOURCE == "SIMULATOR":

    source = SimulatorTelemetry()

elif TELEMETRY_SOURCE == "MAVLINK":

    source = MavlinkTelemetry()

elif TELEMETRY_SOURCE == "REPLAY":

    source = ReplayTelemetry()

else:

    raise RuntimeError(
        f"Unknown telemetry source: {TELEMETRY_SOURCE}"
    )

class TelemetryManager:

    def __init__(self, source):

        self.source = source
        self.task = None

    async def start(self):

        print(
            f"Starting telemetry source: "
            f"{self.source.__class__.__name__}"
        )

        await self.source.start()

        self.task = asyncio.create_task(
            self.run()
        )

    async def run(self):

        while True:

            try:

                await self.source.update()

            except Exception as error:

                print(
                    "Telemetry error:",
                    error
                )

                await asyncio.sleep(1)

    async def stop(self):

        if self.task:

            self.task.cancel()

        await self.source.stop()

telemetry = TelemetryManager(source)