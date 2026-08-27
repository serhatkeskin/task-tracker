import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from tasks.models import Comment, Priority, Status, Task
from workspaces.models import Workspace

PASSWORD = "demo12345"

PEOPLE = [
    ("alice", "Alice", "Nakamura"),
    ("bob", "Bob", "Okafor"),
    ("carol", "Carol", "Mendes"),
    ("dave", "Dave", "Lindqvist"),
]

# (workspace, title, description, status, priority, due offset in days, assignee)
TASKS = [
    (
        "eng",
        "Set up CI pipeline",
        "Lint and type-check on every pull request.",
        Status.DONE,
        Priority.HIGH,
        -6,
        "alice",
    ),
    (
        "eng",
        "Design task schema",
        "Decide on soft delete and choice fields.",
        Status.DONE,
        Priority.HIGH,
        -4,
        "alice",
    ),
    (
        "eng",
        "Build task list endpoint",
        "Filtering, ordering and pagination.",
        Status.IN_PROGRESS,
        Priority.URGENT,
        1,
        "bob",
    ),
    (
        "eng",
        "Wire up WebSocket push",
        "Broadcast task changes to workspace members.",
        Status.IN_PROGRESS,
        Priority.HIGH,
        2,
        "bob",
    ),
    (
        "eng",
        "Fix overdue badge timezone",
        "Badge flips a day early for UTC-negative users.",
        Status.TODO,
        Priority.URGENT,
        -1,
        "carol",
    ),
    (
        "eng",
        "Write the README",
        "Setup, environment variables, API reference.",
        Status.TODO,
        Priority.MEDIUM,
        4,
        None,
    ),
    (
        "eng",
        "Audit dependency licences",
        "Check every package before release.",
        Status.TODO,
        Priority.LOW,
        -2,
        "dave",
    ),
    (
        "eng",
        "Add keyboard shortcuts",
        "At minimum: new task, search, close panel.",
        Status.TODO,
        Priority.LOW,
        None,
        None,
    ),
    (
        "mkt",
        "Draft launch announcement",
        "Two paragraphs plus a screenshot.",
        Status.IN_PROGRESS,
        Priority.HIGH,
        3,
        "carol",
    ),
    (
        "mkt",
        "Book the demo recording",
        "Ninety minutes, quiet room.",
        Status.TODO,
        Priority.MEDIUM,
        5,
        "dave",
    ),
    (
        "mkt",
        "Refresh the pricing page",
        "Numbers are three months stale.",
        Status.TODO,
        Priority.MEDIUM,
        None,
        "carol",
    ),
    (
        "mkt",
        "Archive last quarter's assets",
        "Move to cold storage.",
        Status.DONE,
        Priority.LOW,
        -10,
        "dave",
    ),
]

COMMENTS = [
    (
        "Build task list endpoint",
        "bob",
        "Filtering is in. Ordering by priority needs a rank map.",
    ),
    (
        "Build task list endpoint",
        "alice",
        "Reject unknown filter values with a 400 rather than ignoring them.",
    ),
    (
        "Fix overdue badge timezone",
        "carol",
        "Reproduced at UTC-5. Comparing against localdate fixes it.",
    ),
    ("Draft launch announcement", "carol", "First draft is ready for review."),
]


class Command(BaseCommand):
    help = "Reset the database to a known demo fixture."

    @transaction.atomic
    def handle(self, *args, **options):
        users = {}
        for username, first, last in PEOPLE:
            user, _ = User.all_objects.update_or_create(
                username=username,
                defaults={
                    "email": f"{username}@example.com",
                    "first_name": first,
                    "last_name": last,
                    "is_active": True,
                    "deleted_at": None,
                },
            )
            user.set_password(PASSWORD)
            user.save(update_fields=["password"])
            users[username] = user

        # Admin superuser (username: admin, pw: admin)
        admin_user, _ = User.all_objects.update_or_create(
            username="admin",
            defaults={
                "email": "admin@example.com",
                "first_name": "Admin",
                "last_name": "User",
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
                "deleted_at": None,
            },
        )
        admin_user.set_password("admin")
        admin_user.save(update_fields=["password", "is_staff", "is_superuser"])

        engineering, _ = Workspace.all_objects.update_or_create(
            name="Engineering", defaults={"admin": users["alice"], "deleted_at": None}
        )
        engineering.members.set(users.values())

        marketing, _ = Workspace.all_objects.update_or_create(
            name="Marketing", defaults={"admin": users["carol"], "deleted_at": None}
        )
        marketing.members.set([users["carol"], users["dave"]])

        workspaces = {"eng": engineering, "mkt": marketing}
        today = timezone.localdate()
        seeded_tasks = {}

        for key, title, description, status, priority, offset, assignee in TASKS:
            task, _ = Task.all_objects.update_or_create(
                workspace=workspaces[key],
                title=title,
                defaults={
                    "description": description,
                    "status": status,
                    "priority": priority,
                    "due_date": (
                        None if offset is None else today + datetime.timedelta(days=offset)
                    ),
                    "assigned_to": users.get(assignee) if assignee else None,
                    "created_by": workspaces[key].admin,
                    "is_active": True,
                    "deleted_at": None,
                },
            )
            seeded_tasks[title] = task

        abandoned, _ = Task.all_objects.update_or_create(
            workspace=engineering,
            title="Migrate to a monorepo",
            defaults={
                "description": "Abandoned after the scoping meeting.",
                "status": Status.TODO,
                "priority": Priority.LOW,
                "created_by": users["alice"],
            },
        )
        abandoned.soft_delete()

        # Comments have no natural key, so replace them instead of upserting.
        Comment.all_objects.all().delete()
        for title, author, body in COMMENTS:
            Comment.objects.create(task=seeded_tasks[title], body=body, created_by=users[author])

        # Tasks before users: created_by is PROTECT.
        kept_tasks = [task.pk for task in seeded_tasks.values()] + [abandoned.pk]
        Task.all_objects.exclude(pk__in=kept_tasks).delete()
        Workspace.all_objects.exclude(pk__in=[engineering.pk, marketing.pk]).delete()
        User.all_objects.filter(is_superuser=False).exclude(
            pk__in=[user.pk for user in users.values()]
        ).delete()

        self.stdout.write(self.style.SUCCESS("Seeded demo data."))
        self.stdout.write(f"  users      : {', '.join(users)} (password: {PASSWORD})")
        self.stdout.write("  superuser  : admin (password: admin)")
        self.stdout.write(
            f"  workspaces : Engineering (id={engineering.id}), Marketing (id={marketing.id})"
        )
        self.stdout.write(f"  tasks      : {Task.objects.count()} live, 1 soft-deleted")
