import logging
import time
import uuid

logger = logging.getLogger("core.request")


class RequestIdMiddleware:
    """Tags each request with a UUID, logs its method, path, status and duration."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = request.headers.get("X-Request-Id") or uuid.uuid4().hex
        started = time.monotonic()
        response = self.get_response(request)
        duration_ms = (time.monotonic() - started) * 1000
        response["X-Request-Id"] = request.request_id
        user = getattr(request, "user", None)
        user_repr = user.username if (user and user.is_authenticated) else "anon"
        logger.info(
            "%s %s %s %.1fms user=%s id=%s",
            request.method,
            request.get_full_path(),
            response.status_code,
            duration_ms,
            user_repr,
            request.request_id,
        )
        return response
