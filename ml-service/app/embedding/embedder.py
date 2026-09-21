from __future__ import annotations

from abc import ABC, abstractmethod
from hashlib import sha256


class FeatureEmbedder(ABC):
    @abstractmethod
    def embed(self, image_bytes: bytes, filename: str) -> dict:
        raise NotImplementedError


class MockFeatureEmbedder(FeatureEmbedder):
    def embed(self, image_bytes: bytes, filename: str) -> dict:
        digest = sha256(image_bytes).hexdigest()
        seed = int(digest[:8], 16)
        values = []
        for index in range(512):
            values.append(float(((seed + index * 37) % 1000) / 1000.0))
        return {
            'embedding': values,
            'model_name': 'mock-embedding-model',
            'model_version': 'mock-embed-v1',
        }


class ReIDFeatureEmbedder(FeatureEmbedder):
    def embed(self, image_bytes: bytes, filename: str) -> dict:
        raise NotImplementedError('Real feature embedder not yet configured. Use mock mode for local development.')


def get_embedder() -> FeatureEmbedder:
    from app.config import settings

    if settings.embedder_backend == 'reid':
        return ReIDFeatureEmbedder()
    return MockFeatureEmbedder()
