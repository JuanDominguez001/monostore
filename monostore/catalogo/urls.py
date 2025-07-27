from rest_framework import routers
from .views import CategoriaViewSet, MarcaViewSet, ProductoViewSet, InventarioViewSet

router = routers.DefaultRouter()
router.register(r"categorias", CategoriaViewSet)
router.register(r"marcas", MarcaViewSet)
router.register(r"productos", ProductoViewSet)
router.register(r"inventarios", InventarioViewSet)

urlpatterns = router.urls
