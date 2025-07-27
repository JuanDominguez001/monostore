from django.db import models
from django.utils.translation import gettext_lazy as _


class Categoria(models.Model):
    nombre = models.CharField(max_length=120, unique=True)
    slug   = models.SlugField(max_length=140, unique=True)

    class Meta:
        verbose_name = _("Categoría")
        verbose_name_plural = _("Categorías")
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Marca(models.Model):
    nombre = models.CharField(max_length=120, unique=True)

    class Meta:
        verbose_name = _("Marca")
        verbose_name_plural = _("Marcas")
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    categoria   = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name="productos")
    marca       = models.ForeignKey(Marca,     on_delete=models.PROTECT, related_name="productos")
    nombre      = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    sku         = models.CharField(max_length=50, unique=True)
    precio      = models.DecimalField(max_digits=10, decimal_places=2)
    activo      = models.BooleanField(default=True)
    creado      = models.DateTimeField(auto_now_add=True)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Producto")
        verbose_name_plural = _("Productos")
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Inventario(models.Model):
    producto    = models.OneToOneField(Producto, on_delete=models.CASCADE, related_name="stock")
    cantidad    = models.PositiveIntegerField(default=0)
    actualizado = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Inventario")
        verbose_name_plural = _("Inventarios")

    def __str__(self):
        return f"{self.producto} | {self.cantidad} uds."


# --- al final de catalogo/models.py -------------------------------
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Producto)
def crear_inventario(sender, instance, created, **kwargs):
    """
    Si el producto es nuevo y aún no tiene Inventario, créalo en 0.
    """
    from catalogo.models import Inventario
    if created and not hasattr(instance, "stock"):
        Inventario.objects.create(producto=instance, cantidad=0)
