# from pydantic import BaseModel, EmailStr
# from typing import Optional

# class UserCreate(BaseModel):
#     correo: EmailStr
#     contrasena: str
#     email_account_password: Optional[str] = None 

# class UserUpdate(BaseModel):
#     correo: Optional[EmailStr] = None
#     contrasena: Optional[str] = None
#     is_active: Optional[bool] = None
#     email_account_password: Optional[str] = None

# class UserBase(BaseModel):
#     correo: EmailStr
#     is_active: bool = True 

# class User(UserBase):
#     id: int

#     class Config:
#         orm_mode = True

# class Token(BaseModel):
#     access_token: str
#     token_type: str = "bearer"

# class TokenData(BaseModel):
#     email: Optional[str] = None


# api/schemas/users.py
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    correo: EmailStr
    # Simplificado: 'password' será la única contraseña de 16 caracteres del frontend
    # y será usada para encriptar email_account_password_encrypted en el backend
    password: str 

class UserUpdate(BaseModel):
    correo: Optional[EmailStr] = None
    # 'password' para actualizar la contraseña de 16 caracteres (que se encriptará)
    password: Optional[str] = None 
    is_active: Optional[bool] = None

class UserBase(BaseModel):
    correo: EmailStr
    is_active: bool = True 
    # Añadir tenant_id para las respuestas de la API
    tenant_id: Optional[str] = None # <-- Asegurarse de que tenant_id esté aquí para las respuestas

class User(UserBase):
    id: int

    class Config:
        from_attributes = True # <-- En Pydantic v2, orm_mode fue renombrado a from_attributes

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None