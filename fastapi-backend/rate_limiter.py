from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request
from jose import JWTError
from exceptions import JWTException

from security import decode_token


def extract_user_id_from_auth_header(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
            return user_id
        except (JWTError, JWTException):
            return None
    return None


def user_or_ip_key_func(request: Request) -> str:
    user_id = extract_user_id_from_auth_header(request)
    
    if user_id: 
        return f"user-{user_id}"
    return get_remote_address(request)


limiter = Limiter(key_func=user_or_ip_key_func, default_limits=["100/second"])
