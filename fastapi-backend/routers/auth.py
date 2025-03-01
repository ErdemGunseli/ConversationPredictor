from fastapi import APIRouter, status as st, Request, Body

from rate_limiter import limiter
from dependencies import db_dependency, auth_dependency
from schemas import DualTokenResponse, AccessTokenResponse, RefreshTokenRequest
from services import auth_service as aus


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/token", response_model=DualTokenResponse, status_code=st.HTTP_200_OK)
@limiter.limit("60/hour, 100/day")
async def login_and_generate_token(db: db_dependency, auth_form: auth_dependency, request: Request):
    return aus.login_and_generate_token(db, auth_form)


@router.post("/token/refresh", response_model=AccessTokenResponse, status_code=st.HTTP_200_OK)
@limiter.limit("10/hour")
async def refresh_token(token_data: RefreshTokenRequest, request: Request):
    return aus.refresh_access_token(token_data.refresh_token)


@router.get("/oauth/google/login")
async def oauth_google_login(request: Request):
    return await aus.oauth_google_login(request)


@router.get("/oauth/google/callback", name="oauth_google_callback")
async def oauth_google_callback(db: db_dependency, request: Request):
    return await aus.oauth_google_callback(db, request)
