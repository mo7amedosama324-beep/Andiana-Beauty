from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .serializers import AdminUserSerializer, RegisterSerializer, UserSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


def _jwt_auth_cookie_kwargs():
    return {
        "httponly": True,
        "secure": getattr(settings, "JWT_AUTH_COOKIE_SECURE", False),
        "samesite": getattr(settings, "JWT_AUTH_COOKIE_SAMESITE", "Lax"),
        "path": "/",
    }


def _jwt_cookie_delete_kwargs():
    return {
        "path": "/",
        "samesite": getattr(settings, "JWT_AUTH_COOKIE_SAMESITE", "Lax"),
        "secure": getattr(settings, "JWT_AUTH_COOKIE_SECURE", False),
    }


class CookieTokenObtainPairView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code != status.HTTP_200_OK:
            return response

        access = response.data.get("access")
        refresh = response.data.get("refresh")
        ck = _jwt_auth_cookie_kwargs()
        response.set_cookie("access_token", access, **ck)
        response.set_cookie("refresh_token", refresh, **ck)
        return response


class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get("refresh_token")
        if refresh:
            data = request.data.copy()
            data["refresh"] = refresh
            request._full_data = data
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            access = response.data.get("access")
            if access:
                response.set_cookie("access_token", access, **_jwt_auth_cookie_kwargs())
        return response


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get("refresh_token")
        if refresh:
            try:
                token = RefreshToken(refresh)
                token.blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        dk = _jwt_cookie_delete_kwargs()
        response.delete_cookie("access_token", path=dk["path"], samesite=dk["samesite"], secure=dk["secure"])
        response.delete_cookie("refresh_token", path=dk["path"], samesite=dk["samesite"], secure=dk["secure"])
        return response


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all().order_by("username")


class AdminUserUpdateView(generics.UpdateAPIView):
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all()
    http_method_names = ["patch"]
