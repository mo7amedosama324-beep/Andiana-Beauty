from decimal import Decimal

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product

from .models import Cart, CartItem, Order, OrderItem, product_unit_price
from .serializers import (
    CartItemWriteSerializer,
    CartSerializer,
    CheckoutSerializer,
    OrderSerializer,
)


class CartCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        cart = Cart.objects.create()
        return Response(CartSerializer(cart).data, status=status.HTTP_201_CREATED)


class CartDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, cart_id):
        cart = get_object_or_404(
            Cart.objects.prefetch_related("items__product"), pk=cart_id
        )
        return Response(CartSerializer(cart).data)


class CartItemUpsertView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, cart_id):
        cart = get_object_or_404(Cart, pk=cart_id)
        ser = CartItemWriteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        product = ser.validated_data["product"]
        quantity = ser.validated_data["quantity"]

        if not product.is_active:
            return Response(
                {"detail": "Product is not available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity == 0:
            CartItem.objects.filter(cart=cart, product=product).delete()
            cart.refresh_from_db()
            return Response(CartSerializer(cart).data)

        CartItem.objects.update_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )
        cart.refresh_from_db()
        return Response(CartSerializer(cart).data)


class CartItemDeleteView(APIView):
    permission_classes = [AllowAny]

    def delete(self, request, cart_id, item_id):
        cart = get_object_or_404(Cart, pk=cart_id)
        deleted, _ = CartItem.objects.filter(pk=item_id, cart=cart).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        cart.refresh_from_db()
        return Response(CartSerializer(cart).data)


class CheckoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, cart_id):
        cart = get_object_or_404(
            Cart.objects.prefetch_related("items__product"), pk=cart_id
        )
        if not cart.items.exists():
            return Response(
                {"detail": "Cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        checkout = CheckoutSerializer(data=request.data)
        checkout.is_valid(raise_exception=True)

        for line in cart.items.all():
            if not line.product.is_active:
                return Response(
                    {
                        "detail": f'Product "{line.product.name}" is no longer available.',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        total = Decimal("0")
        order_items_payload = []
        for line in cart.items.select_related("product"):
            unit = product_unit_price(line.product)
            line_amount = unit * line.quantity
            total += line_amount
            order_items_payload.append(
                {
                    "product": line.product,
                    "product_name": line.product.name,
                    "quantity": line.quantity,
                    "unit_price": unit,
                }
            )

        with transaction.atomic():
            order = Order.objects.create(
                customer_name=checkout.validated_data["customer_name"],
                customer_phone=checkout.validated_data["customer_phone"],
                customer_address=checkout.validated_data["customer_address"],
                total=total,
            )
            OrderItem.objects.bulk_create(
                [
                    OrderItem(order=order, **payload)
                    for payload in order_items_payload
                ]
            )
            cart.items.all().delete()
            cart.delete()

        order = Order.objects.prefetch_related("items").get(pk=order.pk)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Order.objects.prefetch_related("items").all()
        return Response(OrderSerializer(qs, many=True).data)


class OrderDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        order = get_object_or_404(Order.objects.prefetch_related("items"), pk=pk)
        return Response(OrderSerializer(order).data)
