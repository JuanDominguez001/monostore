from django.db import models
from pedidos.models import Orden
from django.utils.translation import gettext_lazy as _


class Envio(models.Model):
    class Estado(models.TextChoices):
        PREPARANDO = "preparando", _("Preparando")
        TRANSITO   = "transito",   _("En tránsito")
        ENTREGADO  = "entregado",  _("Entregado")

    orden     = models.OneToOneField(
        Orden, on_delete=models.CASCADE, related_name="envio"
    )
    proveedor = models.CharField(max_length=40)                 # DHL, FedEx, Estafeta…
    tracking  = models.CharField(max_length=80, unique=True)
    estado    = models.CharField(
        max_length=12, choices=Estado.choices, default=Estado.PREPARANDO
    )
    creado    = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Envío")
        verbose_name_plural = _("Envíos")
        ordering = ["-creado"]

    def __str__(self):
        return f"{self.orden} · {self.tracking}"
