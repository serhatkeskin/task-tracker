from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import BaseModel


class Status(models.TextChoices):
    TODO = "todo", "To do"
    IN_PROGRESS = "in_progress", "In progress"
    DONE = "done", "Done"


class Priority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    URGENT = "urgent", "Urgent"


class Task(BaseModel):
    workspace = models.ForeignKey(
        "workspaces.Workspace", on_delete=models.CASCADE, related_name="tasks"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)
    due_date = models.DateField(null=True, blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_tasks",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_tasks"
    )

    @property
    def is_complete(self) -> bool:
        return self.status == Status.DONE

    @property
    def is_overdue(self) -> bool:
        if self.due_date is None or self.is_complete:
            return False
        return self.due_date < timezone.localdate()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["workspace", "status"]),
            models.Index(fields=["workspace", "due_date"]),
        ]

    def __str__(self):
        return self.title


class Comment(BaseModel):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
    body = models.TextField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="comments"
    )

    class Meta:
        ordering = ["created_at"]
        indexes = [models.Index(fields=["task", "created_at"])]

    def __str__(self):
        return f"Comment on {self.task_id}"
