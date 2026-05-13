from decimal import Decimal

from rest_framework import serializers

from products.models import Product

from .models import Cart, CartItem, Order, OrderItem, product_unit_price


class CartProductSerializer(serializers.ModelSerializer):
    unit_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ("id", "name", "price", "sale_price", "unit_price", "image", "image_url")

    def get_unit_price(self, obj):
        return str(product_unit_price(obj))


class CartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        source="product",
        write_only=True,
    )
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ("id", "product", "product_id", "quantity", "line_total")
        read_only_fields = ("id", "product")

    def get_line_total(self, obj):
        total = product_unit_price(obj.product) * obj.quantity
        return str(total)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ("id", "items", "total", "created_at", "updated_at")
        read_only_fields = fields

    def get_total(self, obj):
        t = Decimal("0")
        for line in obj.items.all():
            t += product_unit_price(line.product) * line.quantity
        return str(t)


class CartItemWriteSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=0)


class CheckoutSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=200, trim_whitespace=True)
    customer_phone = serializers.CharField(max_length=32, trim_whitespace=True)
    customer_address = serializers.CharField(trim_whitespace=True)


class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "product_name",
            "quantity",
            "unit_price",
            "line_total",
        )
        read_only_fields = fields

    def get_line_total(self, obj):
        return str(obj.line_total())


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "customer_name",
            "customer_phone",
            "customer_address",
            "total",
            "status",
            "created_at",
            "items",
        )
        read_only_fields = fields
