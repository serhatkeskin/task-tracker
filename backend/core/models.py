from django.db import models
from django.utils import timezone

from core.managers import BaseManager


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = BaseManager()
    all_objects = models.Manager()  # noqa: DJ012

    class Meta:
        abstract = True

    def _lifecycle_fields(self):
        fields = ["deleted_at", "updated_at"]
        if hasattr(self, "is_active"):
            fields.append("is_active")
        return fields

    def soft_delete(self):
        self.deleted_at = timezone.now()
        if hasattr(self, "is_active"):
            self.is_active = False
        self.save(update_fields=self._lifecycle_fields())


class BaseModel(TimeStampedModel):
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True
