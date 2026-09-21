from __future__ import annotations

from abc import ABC, abstractmethod
from hashlib import sha256


class DogDetector(ABC):
    @abstractmethod
    def detect(self, image_bytes: bytes, filename: str) -> dict:
        raise NotImplementedError


class MockDogDetector(DogDetector):
    def detect(self, image_bytes: bytes, filename: str) -> dict:
        digest = sha256(image_bytes).hexdigest()
        seed = int(digest[:8], 16)
        confidence = 88.0 + (seed % 9)
        dogs = [
            {
                'bbox': {'x': 12.0, 'y': 18.0, 'width': 68.0, 'height': 72.0},
                'confidence': round(confidence, 2),
                'crop_id': f'crop-{digest[:12]}-1',
            }
        ]
        return {
            'dogs': dogs,
            'accepted': True,
            'model_name': 'mock-dog-detector',
            'model_version': 'mock-v1',
        }


class YOLODogDetector(DogDetector):
    def detect(self, image_bytes: bytes, filename: str) -> dict:
        raise NotImplementedError('Real YOLO detector not yet configured. Use mock mode for local development.')


def get_detector() -> DogDetector:
    from app.config import settings

    if settings.detector_backend == 'yolo':
        return YOLODogDetector()
    return MockDogDetector()
