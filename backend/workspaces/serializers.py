from rest_framework import serializers

from accounts.serializers import UserSlimSerializer
from workspaces.models import Workspace


class WorkspaceSerializer(serializers.ModelSerializer):
    admin = UserSlimSerializer(read_only=True)
    members = UserSlimSerializer(many=True, read_only=True)

    class Meta:
        model = Workspace
        fields = ["id", "name", "admin", "members", "created_at"]
        read_only_fields = fields
