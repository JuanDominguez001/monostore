from rest_framework import routers
from .views import PagoViewSet

router = routers.DefaultRouter()
router.register(r"pagos", PagoViewSet, basename="pago")

urlpatterns = router.urls
