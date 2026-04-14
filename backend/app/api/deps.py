from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from jose import JWTError

from app.database import get_db
from app.redis import get_redis
from app.core.security import decode_access_token
from app.core.exceptions import CredentialsException
from app.models.user import User
from app.models.workspace import WorkspaceMember

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(token)
        if payload.get("type") != "access":
            raise CredentialsException()
        user_id: str = payload.get("sub")
        if not user_id:
            raise CredentialsException()
    except JWTError:
        raise CredentialsException()

    from app.crud import user as user_crud
    user = await user_crud.get_by_id(db, UUID(user_id))
    if not user or not user.is_active:
        raise CredentialsException()
    return user


async def get_workspace_member(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> WorkspaceMember:
    from app.crud import workspace as workspace_crud
    member = await workspace_crud.get_member(
        db, workspace_id=workspace_id, user_id=current_user.id
    )
    if not member:
        raise HTTPException(status_code=403, detail="Not a member of this workspace")
    return member
