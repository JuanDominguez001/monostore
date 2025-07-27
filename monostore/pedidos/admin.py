from django.contrib import admin
from .models import Carrito, LineaCarrito, Orden, LineaOrden


class LineaCarritoInline(admin.TabularInline):
    model = LineaCarrito
    extra = 0


# ---------- acción para cerrar y facturar ----------
@admin.action(description="Cerrar carrito y generar orden")
def cerrar_carrito(modeladmin, request, queryset):
    for carrito in queryset:
        if carrito.estado == Carrito.ABIERTO and carrito.lineas.exists():
            total = sum(l.cantidad * l.producto.precio for l in carrito.lineas.all())
            orden = Orden.objects.create(usuario=carrito.usuario, total=total)
            for l in carrito.lineas.all():
                LineaOrden.objects.create(
                    orden=orden,
                    producto=l.producto,
                    cantidad=l.cantidad,
                    precio=l.producto.precio,
                )
            carrito.estado = Carrito.CERRADO
            carrito.save()
# ---------------------------------------------------


@admin.register(Carrito)
class CarritoAdmin(admin.ModelAdmin):
    list_display = ["id", "usuario", "estado", "actualizado"]
    inlines = [LineaCarritoInline]
    actions = [cerrar_carrito]          # ← aquí la acción


class LineaOrdenInline(admin.TabularInline):
    model = LineaOrden
    extra = 0
    readonly_fields = ["producto", "cantidad", "precio"]


@admin.register(Orden)
class OrdenAdmin(admin.ModelAdmin):
    list_display = ["id", "usuario", "total", "creado"]
    inlines = [LineaOrdenInline]
