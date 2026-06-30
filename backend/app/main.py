from fastapi import FastAPI

from app.api.v1.router import router as v1_router
from app.middleware.jwt import JWTMiddleware

app = FastAPI(title="ManejARG API", version="0.1.0")
app.add_middleware(JWTMiddleware)
app.include_router(v1_router, prefix="/v1")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
