from rest_framework import routers
from .views import CarritoViewSet, OrdenViewSet

router = routers.DefaultRouter()
router.register(r"carritos", CarritoViewSet, basename="carrito")
router.register(r"ordenes", OrdenViewSet, basename="orden")

urlpatterns = router.urls
