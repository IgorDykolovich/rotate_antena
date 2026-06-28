from abc import ABC, abstractmethod


class BaseTelemetry(ABC):

    @abstractmethod
    async def start(self):
        """Инициализация источника"""
        pass

    @abstractmethod
    async def update(self):
        """Обновление данных"""
        pass

    @abstractmethod
    async def stop(self):
        """Остановка источника"""
        pass