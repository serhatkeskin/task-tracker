from rest_framework import serializers

from accounts.models import User
from accounts.serializers import UserSlimSerializer
from tasks.models import Comment, Task


class TaskSerializer(serializers.ModelSerializer):
    assigned_to = UserSlimSerializer(read_only=True)
    created_by = UserSlimSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        source="assigned_to",
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    is_complete = serializers.BooleanField(read_only=True)
    is_overdue = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            "id",
            "workspace",
            "title",
            "description",
            "status",
            "priority",
            "due_date",
            "assigned_to",
            "assigned_to_id",
            "created_by",
            "is_complete",
            "is_overdue",
            "comment_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "workspace", "created_by", "created_at", "updated_at"]

    def get_is_overdue(self, obj) -> bool:
        return obj.is_overdue

    def get_comment_count(self, obj) -> int:
        annotated = getattr(obj, "comment_count", None)
        return annotated if annotated is not None else obj.comments.count()

    def validate(self, attrs):
        """A task may only be assigned to someone in its own workspace."""
        assignee = attrs.get("assigned_to")
        if assignee is None:
            return attrs
        workspace = self.instance.workspace if self.instance else self.context["workspace"]
        if not workspace.has_member(assignee):
            raise serializers.ValidationError(
                {"assigned_to_id": "That user is not a member of this workspace."}
            )
        return attrs


class CommentSerializer(serializers.ModelSerializer):
    created_by = UserSlimSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "task", "body", "created_by", "created_at"]
        read_only_fields = ["id", "task", "created_by", "created_at"]
