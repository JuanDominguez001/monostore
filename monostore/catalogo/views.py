from rest_framework import viewsets, permissions
from .models import Categoria, Marca, Producto, Inventario
from .serializers import CategoriaSerializer, MarcaSerializer, ProductoSerializer, InventarioSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:  # GET/HEAD/OPTIONS
            return True
        return request.user and request.user.is_staff

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [permissions.IsAuthenticated]


class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.select_related("categoria", "marca")
    serializer_class = ProductoSerializer
    permission_classes = [permissions.IsAuthenticated]

class InventarioViewSet(viewsets.ModelViewSet):
    queryset = Inventario.objects.select_related("producto")
    serializer_class = InventarioSerializer
    permission_classes = [permissions.IsAuthenticated]