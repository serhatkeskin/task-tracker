from django.contrib.auth.models import AbstractUser, UserManager

from core.models import TimeStampedModel


class User(AbstractUser, TimeStampedModel):
    objects = UserManager()
    all_objects = UserManager()

    class Meta:
        db_table = "accounts_user"
        ordering = ["first_name", "username"]

    @property
    def display_name(self) -> str:
        return self.get_full_name() or self.username
