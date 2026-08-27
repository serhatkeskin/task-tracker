from django.contrib import admin

from tasks.models import Comment, Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "workspace", "status", "priority", "assigned_to", "due_date")
    list_filter = ("status", "priority", "workspace")
    search_fields = ("title", "description")


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("task", "created_by", "created_at")
