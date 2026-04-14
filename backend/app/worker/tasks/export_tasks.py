import csv
import io
import logging
from app.worker.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=2)
def export_board_csv(self, project_id: str, user_id: str, workspace_id: str):
    """Generate CSV export of board tasks, upload to S3, and return presigned URL."""
    try:
        from sqlalchemy import create_engine, text
        from app.config import settings
        import boto3

        engine = create_engine(settings.DATABASE_URL_SYNC)
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT t.title, t.priority, t.due_date, t.position, c.name as column_name "
                    "FROM tasks t JOIN columns c ON t.column_id = c.id "
                    "WHERE t.project_id = :pid ORDER BY c.position, t.position"
                ),
                {"pid": project_id},
            ).fetchall()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Title", "Priority", "Due Date", "Column", "Position"])
        for row in rows:
            writer.writerow([row.title, row.priority, row.due_date, row.column_name, row.position])

        s3 = boto3.client("s3", region_name=settings.AWS_REGION)
        key = f"exports/{workspace_id}/{project_id}/board.csv"
        s3.put_object(
            Bucket=settings.S3_BUCKET,
            Key=key,
            Body=output.getvalue().encode("utf-8"),
            ContentType="text/csv",
        )

        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.S3_BUCKET, "Key": key},
            ExpiresIn=3600,
        )
        logger.info("Board exported to %s", url)
        return {"url": url}
    except Exception as exc:
        logger.error("Board export failed: %s", exc)
        raise self.retry(exc=exc, countdown=30)
