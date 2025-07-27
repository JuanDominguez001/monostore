from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # API apps
    path("api/", include("catalogo.urls")),
    path("api/", include("pedidos.urls")),
    path("api/", include("pagos.urls")),
    path("api/", include("usuarios.urls")),
    path("api/", include("envios.urls")), 


    # Auth navegable de DRF
    path("api/auth/", include("rest_framework.urls")),

    # JWT
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]




