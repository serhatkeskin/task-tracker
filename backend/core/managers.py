from django.db import models


class BaseManager(models.Manager):
    """Default manager that hides soft-deleted rows."""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)
