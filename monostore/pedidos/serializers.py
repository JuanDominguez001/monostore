from rest_framework import serializers
from .models import Carrito, LineaCarrito, Orden, LineaOrden
from catalogo.serializers import ProductoSerializer


class LineaCarritoSerializer(serializers.ModelSerializer):
    producto_detalle = ProductoSerializer(source="producto", read_only=True)

    class Meta:
        model = LineaCarrito
        fields = ["id", "producto", "producto_detalle", "cantidad"]


class CarritoSerializer(serializers.ModelSerializer):
    lineas = LineaCarritoSerializer(many=True, read_only=True)

    class Meta:
        model = Carrito
        fields = ["id", "estado", "creado", "actualizado", "lineas"]


class LineaOrdenSerializer(serializers.ModelSerializer):
    producto_detalle = ProductoSerializer(source="producto", read_only=True)

    class Meta:
        model = LineaOrden
        fields = ["producto", "producto_detalle", "cantidad", "precio"]


class OrdenSerializer(serializers.ModelSerializer):
    lineas = LineaOrdenSerializer(many=True, read_only=True)

    class Meta:
        model = Orden
        fields = ["id", "total", "creado", "lineas"]
