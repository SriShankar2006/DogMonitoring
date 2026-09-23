from __future__ import annotations

from abc import ABC, abstractmethod
from hashlib import sha256
from io import BytesIO

import numpy as np
from PIL import Image, ImageOps


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
        raise NotImplementedError('The legacy re-ID backend is not configured.')


class CLIPFeatureEmbedder(FeatureEmbedder):
    model_name = 'openai/clip-vit-base-patch32'

    def __init__(self):
        from transformers import CLIPModel, CLIPProcessor
        import torch

        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.processor = CLIPProcessor.from_pretrained(self.model_name)
        self.model = CLIPModel.from_pretrained(self.model_name).to(self.device)
        self.model.eval()

    def embed(self, image_bytes: bytes, filename: str) -> dict:
        import torch

        image = ImageOps.exif_transpose(Image.open(BytesIO(image_bytes))).convert('RGB')
        inputs = self.processor(images=image, return_tensors='pt')
        pixel_values = inputs['pixel_values'].to(self.device)

        with torch.inference_mode():
            features = self.model.get_image_features(pixel_values=pixel_values)

        values = features[0].detach().cpu().numpy().astype(np.float32)
        values /= max(float(np.linalg.norm(values)), 1e-12)
        return {
            'embedding': values.tolist(),
            'model_name': self.model_name,
            'model_version': 'clip-v1',
        }


_embedder = None


def get_embedder() -> FeatureEmbedder:
    from app.config import settings

    global _embedder
    if _embedder is None:
        _embedder = MockFeatureEmbedder() if settings.embedder_backend == 'mock' else CLIPFeatureEmbedder()
    return _embedder
