from __future__ import annotations

from abc import ABC, abstractmethod
from hashlib import sha256
from io import BytesIO

from PIL import Image, ImageOps


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


class TorchvisionDogDetector(DogDetector):
    def __init__(self):
        import torch
        from torchvision.models.detection import (
            FasterRCNN_ResNet50_FPN_Weights,
            fasterrcnn_resnet50_fpn,
        )

        weights = FasterRCNN_ResNet50_FPN_Weights.DEFAULT
        self.model = fasterrcnn_resnet50_fpn(weights=weights)
        self.model.eval()
        self.transform = weights.transforms()
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model.to(self.device)

    def detect(self, image_bytes: bytes, filename: str) -> dict:
        import torch

        image = ImageOps.exif_transpose(Image.open(BytesIO(image_bytes))).convert('RGB')
        image_width, image_height = image.size
        tensor = self.transform(image).to(self.device)
        with torch.inference_mode():
            prediction = self.model([tensor])[0]

        dogs = []
        for index, (box, label, score) in enumerate(zip(
            prediction['boxes'], prediction['labels'], prediction['scores']
        )):
            confidence = float(score)
            if int(label) != 18 or confidence < 0.60:
                continue
            left, top, right, bottom = [float(value) for value in box.tolist()]
            dogs.append({
                'bbox': {
                    'x': max(0.0, left / image_width * 100),
                    'y': max(0.0, top / image_height * 100),
                    'width': max(0.0, (right - left) / image_width * 100),
                    'height': max(0.0, (bottom - top) / image_height * 100),
                },
                'confidence': round(confidence * 100, 2),
                'crop_id': f'{filename}-dog-{index + 1}',
            })

        return {
            'dogs': dogs,
            'accepted': bool(dogs),
            'model_name': 'fasterrcnn-resnet50-fpn',
            'model_version': 'torchvision-default-v1',
        }


def crop_detected_dog(image_bytes: bytes, detection: dict | None) -> bytes:
    image = ImageOps.exif_transpose(Image.open(BytesIO(image_bytes))).convert('RGB')
    if not detection:
        return image_bytes

    width, height = image.size
    bbox = detection['bbox']
    left = bbox['x'] / 100 * width
    top = bbox['y'] / 100 * height
    right = left + bbox['width'] / 100 * width
    bottom = top + bbox['height'] / 100 * height
    padding_x = (right - left) * 0.10
    padding_y = (bottom - top) * 0.10
    crop = image.crop((
        max(0, int(left - padding_x)),
        max(0, int(top - padding_y)),
        min(width, int(right + padding_x)),
        min(height, int(bottom + padding_y)),
    ))
    output = BytesIO()
    crop.save(output, format='JPEG', quality=95)
    return output.getvalue()


_detector = None


def get_detector() -> DogDetector:
    from app.config import settings

    global _detector
    if _detector is None:
        _detector = MockDogDetector() if settings.detector_backend == 'mock' else TorchvisionDogDetector()
    return _detector
