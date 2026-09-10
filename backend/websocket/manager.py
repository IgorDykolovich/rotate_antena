from fastapi import WebSocket


class WebSocketManager:

    def __init__(self):

        self.clients = []

    async def connect(self, websocket: WebSocket):

        await websocket.accept()

        self.clients.append(websocket)

        print(
            f"Client connected "
            f"({len(self.clients)})"
        )

    def disconnect(self, websocket: WebSocket):

        if websocket in self.clients:

            self.clients.remove(websocket)

        print(
            f"Client disconnected "
            f"({len(self.clients)})"
        )

    async def broadcast(self, message: dict):

        disconnected = []

        for client in self.clients:

            try:

                await client.send_json(message)

            except Exception:

                disconnected.append(client)

        for client in disconnected:

            self.disconnect(client)


manager = WebSocketManager()