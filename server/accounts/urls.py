from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    LogoutView,
    ProfileView,
    RegisterView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/token/cookie/", CookieTokenObtainPairView.as_view(), name="token_cookie"),
    path(
        "auth/token/cookie/refresh/",
        CookieTokenRefreshView.as_view(),
        name="token_cookie_refresh",
    ),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/me/", ProfileView.as_view(), name="profile"),
]
