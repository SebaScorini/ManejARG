from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, Request, status

from app.core.supabase import get_supabase_client
from supabase import Client


@dataclass(slots=True)
class CurrentUser:
    id: str
    email: str | None = None


def require_current_user(
    request: Request,
    supabase_client: Annotated[Client, Depends(get_supabase_client)],
) -> CurrentUser:
    override_user = getattr(request.app.state, "current_user_override", None)

    if isinstance(override_user, CurrentUser):
        return override_user

    authorization_header = request.headers.get("Authorization")

    if not authorization_header or not authorization_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization_header.removeprefix("Bearer ").strip()
    user_response = supabase_client.auth.get_user(token)
    user = user_response.user

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return CurrentUser(id=user.id, email=user.email)
