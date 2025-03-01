import os
import traceback
from datetime import datetime, timedelta, UTC

from jose import jwt, JWTError
from passlib.context import CryptContext
from schemas import DualTokenResponse, AccessTokenResponse

from exceptions import JWTException, UserNotFoundException
from models import User


# Indicating that we want to use the bcrypt hashing algorithm:
bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# A JWT needs an algorithm and secret key:
HASH_KEY = os.getenv("HASH_KEY")
HASH_ALGORITHM = os.getenv("HASH_ALGORITHM")

# The time to live for the JWT:
TOKEN_TTL = timedelta(minutes=int(os.getenv("TOKEN_TTL")))
REFRESH_TOKEN_TTL = timedelta(minutes=int(os.getenv("REFRESH_TOKEN_TTL")))


def _create_token(user_id: int, ttl: timedelta = TOKEN_TTL) -> str:
    expiry = datetime.now(UTC) + ttl
    
    # Payload is the data encoded within the token - in our case just the user ID:
    payload = {"sub": str(user_id), "exp": expiry}

    # Creating the JWT, using the secret key and algorithm to encode the payload:
    return jwt.encode(payload, HASH_KEY, HASH_ALGORITHM)


def create_tokens(user_id: int) -> DualTokenResponse:
    access_token = _create_token(user_id)
    refresh_token = _create_token(user_id, REFRESH_TOKEN_TTL)

    return DualTokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_expiry=datetime.now(UTC) + TOKEN_TTL,
        refresh_token_expiry=datetime.now(UTC) + REFRESH_TOKEN_TTL,
        token_type="bearer"
    )


def create_access_token(user_id: int) -> AccessTokenResponse:
    access_token = _create_token(user_id)

    return AccessTokenResponse(
        access_token=access_token,
        access_token_expiry=datetime.now(UTC) + TOKEN_TTL,
        token_type="bearer"
    )


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, HASH_KEY, algorithms=[HASH_ALGORITHM])
        user_id = payload.get("sub")

        if user_id is None: raise UserNotFoundException
    except JWTError: 
        traceback.print_exc()
        raise JWTException
    return payload
