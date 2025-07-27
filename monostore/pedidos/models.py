from django.db import models
from django.contrib.auth import get_user_model
from catalogo.models import Producto

User = get_user_model()


class Carrito(models.Model):
    ABIERTO = "abierto"
    CERRADO = "cerrado"
    ESTADOS = [(ABIERTO, "Abierto"), (CERRADO, "Cerrado")]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name="carritos")
    estado  = models.CharField(max_length=10, choices=ESTADOS, default=ABIERTO)
    creado  = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Carrito"
        verbose_name_plural = "Carritos"

    def __str__(self):
        return f"{self.usuario} · {self.estado}"


class LineaCarrito(models.Model):
    carrito  = models.ForeignKey(Carrito, on_delete=models.CASCADE, related_name="lineas")
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = [("carrito", "producto")]
        verbose_name = "Línea de carrito"
        verbose_name_plural = "Líneas de carrito"

    def __str__(self):
        return f"{self.producto} x {self.cantidad}"


class Orden(models.Model):
    usuario   = models.ForeignKey(User, on_delete=models.CASCADE, related_name="ordenes")
    total     = models.DecimalField(max_digits=12, decimal_places=2)
    creado    = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Orden"
        verbose_name_plural = "Órdenes"

    def __str__(self):
        return f"Orden #{self.id} – {self.usuario}"


class LineaOrden(models.Model):
    orden    = models.ForeignKey(Orden, on_delete=models.CASCADE, related_name="lineas")
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.PositiveIntegerField()
    precio   = models.DecimalField(max_digits=10, decimal_places=2)  # copia de precio al momento

    class Meta:
        verbose_name = "Línea de orden"
        verbose_name_plural = "Líneas de orden"

    def __str__(self):
        return f"{self.producto} x {self.cantidad}"
