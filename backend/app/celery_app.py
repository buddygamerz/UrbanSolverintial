from celery import Celery
import os

# Celery configuration
CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "urbansolver",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.report_tasks",
        "app.tasks.ai_tasks",
    ],
)

# Celery settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
)

# Beat schedule for periodic tasks
celery_app.conf.beat_schedule = {
    "update-issue-priorities": {
        "task": "app.tasks.ai_tasks.update_all_issue_priorities",
        "schedule": 3600.0,  # Every hour
    },
    "cluster-new-reports": {
        "task": "app.tasks.ai_tasks.cluster_new_reports",
        "schedule": 300.0,  # Every 5 minutes
    },
}