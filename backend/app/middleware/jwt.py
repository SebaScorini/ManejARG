from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp


class JWTMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        authorization_header = request.headers.get("Authorization")

        if authorization_header and authorization_header.startswith("Bearer "):
            request.state.auth_token = authorization_header.removeprefix("Bearer ").strip()

        return await call_next(request)
