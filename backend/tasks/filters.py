from django.db.models import Case, IntegerField, Q, When
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from tasks.models import Priority, Status

PRIORITY_RANK = {
    Priority.URGENT: 0,
    Priority.HIGH: 1,
    Priority.MEDIUM: 2,
    Priority.LOW: 3,
}


class TaskQueryFilter:
    MULTI_CHOICE = {"status": set(Status.values), "priority": set(Priority.values)}
    ORDERING = {
        "created_at",
        "-created_at",
        "due_date",
        "-due_date",
        "title",
        "-title",
        "priority",
        "-priority",
    }
    DEFAULT_ORDERING = "-created_at"

    def apply(self, queryset, params):
        queryset = self._apply_choices(queryset, params)
        queryset = self._apply_assignee(queryset, params)
        queryset = self._apply_search(queryset, params)
        queryset = self._apply_overdue(queryset, params)
        return self._apply_ordering(queryset, params)

    def _apply_choices(self, queryset, params):
        for name, allowed in self.MULTI_CHOICE.items():
            values = self._split(params.get(name))
            if not values:
                continue
            unknown = [v for v in values if v not in allowed]
            if unknown:
                raise ValidationError(
                    {
                        name: (
                            f"Unknown value(s): {', '.join(unknown)}. "
                            f"Allowed: {', '.join(sorted(allowed))}."
                        )
                    }
                )
            queryset = queryset.filter(**{f"{name}__in": values})
        return queryset

    def _apply_assignee(self, queryset, params):
        values = self._split(params.get("assigned_to"))
        if not values:
            return queryset
        condition = Q()
        ids = []
        for value in values:
            if value == "unassigned":
                condition |= Q(assigned_to__isnull=True)
                continue
            if not value.isdigit():
                raise ValidationError(
                    {"assigned_to": (f"'{value}' is not a user id or the literal 'unassigned'.")}
                )
            ids.append(int(value))
        if ids:
            condition |= Q(assigned_to_id__in=ids)
        return queryset.filter(condition)

    def _apply_search(self, queryset, params):
        term = (params.get("q") or "").strip()
        if not term:
            return queryset
        return queryset.filter(Q(title__icontains=term) | Q(description__icontains=term))

    def _apply_overdue(self, queryset, params):
        raw = (params.get("overdue") or "").strip().lower()
        if not raw:
            return queryset
        if raw not in {"true", "false"}:
            raise ValidationError({"overdue": "Expected 'true' or 'false'."})
        overdue = Q(due_date__lt=timezone.localdate()) & ~Q(status=Status.DONE)
        return queryset.filter(overdue) if raw == "true" else queryset.exclude(overdue)

    def _apply_ordering(self, queryset, params):
        ordering = (params.get("ordering") or "").strip() or self.DEFAULT_ORDERING
        if ordering not in self.ORDERING:
            raise ValidationError(
                {
                    "ordering": (
                        f"'{ordering}' is not an orderable field. "
                        f"Allowed: {', '.join(sorted(self.ORDERING))}."
                    )
                }
            )
        if ordering.lstrip("-") == "priority":
            queryset = queryset.annotate(
                priority_rank=Case(
                    *[When(priority=value, then=rank) for value, rank in PRIORITY_RANK.items()],
                    default=99,
                    output_field=IntegerField(),
                )
            )
            ordering = ordering.replace("priority", "priority_rank")
        if ordering.lstrip("-") == "due_date":
            # Tasks without a due date sort last in either direction.
            return queryset.annotate(
                has_due_date=Case(
                    When(due_date__isnull=True, then=1),
                    default=0,
                    output_field=IntegerField(),
                )
            ).order_by("has_due_date", ordering, "-created_at")
        return queryset.order_by(ordering, "-created_at")

    @staticmethod
    def _split(raw):
        if not raw:
            return []
        return [part.strip() for part in raw.split(",") if part.strip()]
