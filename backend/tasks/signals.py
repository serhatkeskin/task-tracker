import logging

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from tasks.models import Comment, Task

logger = logging.getLogger("tasks.signals")


def push(workspace_id, event_type, payload):
    layer = get_channel_layer()
    if layer is None:
        return
    try:
        async_to_sync(layer.group_send)(
            f"workspace_{workspace_id}",
            {"type": "broadcast", "event_type": event_type, "payload": payload},
        )
    except Exception:
        logger.exception("Failed to broadcast %s for workspace %s", event_type, workspace_id)


@receiver(post_save, sender=Task)
def broadcast_task_saved(sender, instance, created, **kwargs):
    from tasks.serializers import TaskSerializer

    if instance.deleted_at is not None:
        push(instance.workspace_id, "task.deleted", {"id": instance.pk})
        return
    event_type = "task.created" if created else "task.updated"
    push(instance.workspace_id, event_type, TaskSerializer(instance).data)


@receiver(post_delete, sender=Task)
def broadcast_task_deleted(sender, instance, **kwargs):
    push(instance.workspace_id, "task.deleted", {"id": instance.pk})


@receiver(post_save, sender=Comment)
def broadcast_comment_saved(sender, instance, created, **kwargs):
    from tasks.serializers import CommentSerializer

    if instance.deleted_at is not None:
        push(
            instance.task.workspace_id,
            "comment.deleted",
            {"id": instance.pk, "task_id": instance.task_id},
        )
        return
    if created:
        push(
            instance.task.workspace_id,
            "comment.created",
            CommentSerializer(instance).data,
        )


@receiver(post_delete, sender=Comment)
def broadcast_comment_deleted(sender, instance, **kwargs):
    push(
        instance.task.workspace_id,
        "comment.deleted",
        {"id": instance.pk, "task_id": instance.task_id},
    )
