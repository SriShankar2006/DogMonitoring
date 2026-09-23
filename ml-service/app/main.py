from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import settings
from app.detection.detector import crop_detected_dog, get_detector
from app.embedding.embedder import get_embedder
from app.health.screener import get_screener
from app.schemas import DetectResponse, EmbedResponse, HealthScreenResponse

app = FastAPI(title=settings.app_name)


@app.on_event('startup')
async def load_models() -> None:
    """Load every model once when the ML service starts."""
    get_detector()
    get_screener()
    get_embedder()


@app.get('/health')
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@app.post('/detect', response_model=DetectResponse)
async def detect(image: UploadFile = File(...)) -> DetectResponse:
    try:
        contents = await image.read()
        detector = get_detector()
        result = detector.detect(contents, image.filename or 'upload.jpg')
        response = DetectResponse(
            dogs=result['dogs'],
            accepted=result.get('accepted', bool(result['dogs'])),
            model_name=result.get('model_name', settings.model_name),
            model_version=result.get('model_version', settings.model_version),
        )
        return response
    except Exception as exc:  # pragma: no cover - API boundary guard
        raise HTTPException(status_code=500, detail=f'Detection failed: {exc}') from exc


@app.post('/embed', response_model=EmbedResponse)
async def embed(image: UploadFile = File(...)) -> EmbedResponse:
    try:
        contents = await image.read()
        detection_result = get_detector().detect(contents, image.filename or 'upload.jpg')
        crop = detection_result.get('dogs', [None])[0]
        contents = crop_detected_dog(contents, crop)
        embedder = get_embedder()
        result = embedder.embed(contents, image.filename or 'crop.jpg')
        return EmbedResponse(
            embedding=result['embedding'],
            model_name=result.get('model_name', settings.model_name),
            model_version=result.get('model_version', settings.model_version),
        )
    except Exception as exc:  # pragma: no cover - API boundary guard
        raise HTTPException(status_code=500, detail=f'Embedding failed: {exc}') from exc


@app.post('/health-screen', response_model=HealthScreenResponse)
async def health_screen(image: UploadFile = File(...)) -> HealthScreenResponse:
    try:
        contents = await image.read()
        screener = get_screener()
        result = screener.screen(contents, image.filename or 'crop.jpg')
        return HealthScreenResponse(
            conditions=result['conditions'],
            image_quality=result.get('image_quality', 0.0),
            model_name=result.get('model_name', settings.model_name),
            model_version=result.get('model_version', settings.model_version),
        )
    except Exception as exc:  # pragma: no cover - API boundary guard
        raise HTTPException(status_code=500, detail=f'Health screening failed: {exc}') from exc


@app.exception_handler(HTTPException)
async def http_exception_handler(_, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={'detail': exc.detail})
