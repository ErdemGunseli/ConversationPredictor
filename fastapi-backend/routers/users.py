from fastapi import APIRouter, status as st, BackgroundTasks
from starlette.requests import Request

from rate_limiter import limiter
from schemas import UserRequest, UserResponse, UserVerificationRequest, UpdateUserRequest, ResetPasswordRequest
from dependencies import db_dependency, user_dependency, unverified_user_dependency
import services.user_service as us


router = APIRouter(prefix="/user", tags=["User"])


@router.post("/", response_model=UserResponse, status_code=st.HTTP_201_CREATED)
@limiter.limit("10/minute, 100/day")
async def create_user(db: db_dependency, user_data: UserRequest, background_tasks: BackgroundTasks, request: Request):
    return us.create_user(db, user_data, background_tasks)


@router.post("/request-verification", status_code=st.HTTP_202_ACCEPTED)
@limiter.limit("5/minute")
async def request_user_verification(db: db_dependency, user: unverified_user_dependency, background_tasks: BackgroundTasks, request: Request):
    us.request_user_verification(db, user, background_tasks)


@router.post("/verify", response_model=UserResponse, status_code=st.HTTP_200_OK)
@limiter.limit("5/minute")
async def verify_user(db: db_dependency, user: unverified_user_dependency, verification_request: UserVerificationRequest, request: Request):
    return us.verify_user(db, user, verification_request.code)


@router.get("/", response_model=UserResponse, status_code=st.HTTP_200_OK)
async def read_current_user(user: user_dependency, request: Request):
    return user


@router.patch("/", response_model=UserResponse, status_code=st.HTTP_200_OK)
def update_user(db: db_dependency, user: user_dependency, user_data: UpdateUserRequest, request: Request):
    return us.update_user(db, user, user_data.name)


@router.delete("/", status_code=st.HTTP_204_NO_CONTENT)
async def delete_user(db: db_dependency, user: user_dependency, request: Request):
    us.delete_user(db, user)


@router.post("/request-password-reset", status_code=st.HTTP_202_ACCEPTED)
@limiter.limit("5/minute")
async def request_password_reset(db: db_dependency, user: user_dependency, background_tasks: BackgroundTasks, request: Request):
    us.request_password_reset(db, user, background_tasks)


@router.post("/reset-password", response_model=UserResponse, status_code=st.HTTP_200_OK)
@limiter.limit("5/minute")
async def reset_password(db: db_dependency, user: user_dependency, password_data: ResetPasswordRequest, request: Request):
    return us.reset_password(db, user, password_data.code, password_data.new_password)


