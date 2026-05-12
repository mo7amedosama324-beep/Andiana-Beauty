from rest_framework import viewsets

from .models import Product
from .permissions import IsAdminOrReadOnly
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by("-created_at")
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user and self.request.user.is_staff:
            return queryset
        return queryset.filter(is_active=True)
