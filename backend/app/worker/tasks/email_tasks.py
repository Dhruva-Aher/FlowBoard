import logging
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def send_invitation_email(self, to_email: str, workspace_name: str, invite_url: str):
    """Send workspace invitation email via AWS SES."""
    try:
        import boto3
        from app.config import settings

        client = boto3.client("ses", region_name=settings.AWS_REGION)
        client.send_email(
            Source=settings.SES_FROM_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": f"You've been invited to {workspace_name} on FlowBoard"},
                "Body": {"Text": {"Data": f"Click to join: {invite_url}"}},
            },
        )
        logger.info("Invitation email sent to %s", to_email)
    except Exception as exc:
        logger.error("Failed to send invitation email: %s", exc)
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_assignment_email(self, to_email: str, task_title: str, workspace_name: str):
    """Send task assignment notification email via AWS SES."""
    try:
        import boto3
        from app.config import settings

        client = boto3.client("ses", region_name=settings.AWS_REGION)
        client.send_email(
            Source=settings.SES_FROM_EMAIL,
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": f"You've been assigned: {task_title}"},
                "Body": {"Text": {"Data": f"You have a new task in {workspace_name}."}},
            },
        )
        logger.info("Assignment email sent to %s for task %s", to_email, task_title)
    except Exception as exc:
        logger.error("Failed to send assignment email: %s", exc)
        raise self.retry(exc=exc, countdown=60)


@celery_app.task
def cleanup_expired_tokens():
    """Remove expired refresh tokens — runs daily via beat."""
    from sqlalchemy import create_engine, text
    from app.config import settings

    engine = create_engine(settings.DATABASE_URL_SYNC)
    with engine.connect() as conn:
        result = conn.execute(
            text("DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = TRUE")
        )
        conn.commit()
        logger.info("Cleaned up %d expired/revoked refresh tokens", result.rowcount)
