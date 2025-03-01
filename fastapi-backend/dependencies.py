from typing import Annotated, Optional, Generator

from fastapi import Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session

from exceptions import JWTException, UserNotFoundException, AdminStatusException, UnverifiedUserException
from database import SessionLocal
from models import User
from security import decode_token


# Using a generator as context manager to manage the DB session:
def get_db() -> Generator[Session, None, None]:

    # Creating a new session to connect to the DB, using the session factory:
    db = SessionLocal()
    try:
        # Providing a DB session to the caller:
        yield db
    
    except Exception:
        # Rolling back any changes if an error occurs:
        db.rollback()
        raise
    
    finally:
        # This code only runs after the function calling get_db completes, 
        # allowing the connection to be closed when no longer needed (and not too soon):
        db.close()


# Dependency injection - if an object of type db_dependency (which is of type Session) is not provided, 
# FastAPI will automatically call get_db to obtain a DB session.
db_dependency = Annotated[Session, Depends(get_db)]

# For the authentication dependency, the OAuth2PasswordRequestForm class must be instantiated:
auth_dependency = Annotated[OAuth2PasswordRequestForm, Depends(OAuth2PasswordRequestForm)]

# Instantiating OAuth2PasswordBearer with the token-generating endpoint URL as a kwarg:
token_dependency = Annotated[str, Depends(OAuth2PasswordBearer(tokenUrl="auth/token"))]


def get_user(db: db_dependency, user_id: int, require_verification: bool = True) -> User:
    user = db.query(User).filter_by(id=user_id).first()

    if user is None: raise UserNotFoundException
    if require_verification and not user.is_verified: raise UnverifiedUserException
    return user


def get_current_user(db: db_dependency, token: token_dependency, require_verification: bool = True) -> User:
    # Attempting to decode the token using the secret key and algorithm:
    # (If successful, this will return a dictionary that contains the user data):
    payload = decode_token(token)

    # Extracting the user ID from the payload dictionary:
    # The subject of a JWT needs to be a string, so converting back to integer:
    user_id: Optional[int] = payload.get("sub")

    if user_id is None: raise JWTException
    return get_user(db, int(user_id), require_verification)


def get_current_verified_user(db: db_dependency, token: token_dependency) -> User:
    return get_current_user(db, token, require_verification=True)


def get_current_unverified_user(db: db_dependency, token: token_dependency) -> User:
    return get_current_user(db, token, require_verification=False)


user_dependency = Annotated[User, Depends(get_current_verified_user)]
unverified_user_dependency = Annotated[User, Depends(get_current_unverified_user)]


def verify_admin_status(user: user_dependency) -> None:
    if not user.is_admin:
        raise AdminStatusException


def get_current_admin(db: db_dependency, token: token_dependency) -> User:
    # Need to use await, since it is an async function:
    user = get_current_verified_user(db, token)
    verify_admin_status(user)
    return user


admin_dependency = Annotated[User, Depends(get_current_admin)]
