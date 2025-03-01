import os

from fastapi import HTTPException, Request, status as st
from authlib.integrations.starlette_client import OAuth, OAuthError

from exceptions import InvalidCredentialsException
import services.user_service as us
from dependencies import db_dependency, auth_dependency
from models import User
from security import bcrypt_context, create_tokens, decode_token, create_access_token
from schemas import DualTokenResponse, AccessTokenResponse

oauth = OAuth()

oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    access_token_url="https://oauth2.googleapis.com/token",
    access_token_params=None,
    authorize_url="https://accounts.google.com/o/oauth2/auth",
    authorize_params=None,
    api_base_url="https://www.googleapis.com/oauth2/v1/",
    client_kwargs={"scope": "openid email profile"}
)


def authenticate_user(db: db_dependency, email: str, password: str) -> User:
    user = us.get_user_by_email(db, email, exclude_oauth=True)
    if not bcrypt_context.verify(password, user.password): raise InvalidCredentialsException
    return user


def login_and_generate_token(db: db_dependency, auth_form: auth_dependency) -> DualTokenResponse:
    # auth_form is of type OAuth2PasswordRequestForm, so it has attributes username and password.
    # In this case, username represents the user's email:
    user = authenticate_user(db, auth_form.username, auth_form.password)
    return create_tokens(user.id)


def refresh_access_token(refresh_token: str) -> AccessTokenResponse:
    user_id = int(decode_token(refresh_token).get("sub"))
    return create_access_token(user_id)


async def oauth_google_login(request: Request):
    redirect_uri = request.url_for("oauth_google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)


async def oauth_google_callback(db: db_dependency, request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)

    except OAuthError as e:
        raise HTTPException(
            status_code=st.HTTP_400_BAD_REQUEST,
            detail=f"OAuth error: {str(e)}"
        )

    # Retrieving the user info from Google:
    user_info = await oauth.google.parse_id_token(request, token)
    if not user_info:
        raise HTTPException(
            status_code=st.HTTP_400_BAD_REQUEST,
            detail="Failed to retrieve user information from Google."
        )
    email = user_info.get("email")
    if not email:
        raise HTTPException(
            status_code=st.HTTP_400_BAD_REQUEST,
            detail="Email not available from Google."
        )

    # Looking up the user in the database (using a case-insensitive lookup):
    user = db.query(User).filter_by(email=email.lower()).first()
    if not user:
        # If the user does not exist, create a new user record.
        # Note: For OAuth users, the password field can be left empty or filled with a dummy value.
        user = User(
            name=user_info.get("name", "Google User"),
            email=email.lower(),
            is_verified=True,
            oauth_provider="google"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Generating tokens:
    return create_tokens(user.id)
