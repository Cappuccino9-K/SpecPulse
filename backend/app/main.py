import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from app.api.endpoints import router
from app.config import get_settings
from app.database import engine, init_db
from app.services.fixtures import load_fixture

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    logger.info("database ready")
    yield
    await engine.dispose()


settings = get_settings()
app = FastAPI(title="SpecPulse", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")


@app.get("/demo/products/{slug}", response_class=HTMLResponse)
async def demo_product(slug: str) -> HTMLResponse:
    html = load_fixture(slug)
    if html is None:
        raise HTTPException(status_code=404, detail="데모 제품이 없습니다.")
    return HTMLResponse(html)


@app.exception_handler(RequestValidationError)
async def validation_handler(_: object, exc: RequestValidationError) -> JSONResponse:
    message = "입력값을 다시 확인해 주세요."
    for error in exc.errors():
        text = str(error.get("msg") or "")
        error_type = str(error.get("type") or "")
        if "서로 다른" in text:
            message = "서로 다른 제품 주소를 입력해 주세요."
            break
        if "url" in error_type or "url" in text.lower():
            message = "올바른 URL 형식이 아닙니다. http 또는 https 주소를 입력해 주세요."
            break
    return JSONResponse(status_code=422, content={"detail": message})
