from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.db import close_old_connections
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from accounts.models import User


@database_sync_to_async
def _user_from_token(raw_token):
    close_old_connections()
    if not raw_token:
        return AnonymousUser()
    try:
        token = AccessToken(raw_token)
        return User.objects.get(pk=token["user_id"])
    except (TokenError, KeyError, User.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get("query_string", b"").decode())
        scope["user"] = await _user_from_token(query.get("token", [None])[0])
        return await super().__call__(scope, receive, send)
