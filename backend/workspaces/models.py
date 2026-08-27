from django.conf import settings
from django.db import models
from django.db.models import Q

from core.managers import BaseManager
from core.models import BaseModel


class WorkspaceManager(BaseManager):
    def filter_by_member(self, user):
        if not user or not user.is_authenticated:
            return self.none()
        return self.filter(Q(admin=user) | Q(members=user)).distinct()


class Workspace(BaseModel):
    name = models.CharField(max_length=120)
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="administered_workspaces",
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="workspaces",
        blank=True,
    )

    # Declared first so it stays the _default_manager.
    objects = WorkspaceManager()

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def has_member(self, user) -> bool:
        if not user or not user.is_authenticated:
            return False
        return self.admin_id == user.id or self.members.filter(pk=user.pk).exists()
