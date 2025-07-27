from django.contrib import admin
from .models import Categoria, Marca, Producto, Inventario


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("nombre",)}
    search_fields = ["nombre"]
    list_display = ["nombre"]


@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    search_fields = ["nombre"]
    list_display = ["nombre"]


class InventarioInline(admin.StackedInline):
    model = Inventario
    extra = 0


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    inlines = [InventarioInline]
    search_fields = ["nombre", "sku"]
    list_display  = ["nombre", "sku", "precio", "activo", "categoria", "marca"]
    list_filter   = ["categoria", "marca", "activo"]

@admin.register(Inventario)
class InventarioAdmin(admin.ModelAdmin):
    list_display = ["producto", "cantidad", "actualizado"]
    search_fields = ["producto__nombre", "producto__sku"]
