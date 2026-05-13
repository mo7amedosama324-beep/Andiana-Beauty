from django.contrib import admin

from .models import Cart, CartItem, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "product_name", "quantity", "unit_price")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "customer_name",
        "customer_phone",
        "total",
        "status",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("customer_name", "customer_phone", "customer_address")
    ordering = ("-created_at",)
    readonly_fields = ("total", "created_at")
    inlines = [OrderItemInline]


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "created_at", "updated_at")


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "product", "quantity")
