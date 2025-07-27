from rest_framework import serializers
from .models import Envio


class EnvioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Envio
        fields = [
            "id",
            "orden",
            "proveedor",
            "tracking",
            "estado",
            "creado",
            "actualizado",
        ]
        read_only_fields = ["estado", "creado", "actualizado"]
