from typing import Any

from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class DetectionItem(BaseModel):
    bbox: BoundingBox
    confidence: float
    crop_id: str


class DetectResponse(BaseModel):
    dogs: list[DetectionItem] = Field(default_factory=list)
    accepted: bool
    model_name: str
    model_version: str


class EmbedResponse(BaseModel):
    embedding: list[float]
    model_name: str
    model_version: str


class HealthObservation(BaseModel):
    condition: str
    confidence: float
    bounding_box: BoundingBox | None = None


class HealthScreenResponse(BaseModel):
    conditions: list[HealthObservation] = Field(default_factory=list)
    image_quality: float
    model_name: str
    model_version: str


class ErrorResponse(BaseModel):
    detail: str
    error: str | None = None
    metadata: dict[str, Any] | None = None
