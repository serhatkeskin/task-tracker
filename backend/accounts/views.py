from rest_framework.generics import RetrieveAPIView

from accounts.serializers import UserSlimSerializer


class MeView(RetrieveAPIView):
    serializer_class = UserSlimSerializer

    def get_object(self):
        return self.request.user
