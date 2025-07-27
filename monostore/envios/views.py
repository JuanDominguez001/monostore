from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Envio
from .serializers import EnvioSerializer
from .permissions import IsStaffOrOwnerReadOnly


class EnvioViewSet(viewsets.ModelViewSet):
    queryset = Envio.objects.select_related("orden", "orden__usuario")
    serializer_class = EnvioSerializer
    permission_classes = [permissions.IsAuthenticated, IsStaffOrOwnerReadOnly]

    def get_queryset(self):
        qs = self.queryset
        if not self.request.user.is_staff:
            qs = qs.filter(orden__usuario=self.request.user)
        return qs

    # --- staff actualiza estado ---
    @action(detail=True, methods=["patch"], permission_classes=[permissions.IsAdminUser])
    def cambiar_estado(self, request, pk=None):
        """
        Body: { "estado": "transito" | "entregado" }
        """
        envio = self.get_object()
        envio.estado = request.data.get("estado", envio.estado)
        envio.save(update_fields=["estado"])
        return Response(EnvioSerializer(envio).data, status=status.HTTP_200_OK)
