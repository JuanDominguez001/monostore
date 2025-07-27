from rest_framework import serializers
from .models import Categoria, Marca, Producto, Inventario


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = "__all__"


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = "__all__"


class InventarioSerializer(serializers.ModelSerializer):
    # permitir escribir producto por id
    producto = serializers.PrimaryKeyRelatedField(
        queryset=Producto.objects.all()
    )

    class Meta:
        model = Inventario
        fields = ["id", "producto", "cantidad", "actualizado"]



class ProductoSerializer(serializers.ModelSerializer):
    # *** campos de escritura ***
    categoria = serializers.PrimaryKeyRelatedField(
        queryset=Categoria.objects.all()
    )
    marca = serializers.PrimaryKeyRelatedField(
        queryset=Marca.objects.all()
    )

    # *** campos solo lectura ***
    categoria_detalle = CategoriaSerializer(source="categoria", read_only=True)
    marca_detalle = MarcaSerializer(source="marca", read_only=True)
    stock = serializers.IntegerField(source="stock.cantidad", read_only=True)

    class Meta:
        model = Producto
        fields = [
            "id",
            "categoria",        # write
            "marca",            # write
            "nombre",
            "descripcion",
            "sku",
            "precio",
            "activo",
            "categoria_detalle",  # read
            "marca_detalle",      # read
            "stock",              # read
        ]