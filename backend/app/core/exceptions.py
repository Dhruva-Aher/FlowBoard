from fastapi import HTTPException


class CredentialsException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=401,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


class NotFoundException(HTTPException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(status_code=404, detail=f"{resource} not found")


class ConflictException(HTTPException):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(status_code=409, detail=detail)


class ForbiddenException(HTTPException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=403, detail=detail)
