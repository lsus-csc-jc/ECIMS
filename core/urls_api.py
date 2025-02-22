# core/urls_api.py
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from rest_framework.routers import DefaultRouter
from .views_api import ProfileListCreateAPIView, ProfileDetailAPIView, ItemViewSet, SupplierViewSet, OrderViewSet, OrderItemViewSet, ReportViewSet

router = DefaultRouter()
router.register(r'items', ItemViewSet)
router.register(r'suppliers', SupplierViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order_items', OrderItemViewSet)
router.register(r'report', ReportViewSet)

urlpatterns = [
    path('v1/', include(router.urls)),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'),
    path('profiles/', ProfileListCreateAPIView.as_view(), name='profile-list'),
    path('profiles/<int:pk>/', ProfileDetailAPIView.as_view(), name='profile-detail'),
]
