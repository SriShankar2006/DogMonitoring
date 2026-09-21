from __future__ import annotations

from abc import ABC, abstractmethod
from hashlib import sha256


class HealthScreener(ABC):
    @abstractmethod
    def screen(self, image_bytes: bytes, filename: str) -> dict:
        raise NotImplementedError


class MockHealthScreener(HealthScreener):
    def screen(self, image_bytes: bytes, filename: str) -> dict:
        digest = sha256(image_bytes).hexdigest()
        seed = int(digest[:8], 16)
        conditions = [
            {
                'condition': 'possible_skin_abnormality',
                'confidence': round(0.78 + (seed % 10) * 0.02, 2),
                'bounding_box': {'x': 20.0, 'y': 30.0, 'width': 50.0, 'height': 45.0},
            },
            {
                'condition': 'possible_eye_abnormality',
                'confidence': round(0.62 + (seed % 6) * 0.03, 2),
                'bounding_box': {'x': 42.0, 'y': 18.0, 'width': 18.0, 'height': 18.0},
            },
        ]
        return {
            'conditions': conditions,
            'image_quality': round(0.8 + (seed % 15) * 0.01, 2),
            'model_name': 'mock-health-screener',
            'model_version': 'mock-health-v1',
        }


class CNNHealthScreener(HealthScreener):
    def screen(self, image_bytes: bytes, filename: str) -> dict:
        raise NotImplementedError('Real CNN health screener not yet configured. Use mock mode for local development.')


def get_screener() -> HealthScreener:
    from app.config import settings

    if settings.screener_backend == 'cnn':
        return CNNHealthScreener()
    return MockHealthScreener()
