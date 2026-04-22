from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from app.utils.authutils import decode_access_token
from app.rolechecker import check_permission

PUBLIC_PREFIXES = [
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/refresh",
    "/api/v1/auth/logout",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/favicon.ico",
    "/robots.txt",
]

def is_public(path: str) ->  bool:
    return any(path.startswith(prefix) for prefix in PUBLIC_PREFIXES)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path   = request.url.path
        method = request.method

        # 1. Skip OPTIONS requests
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # 2. Skip public routes
        if is_public(path):
            return await call_next(request)

        # 3. Check header exists
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(status_code=401, content={"detail": "Missing token"})

        # 4. Validate header format
        parts = auth_header.split(" ")
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return JSONResponse(status_code=401, content={"detail": "Invalid authorization header"})

        # 5. Decode token
        try:
            payload = decode_access_token(parts[1])
        except Exception:
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

        # 6. Extract claims
        user_id = payload.get("sub")
        role    = payload.get("role", "user")
        token_version = payload.get("token_version")

        if not user_id:
            return JSONResponse(status_code=401, content={"detail": "Invalid token payload"})

        # 7. RBAC check
        if not check_permission(role, path, method, user_id):
            return JSONResponse(status_code=403, content={"detail": "Forbidden"})

        # 8. Attach to request state for use in routes
        request.state.user = {"user_id": user_id, "role": role, "token_version": token_version}

        return await call_next(request)