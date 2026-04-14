from fastapi import APIRouter
from app.api.v1 import auth, workspaces, projects, tasks, documents, members, activity

router = APIRouter()
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(workspaces.router, prefix="/workspaces", tags=["workspaces"])
router.include_router(projects.router, tags=["projects"])
router.include_router(tasks.router, tags=["tasks"])
router.include_router(documents.router, tags=["documents"])
router.include_router(members.router, tags=["members"])
router.include_router(activity.router, tags=["activity"])
