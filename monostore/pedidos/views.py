from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Carrito, LineaCarrito, Orden, LineaOrden
from .serializers import CarritoSerializer, LineaCarritoSerializer, OrdenSerializer
from catalogo.models import Producto, Inventario
from envios.models import Envio
import uuid


class CarritoViewSet(viewsets.ModelViewSet):
    """
    • GET /api/carritos/                     – lista del usuario
    • POST /api/carritos/{id}/agregar/      – añade producto
    • POST /api/carritos/{id}/cerrar/       – crea Orden, descuenta stock, genera Envío
    """
    serializer_class   = CarritoSerializer
    permission_classes = [permissions.IsAuthenticated]

    # ---------- queryset del usuario ----------
    def get_queryset(self):
        return Carrito.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        serializer.save(usuario=self.request.user)

    # ---------- agregar producto ----------
    @action(detail=True, methods=["post"])
    def agregar(self, request, pk=None):
        """
        Body JSON: { "producto": 2, "cantidad": 3 }
        """
        carrito = self.get_object()
        if carrito.estado != Carrito.ABIERTO:
            return Response({"detail": "Carrito cerrado."}, status=400)

        prod          = Producto.objects.get(pk=request.data["producto"])
        linea, _      = LineaCarrito.objects.get_or_create(carrito=carrito, producto=prod)
        linea.cantidad += int(request.data.get("cantidad", 1))
        linea.save()

        return Response(LineaCarritoSerializer(linea).data, status=201)

    # ---------- cerrar carrito ----------
    @action(detail=True, methods=["post"])
    def cerrar(self, request, pk=None):
        carrito = self.get_object()
        if carrito.estado != Carrito.ABIERTO or not carrito.lineas.exists():
            return Response({"detail": "Carrito ya cerrado o vacío."}, status=400)

        try:
            with transaction.atomic():

                # 1· validar y descontar inventario (bloqueo FOR UPDATE)
                for l in carrito.lineas.select_related("producto"):
                    inv = (
                        Inventario.objects
                        .select_for_update()
                        .get(producto=l.producto)
                    )
                    if l.cantidad > inv.cantidad:
                        raise ValueError(
                            f"Sin stock para «{l.producto.nombre}» "
                            f"(disponible {inv.cantidad})"
                        )
                    inv.cantidad -= l.cantidad
                    inv.save(update_fields=["cantidad"])

                # 2· crear orden y sus líneas
                total = sum(l.cantidad * l.producto.precio for l in carrito.lineas.all())
                orden = Orden.objects.create(usuario=request.user, total=total)

                for l in carrito.lineas.all():
                    LineaOrden.objects.create(
                        orden    = orden,
                        producto = l.producto,
                        cantidad = l.cantidad,
                        precio   = l.producto.precio,
                    )

                # 3· crear envío inicial
                Envio.objects.create(
                    orden     = orden,
                    proveedor = "Por asignar",
                    tracking  = str(uuid.uuid4())[:12].upper(),
                )

                # 4· cerrar carrito
                carrito.estado = Carrito.CERRADO
                carrito.save()

        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_409_CONFLICT)

        return Response(OrdenSerializer(orden).data, status=201)


class OrdenViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class   = OrdenSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Orden.objects.filter(usuario=self.request.user)
