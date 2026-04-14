from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "flowboard",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.worker.tasks.email_tasks", "app.worker.tasks.export_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "cleanup-expired-tokens": {
            "task": "app.worker.tasks.email_tasks.cleanup_expired_tokens",
            "schedule": crontab(hour=3, minute=0),
        },
    },
)
