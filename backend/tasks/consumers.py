from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer


@database_sync_to_async
def is_workspace_member(user_id, workspace_id):
    from accounts.models import User
    from workspaces.models import Workspace

    workspace = Workspace.objects.filter(pk=workspace_id).first()
    user = User.objects.filter(pk=user_id).first()
    return bool(workspace and user and workspace.has_member(user))


class TaskConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.workspace_id = int(self.scope["url_route"]["kwargs"]["workspace_id"])
        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.accept()
            await self.close(code=4401)
            return
        if not await is_workspace_member(user.pk, self.workspace_id):
            await self.accept()
            await self.close(code=4403)
            return
        self.group_name = f"workspace_{self.workspace_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        group_name = getattr(self, "group_name", None)
        if group_name:
            await self.channel_layer.group_discard(group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        return  # ignore client frames

    async def broadcast(self, event):
        await self.send_json({"type": event["event_type"], "payload": event["payload"]})
