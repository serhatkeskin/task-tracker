from rest_framework.mixins import ListModelMixin, RetrieveModelMixin
from rest_framework.viewsets import GenericViewSet

from workspaces.models import Workspace
from workspaces.permissions import IsWorkspaceMember
from workspaces.serializers import WorkspaceSerializer


class WorkspaceViewSet(ListModelMixin, RetrieveModelMixin, GenericViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [IsWorkspaceMember]

    def get_workspace(self):
        return None

    def get_queryset(self):
        return (
            Workspace.objects.filter_by_member(self.request.user)
            .select_related("admin")
            .prefetch_related("members")
        )
