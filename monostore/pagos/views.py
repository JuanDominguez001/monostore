from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Pago
from .serializers import PagoSerializer





class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.select_related("orden", "orden__usuario")
    serializer_class = PagoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # cada usuario sólo ve sus pagos
        return self.queryset.filter(orden__usuario=self.request.user)

    def perform_create(self, serializer):
        # fuerza que el pago pertenezca al usuario autenticado
        orden = serializer.validated_data["orden"]
        if orden.usuario != self.request.user:
            raise serializers.ValidationError("No puedes pagar órdenes de otro usuario.")
        serializer.save()

    # --- cambio de estado manual (simulación webhook) ---
    @action(detail=True, methods=["post"])
    def aprobar(self, request, pk=None):
        pago = self.get_object()
        pago.estado = Pago.Estado.APROBADO
        pago.save()
        return Response(PagoSerializer(pago).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def rechazar(self, request, pk=None):
        pago = self.get_object()
        pago.estado = Pago.Estado.RECHAZADO
        pago.save()
        return Response(PagoSerializer(pago).data, status=status.HTTP_200_OK)
