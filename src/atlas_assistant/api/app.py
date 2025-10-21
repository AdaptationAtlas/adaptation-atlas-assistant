from typing import Annotated

import jwt
from fastapi import Depends, FastAPI, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pwdlib import PasswordHash
from pydantic import BaseModel
from starlette import status

from ..settings import get_settings

settings = get_settings()
algorithm = "HS256"
password_hash = PasswordHash.recommended()

app = FastAPI()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

users = {
    "dev": "$argon2id$v=19$m=65536,t=3,p=4$EuwRCc+93QWvcdQdgi8u7A$3b/SR/8kFOubZPzcPwRgJNxK6tcFQsR8ZmqQtRIXTaU",
}


class Token(BaseModel):
    access_token: str
    token_type: str


class User(BaseModel):
    username: str

    def create_access_token(self) -> str:
        return jwt.encode(
            {"sub": self.username},
            settings.jwt_key.get_secret_value(),
            algorithm=algorithm,
        )


def authenticate_user(username: str, password: str) -> User | None:
    hashed_password = users.get(username)
    if hashed_password and password_hash.verify(password, hashed_password):
        return User(username=username)
    else:
        return None


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    payload = jwt.decode(
        token, settings.jwt_key.get_secret_value(), algorithms=[algorithm]
    )
    username: str | None = payload.get("sub")
    if username in users:
        return User(username=username)
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


@app.get("/me")
async def me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@app.post("/token")
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    user = authenticate_user(form_data.username, form_data.password)
    if user:
        return Token(access_token=user.create_access_token(), token_type="bearer")
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
