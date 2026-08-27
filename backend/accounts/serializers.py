from rest_framework import serializers

from accounts.models import User


class UserSlimSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "display_name", "email"]
        read_only_fields = fields
