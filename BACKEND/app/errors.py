from fastapi import HTTPException,status

def user_already_exists():
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Provided email already exists")

def invalid_credentials(cred_name:str,reason:str):
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid {cred_name} : {reason}")

def credentials_exception(cred_name:str,reason:str):
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=f"Could not validate {cred_name} : {reason}",
        headers={"WWW-Authenticate": "Bearer"},
    )