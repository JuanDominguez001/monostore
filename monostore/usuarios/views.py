from rest_framework import generics, permissions
from .serializers import RegistroSerializer, PerfilCompletoSerializer


class RegistroView(generics.CreateAPIView):
    serializer_class   = RegistroSerializer
    permission_classes = [permissions.AllowAny]


class PerfilView(generics.RetrieveUpdateAPIView):
    serializer_class   = PerfilCompletoSerializer   # ← usa el nuevo
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
