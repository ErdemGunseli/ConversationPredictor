from fastapi import HTTPException, status as st


class UserNotFoundException(HTTPException):
    def __init__(self, detail="Please log in with a valid account."):
        super().__init__(status_code=st.HTTP_404_NOT_FOUND, detail=detail)


class InvalidCredentialsException(HTTPException):
    def __init__(self, detail="Please check the email and password."):
        super().__init__(status_code=st.HTTP_401_UNAUTHORIZED, detail=detail)


class UserExistsException(HTTPException):
    def __init__(self, detail="A user with this email already exists. Please log in instead."):
        super().__init__(status_code=st.HTTP_409_CONFLICT, detail=detail)


class AdminStatusException(HTTPException):
    def __init__(self, detail="You are not authorized to access this resource."):
        super().__init__(status_code=st.HTTP_403_FORBIDDEN, detail=detail)


class UnverifiedUserException(HTTPException):
    def __init__(self, detail="Please verify your account to continue."):
        super().__init__(status_code=st.HTTP_403_FORBIDDEN, detail=detail)


class OAuthProviderException(HTTPException):
    def __init__(self, provider: str, detail=None):
        if detail is None:
            detail = f"Please use your {provider.title()} account to log in."
        super().__init__(status_code=st.HTTP_403_FORBIDDEN, detail=detail)


class InvalidCodeException(HTTPException):
    def __init__(self, detail="The verification code is invalid or expired."):
        super().__init__(status_code=st.HTTP_400_BAD_REQUEST, detail=detail)


class JWTException(HTTPException):
    def __init__(self, detail="Your authentication has expired. Please log in again."):
        super().__init__(status_code=st.HTTP_401_UNAUTHORIZED, detail=detail)


class UnprocessableMessageException(HTTPException):
    def __init__(self, detail="Please ensure your message is in a valid format."):
        super().__init__(status_code=st.HTTP_400_BAD_REQUEST, detail=detail)

class APIRequestException(HTTPException):
    def __init__(self, detail="Something went wrong while processing your request. Please try again later."):
        super().__init__(status_code=st.HTTP_400_BAD_REQUEST, detail=detail)


class ConversationNotFoundException(HTTPException):
    def __init__(self, detail="The specified conversation was not found."):
        super().__init__(status_code=st.HTTP_404_NOT_FOUND, detail=detail)


class ConversationUpdateException(HTTPException):
    def __init__(self, detail="Failed to update the conversation."):
        super().__init__(status_code=st.HTTP_400_BAD_REQUEST, detail=detail)
