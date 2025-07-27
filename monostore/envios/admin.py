from django.contrib import admin
from .models import Envio


@admin.register(Envio)
class EnvioAdmin(admin.ModelAdmin):
    list_display  = ["id", "orden", "proveedor", "tracking", "estado", "actualizado"]
    search_fields = ["tracking", "orden__id"]
    list_filter   = ["estado", "proveedor"]
