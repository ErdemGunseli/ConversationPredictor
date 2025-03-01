from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        field = " -> ".join([
            str(elem).replace('_', ' ').capitalize() for elem in error['loc'] if elem != 'body'
        ])
        
        # Removing the first word from the message, which is the data type:
        message = " ".join(error['msg'].split()[1:])
        
        errors.append(f"{field} {message}.")
    return JSONResponse(status_code=422, content={"detail": " ".join(errors)})
