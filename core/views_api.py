# core/views_api.py
from rest_framework import generics
from rest_framework.permissions import AllowAny
from .models import Profile
from .serializers import ProfileSerializer

class ProfileListCreateAPIView(generics.ListCreateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]  # Allows access without authentication

class ProfileDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [AllowAny]  # Change this if you need to restrict access
