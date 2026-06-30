from typing import Annotated

from fastapi import APIRouter, Depends

from app.dependencies.auth import CurrentUser, require_current_user

router = APIRouter(tags=["auth"])


@router.get("/me")
def me(current_user: Annotated[CurrentUser, Depends(require_current_user)]) -> CurrentUser:
    return current_user
