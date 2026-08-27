from rest_framework.permissions import BasePermission


def resolve_workspace(obj):
    if hasattr(obj, "members"):  # Workspace
        return obj
    if hasattr(obj, "workspace"):  # Task
        return obj.workspace
    if hasattr(obj, "task"):  # Comment
        return obj.task.workspace
    raise TypeError(f"Cannot resolve a workspace from {type(obj).__name__}.")


class IsWorkspaceMember(BasePermission):
    message = "You are not a member of this workspace."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        workspace = view.get_workspace()
        if workspace is None:
            return True
        return workspace.has_member(request.user)

    def has_object_permission(self, request, view, obj):
        return resolve_workspace(obj).has_member(request.user)


class IsWorkspaceAdmin(BasePermission):
    message = "Only the workspace admin can do that."

    def has_object_permission(self, request, view, obj):
        return resolve_workspace(obj).admin_id == request.user.id
