# core/urls_api.py
from django.urls import path
from .views_api import ProfileListCreateAPIView, ProfileDetailAPIView

urlpatterns = [
    path('profiles/', ProfileListCreateAPIView.as_view(), name='profile-list'),
    path('profiles/<int:pk>/', ProfileDetailAPIView.as_view(), name='profile-detail'),
]
