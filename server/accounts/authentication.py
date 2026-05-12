from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    def get_header(self, request):
        cookie = request.COOKIES.get("access_token")
        if cookie:
            return f"Bearer {cookie}".encode()
        return super().get_header(request)
