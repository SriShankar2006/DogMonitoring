from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class Settings:
    app_name: str = "dog-ml-service"
    model_name: str = "mock-dog-model"
    model_version: str = "v0.1.0"
    mock_mode: bool = True
    embedding_dim: int = 512
    allowed_conditions: tuple[str, ...] = (
        "possible_rash",
        "possible_wound",
        "possible_hair_loss",
        "possible_eye_abnormality",
        "possible_excessive_salivation",
        "possible_swelling",
    )
    detector_backend: Literal["mock", "yolo"] = "mock"
    embedder_backend: Literal["mock", "reid"] = "mock"
    screener_backend: Literal["mock", "cnn"] = "mock"


settings = Settings()
