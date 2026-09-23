from dataclasses import dataclass
import os
from typing import Literal


@dataclass(frozen=True)
class Settings:
    app_name: str = "dog-ml-service"
    model_name: str = "mock-dog-model"
    model_version: str = "v0.1.0"
    mock_mode: bool = os.getenv('ML_MOCK_MODE', 'false').lower() == 'true'
    embedding_dim: int = 512
    allowed_conditions: tuple[str, ...] = (
        "possible_rash",
        "possible_wound",
        "possible_hair_loss",
        "possible_eye_abnormality",
        "possible_excessive_salivation",
        "possible_swelling",
    )
    detector_backend: Literal["mock", "torchvision"] = os.getenv('DETECTOR_BACKEND', 'torchvision')
    embedder_backend: Literal["mock", "clip"] = os.getenv('EMBEDDER_BACKEND', 'clip')
    screener_backend: Literal["mock", "cnn"] = "mock"


settings = Settings()
