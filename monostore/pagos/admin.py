from django.contrib import admin
from .models import Pago


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ["id", "orden", "metodo", "monto", "estado", "creado"]
    list_filter  = ["estado", "metodo"]
    search_fields = ["orden__id", "referencia"]
