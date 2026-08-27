from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import mixins, viewsets

from tasks.filters import TaskQueryFilter
from tasks.models import Comment, Task
from tasks.serializers import CommentSerializer, TaskSerializer
from workspaces.models import Workspace
from workspaces.permissions import IsWorkspaceMember


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsWorkspaceMember]
    query_filter = TaskQueryFilter()

    def get_workspace(self):
        workspace_pk = self.kwargs.get("workspace_pk")
        if workspace_pk is None:
            return None
        return get_object_or_404(Workspace.objects, pk=workspace_pk)

    def get_queryset(self):
        queryset = (
            Task.objects.select_related("assigned_to", "created_by", "workspace")
            .annotate(
                comment_count=Count(
                    "comments", filter=Q(comments__deleted_at__isnull=True), distinct=True
                )
            )
            .order_by("-created_at")
        )
        workspace_pk = self.kwargs.get("workspace_pk")
        if workspace_pk is not None:
            queryset = queryset.filter(workspace_id=workspace_pk)
        else:
            queryset = queryset.filter(
                Q(workspace__admin=self.request.user) | Q(workspace__members=self.request.user)
            ).distinct()
        if self.action != "list":
            return queryset
        return self.query_filter.apply(queryset, self.request.query_params)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["workspace"] = self.get_workspace()
        return context

    def perform_create(self, serializer):
        serializer.save(workspace=self.get_workspace(), created_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()


class CommentViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = CommentSerializer
    permission_classes = [IsWorkspaceMember]

    def get_task(self):
        task_pk = self.kwargs.get("task_pk")
        if task_pk is None:
            return None
        return get_object_or_404(Task.objects, pk=task_pk)

    def get_workspace(self):
        task = self.get_task()
        return task.workspace if task else None

    def get_queryset(self):
        task_pk = self.kwargs.get("task_pk")
        if task_pk is not None:
            return Comment.objects.select_related("created_by").filter(task_id=task_pk)
        return Comment.objects.select_related("created_by", "task__workspace")

    def perform_create(self, serializer):
        serializer.save(task=self.get_task(), created_by=self.request.user)

    def perform_destroy(self, instance):
        instance.soft_delete()
