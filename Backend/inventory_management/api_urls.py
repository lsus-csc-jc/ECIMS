from django.urls import path, include
from rest_framework.routers import DefaultRouter
from inventory_management.views import (
    ItemViewSet, SupplierViewSet, CategoryViewSet, OrderViewSet,
    OrderItemViewSet, CustomerViewSet, ProductViewSet, api_login, api_root, api_signup
)

router = DefaultRouter()
router.register(r'items', ItemViewSet, basename="item")
router.register(r'suppliers', SupplierViewSet, basename="supplier")
router.register(r'categories', CategoryViewSet, basename="category")
router.register(r'orders', OrderViewSet, basename="order")
router.register(r'order-items', OrderItemViewSet, basename="order-item")
router.register(r'customers', CustomerViewSet, basename="customer")
router.register(r'products', ProductViewSet, basename="product")

urlpatterns = [
    path("", api_root, name="api-root"),
    path("login/", api_login, name="api-login"),
    path("signup/", api_signup, name="api-signup"),
    path("", include(router.urls)),
]
