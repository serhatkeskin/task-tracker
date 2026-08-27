from django.contrib import admin

from workspaces.models import Workspace


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ("name", "admin", "created_at")
    filter_horizontal = ("members",)
