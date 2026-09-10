import asyncio
import time

from websocket.manager import manager


class Publisher:

    def __init__(self):

        self.last_send = {}

    async def publish(
        self,
        message: dict,
        rate_limit=None
    ):

        if rate_limit:

            msg_type = message["type"]

            now = time.time()

            last = self.last_send.get(
                msg_type,
                0
            )

            if now - last < 1 / rate_limit:

                return

            self.last_send[msg_type] = now

        await manager.broadcast(message)


publisher = Publisher()