from django.db import models
from django.utils.translation import gettext_lazy as _
from pedidos.models import Orden


class Pago(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", _("Pendiente")
        APROBADO  = "aprobado",  _("Aprobado")
        RECHAZADO = "rechazado", _("Rechazado")

    orden      = models.OneToOneField(Orden, on_delete=models.CASCADE, related_name="pago")
    metodo     = models.CharField(max_length=50)           # ej. tarjeta, transferencia
    monto      = models.DecimalField(max_digits=12, decimal_places=2)
    referencia = models.CharField(max_length=140, blank=True)  # id de pasarela
    estado     = models.CharField(max_length=10, choices=Estado.choices, default=Estado.PENDIENTE)
    creado     = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Pago")
        verbose_name_plural = _("Pagos")

    def __str__(self):
        return f"{self.orden} · {self.estado}"
