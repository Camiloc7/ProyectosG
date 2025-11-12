# auth/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends, Header 

from config.settings import settings

# Usar las claves de la configuración
SECRET_KEY = settings.SECRET_KEY 
ALGORITHM = settings.ALGORITHM 

def decode_access_token(token: str):
    """
    Decodifica y valida un token JWT.
    Retorna el payload si es válido, None si hay un error.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        # Puedes loggear el error aquí si tienes un logger configurado
        # logger.error(f"Error al decodificar o validar JWT: {e}") 
        return None

# Dependencia para obtener el tenantId del token
# Usamos 'Authorization: Optional[str] = Header(None)' para obtener el encabezado
# y luego lo procesamos.
def get_current_tenant_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Dependencia de FastAPI para obtener el tenantId del token del encabezado Authorization.
    Lanza HTTPException si el token es inválido o le falta el tenantId.
    """
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionó token de autenticación en el encabezado Authorization.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extraer el token después de "Bearer "
    token_parts = authorization.split(" ")
    if len(token_parts) != 2 or token_parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de token inválido. Debe ser 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = token_parts[1]

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    tenant_id = payload.get("id_empresa")
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token de autenticación no contiene la información del inquilino (id_empresa).",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return str(tenant_id)

# Dependencia para obtener el user_id del token (opcional, si lo necesitas en rutas)
def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Dependencia de FastAPI para obtener el user_id del token del encabezado Authorization.
    Lanza HTTPException si el token es inválido o le falta el user_id.
    """
    if authorization is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se proporcionó token de autenticación en el encabezado Authorization.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_parts = authorization.split(" ")
    if len(token_parts) != 2 or token_parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de token inválido. Debe ser 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = token_parts[1]

    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autenticación inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = payload.get("sub") 
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token de autenticación no contiene el ID de usuario ('sub').",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return str(user_id)


# from datetime import datetime, timedelta
# from typing import Optional
# from jose import JWTError, jwt
# from passlib.context import CryptContext
# from fastapi import Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordBearer
# from sqlalchemy.orm import Session 

# from database.models import SessionLocal, Usuario
# from database.crud import UserCRUD
# from config.settings import settings 
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
# def verify_password(plain_password: str, hashed_password: str) -> bool:
#     return pwd_context.verify(plain_password, hashed_password)

# def get_password_hash(password: str) -> str:
#     return pwd_context.hash(password)

# def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
#     to_encode = data.copy()
#     if expires_delta:
#         expire = datetime.utcnow() + expires_delta
#     else:
#         expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
#     return encoded_jwt

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
#     credentials_exception = HTTPException(
#         status_code=status.HTTP_401_UNAUTHORIZED,
#         detail="No se pudieron validar las credenciales",
#         headers={"WWW-Authenticate": "Bearer"},
#     )
#     try:
#         payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
#         email: str = payload.get("sub")
#         if email is None:
#             raise credentials_exception
        
#         user_crud = UserCRUD(db)
#         user = user_crud.get_user_by_email(email)
#         if user is None:
#             raise credentials_exception
#         return user
#     except JWTError:
#         raise credentials_exception
#     except Exception as e:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Error interno del servidor al procesar el token: {e}"
#         )