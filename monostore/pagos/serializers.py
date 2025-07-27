from rest_framework import serializers
from .models import Pago


class PagoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pago
        # el frontend sólo envía orden, método, monto, referencia
        fields = ["id", "orden", "metodo", "monto", "referencia", "estado", "creado"]
        read_only_fields = ["estado", "creado"]
