from django.urls import path

from . import views

urlpatterns = [
    path("carts/", views.CartCreateView.as_view(), name="cart-create"),
    path("carts/<uuid:cart_id>/", views.CartDetailView.as_view(), name="cart-detail"),
    path(
        "carts/<uuid:cart_id>/items/",
        views.CartItemUpsertView.as_view(),
        name="cart-item-upsert",
    ),
    path(
        "carts/<uuid:cart_id>/items/<int:item_id>/",
        views.CartItemDeleteView.as_view(),
        name="cart-item-delete",
    ),
    path(
        "carts/<uuid:cart_id>/checkout/",
        views.CheckoutView.as_view(),
        name="cart-checkout",
    ),
    path("orders/", views.OrderListView.as_view(), name="order-list"),
    path("orders/<int:pk>/", views.OrderDetailView.as_view(), name="order-detail"),
]
