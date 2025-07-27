from rest_framework import routers
from .views import EnvioViewSet

router = routers.DefaultRouter()
router.register(r"envios", EnvioViewSet, basename="envio")

urlpatterns = router.urls
