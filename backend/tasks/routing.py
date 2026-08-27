from django.urls import path

from tasks.consumers import TaskConsumer

websocket_urlpatterns = [
    path("ws/workspaces/<int:workspace_id>/", TaskConsumer.as_asgi()),
]
