import os
import secrets
from datetime import datetime, timedelta, UTC

from sqlalchemy.exc import IntegrityError
from fastapi import BackgroundTasks

from exceptions import UserExistsException, UserNotFoundException, InvalidCodeException, OAuthProviderException
from dependencies import db_dependency, user_dependency
from schemas import UserRequest
from enums import CodeType
from .email_service import send_email
from models import User
from security import bcrypt_context

VERIFICATION_CODE_TTL = int(os.getenv("VERIFICATION_CODE_TTL"))
RESET_PASSWORD_CODE_TTL = int(os.getenv("RESET_PASSWORD_CODE_TTL"))


def create_user(db: db_dependency, user_data: UserRequest, background_tasks: BackgroundTasks) -> User:
    new_user = User(
        name=user_data.name.title(),
        email=user_data.email.lower(),
        password=bcrypt_context.hash(user_data.password)
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user) 
        
        # Automatically sending verification code:
        generate_code(db, new_user, CodeType.VERIFICATION, email=True, background_tasks=background_tasks)

        return new_user
    
    except IntegrityError:
        db.rollback()
        raise UserExistsException


def get_user_by_email(db: db_dependency, email: str, exclude_oauth: bool = False) -> User:
    user = db.query(User).filter_by(email=email.lower()).first()
    if user is None: raise UserNotFoundException
    if exclude_oauth and user.oauth_provider: raise OAuthProviderException
    return user


def _generate_code(length: int = 6) -> str:
    return str(secrets.randbelow(10**length)).zfill(length)


def generate_code(
    db: db_dependency,
    user: user_dependency,
    type: CodeType,
    email: bool = True,
    background_tasks: BackgroundTasks = None
) -> str:
    
    now_utc = datetime.now(UTC)
    plaintext_code = _generate_code()
    hashed_code = bcrypt_context.hash(plaintext_code)

    if type == CodeType.VERIFICATION:
        user.verification_code = hashed_code
        user.verification_code_expires = now_utc + timedelta(minutes=VERIFICATION_CODE_TTL)

    elif type == CodeType.RESET_PASSWORD:
        user.reset_password_code = hashed_code
        user.reset_password_code_expires = now_utc + timedelta(minutes=RESET_PASSWORD_CODE_TTL)

    db.commit()
    db.refresh(user)
    
    if email:
        subject = "Verification Code" if type == CodeType.VERIFICATION else "Reset Password Code"
        body = f"Your {type.name.lower()} code is {plaintext_code}"
        if background_tasks:
            background_tasks.add_task(send_email, user.email, subject, body)

    print(f"\033[1;34mCode (plaintext): {plaintext_code}\033[0m")

    return plaintext_code


def verify_code(user: user_dependency, code: str, type: CodeType) -> None:
    if type == CodeType.VERIFICATION:
        correct_hash = user.verification_code
        expires = user.verification_code_expires
    else:
        correct_hash = user.reset_password_code
        expires = user.reset_password_code_expires

    expired = expires and expires < datetime.now(UTC)
    # Ensuring the code is correct and not expired:
    if expired or (not bcrypt_context.verify(code, correct_hash)):
        raise InvalidCodeException

    # If we get here, the code matches and is not expired, so clearing the fields to prevent reuse:
    if type == CodeType.VERIFICATION:
        user.is_verified = True
        user.verification_code = None
        user.verification_code_expires = None

    elif type == CodeType.RESET_PASSWORD:
        user.reset_password_code = None
        user.reset_password_code_expires = None


def request_user_verification(db: db_dependency, user: user_dependency, background_tasks: BackgroundTasks) -> None:
    generate_code(db, user, CodeType.VERIFICATION, email=True, background_tasks=background_tasks)


def verify_user(db: db_dependency, user: user_dependency, code: str) -> User:
    verify_code(user, code, CodeType.VERIFICATION)
    db.commit()
    db.refresh(user)
    return user


def request_password_reset(db: db_dependency, user: user_dependency, background_tasks: BackgroundTasks) -> None:
    generate_code(db, user, CodeType.RESET_PASSWORD, email=True, background_tasks=background_tasks)
    

def reset_password(db: db_dependency, user: user_dependency, code: str, new_password: str) -> User:
    verify_code(user, code, CodeType.RESET_PASSWORD)

    # Setting new password:
    user.password = bcrypt_context.hash(new_password)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: db_dependency, user: user_dependency, name: str) -> User:
    user.name = name.title()
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: db_dependency, user: user_dependency) -> None:
    db.delete(user)
    db.commit()
