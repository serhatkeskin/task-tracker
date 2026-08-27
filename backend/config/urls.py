from django.conf import settings
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import MeView
from tasks.views import CommentViewSet, TaskViewSet
from workspaces.views import WorkspaceViewSet

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path(
        "api/workspaces/",
        WorkspaceViewSet.as_view({"get": "list"}),
        name="workspace-list",
    ),
    path(
        "api/workspaces/<int:pk>/",
        WorkspaceViewSet.as_view({"get": "retrieve"}),
        name="workspace-detail",
    ),
    path(
        "api/workspaces/<int:workspace_pk>/tasks/",
        TaskViewSet.as_view({"get": "list", "post": "create"}),
        name="task-list",
    ),
    path(
        "api/tasks/<int:pk>/",
        TaskViewSet.as_view(
            {"get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"}
        ),
        name="task-detail",
    ),
    path(
        "api/tasks/<int:task_pk>/comments/",
        CommentViewSet.as_view({"get": "list", "post": "create"}),
        name="comment-list",
    ),
    path(
        "api/comments/<int:pk>/",
        CommentViewSet.as_view({"delete": "destroy"}),
        name="comment-detail",
    ),
]

if settings.DEBUG:
    urlpatterns += staticfiles_urlpatterns()
