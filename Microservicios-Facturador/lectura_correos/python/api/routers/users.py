# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from typing import List, Optional
# from database.models import SessionLocal, Usuario 
# from database.crud import UserCRUD
# from auth.security import get_password_hash 
# from api.schemas.users import UserCreate, User, UserUpdate 
# from config.settings import settings 
# router = APIRouter()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# @router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
# async def create_user(user: UserCreate, db: Session = Depends(get_db)):
#     user_crud = UserCRUD(db)
#     db_user = user_crud.get_user_by_email(user.correo)
#     if db_user:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="El correo ya está registrado"
#         )
#     hashed_password_api = get_password_hash(user.contrasena)
#     encrypted_email_password = None
#     if user.email_account_password:
#         try:
#             encrypted_email_password_bytes = settings.CIPHER_SUITE.encrypt(user.email_account_password.encode())
#             encrypted_email_password = encrypted_email_password_bytes.decode()
#         except Exception as e:
#             raise HTTPException(
#                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                 detail=f"Error al encriptar la contraseña de la cuenta de correo: {e}"
#             )
#     created_user = user_crud.create_user(
#         email=user.correo,
#         password=hashed_password_api, 
#         email_account_password_encrypted=encrypted_email_password 
#     )
#     return created_user

# @router.get("/{user_id}", response_model=User)
# async def get_user(user_id: int, db: Session = Depends(get_db)):
#     user_crud = UserCRUD(db)
#     user = user_crud.get_user_by_id(user_id)
#     if not user:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
#     return user

# @router.get("/", response_model=List[User])
# async def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
#     user_crud = UserCRUD(db)
#     users = user_crud.get_users(skip=skip, limit=limit)
#     return users

# @router.put("/{user_id}", response_model=User)
# async def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
#     user_crud = UserCRUD(db)
#     update_data = user_update.dict(exclude_unset=True)
#     if "contrasena" in update_data and update_data["contrasena"] is not None:
#         update_data["contrasena"] = get_password_hash(update_data["contrasena"]) 
#     if "email_account_password" in update_data and update_data["email_account_password"] is not None:
#         try:
#             encrypted_email_password_bytes = settings.CIPHER_SUITE.encrypt(update_data["email_account_password"].encode())
#             update_data["email_account_password_encrypted"] = encrypted_email_password_bytes.decode()
#             del update_data["email_account_password"] 
#         except Exception as e:
#             raise HTTPException(
#                 status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#                 detail=f"Error al encriptar la nueva contraseña de la cuenta de correo: {e}"
#             )

#     updated_user = user_crud.update_user(user_id, **update_data)
#     if not updated_user:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
#     return updated_user

# @router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_user(user_id: int, db: Session = Depends(get_db)):
#     user_crud = UserCRUD(db)
#     success = user_crud.delete_user(user_id)
#     if not success:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
#     return






from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database.models import SessionLocal, Usuario 
from database.crud import UserCRUD
# Importar la dependencia para obtener el tenant_id y la configuración de encriptación
from auth.security import get_current_tenant_id, get_current_user_id 
from config.settings import settings # Para CIPHER_SUITE
from api.schemas.users import UserCreate, User, UserUpdate 

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Proteger todas las rutas de este router con get_current_tenant_id
# Esto significa que cualquier solicitud a /users/* requerirá un JWT válido
# que contenga un 'id_empresa' (tenant_id)
@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate, 
    db: Session = Depends(get_db),
    # Obtener el tenant_id del usuario que está creando este nuevo usuario
    tenant_id_from_token: str = Depends(get_current_tenant_id) 
):
    user_crud = UserCRUD(db)
    
    # Verificar si el correo ya está registrado para este inquilino
    db_user = user_crud.get_user_by_email(user_data.correo)
    if db_user and db_user.tenant_id == tenant_id_from_token: # Filtrar por tenant_id
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya está registrado para este inquilino."
        )
    
    # La contraseña de 16 caracteres se encripta
    encrypted_email_password = None
    if user_data.password:
        try:
            encrypted_email_password_bytes = settings.CIPHER_SUITE.encrypt(user_data.password.encode())
            encrypted_email_password = encrypted_email_password_bytes.decode()
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al encriptar la contraseña de la cuenta de correo: {e}"
            )
    
    # Crear el usuario asignándole el tenant_id del token
    created_user = user_crud.create_user(
        email=user_data.correo,
        email_account_password_encrypted=encrypted_email_password,
        tenant_id=tenant_id_from_token # <-- Asignar el tenant_id
    )
    
    if not created_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el usuario."
        )
    return created_user

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: int, 
    db: Session = Depends(get_db),
    tenant_id_from_token: str = Depends(get_current_tenant_id) # Proteger y filtrar por tenant_id
):
    user_crud = UserCRUD(db)
    # Filtrar por user_id Y tenant_id
    user = user_crud.db.query(Usuario).filter(
        Usuario.id == user_id, 
        Usuario.tenant_id == tenant_id_from_token
    ).first()
    
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado o no pertenece a su inquilino.")
    return user

@router.get("/", response_model=List[User])
async def get_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    tenant_id_from_token: str = Depends(get_current_tenant_id) # Proteger y filtrar por tenant_id
):
    user_crud = UserCRUD(db)
    # Obtener usuarios filtrados por tenant_id
    users = user_crud.get_users(skip=skip, limit=limit, tenant_id=tenant_id_from_token)
    return users

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: int, 
    user_update: UserUpdate, 
    db: Session = Depends(get_db),
    tenant_id_from_token: str = Depends(get_current_tenant_id) # Proteger y filtrar por tenant_id
):
    user_crud = UserCRUD(db)
    update_data = user_update.dict(exclude_unset=True)
    
    encrypted_email_password = None
    if "password" in update_data and update_data["password"] is not None:
        try:
            encrypted_email_password_bytes = settings.CIPHER_SUITE.encrypt(update_data["password"].encode())
            encrypted_email_password = encrypted_email_password_bytes.decode()
            del update_data["password"] # Eliminar el campo original para no pasarlo directamente
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al encriptar la nueva contraseña de la cuenta de correo: {e}"
            )

    # Actualizar usuario filtrando por user_id Y tenant_id
    updated_user = user_crud.update_user(
        user_id=user_id, 
        tenant_id=tenant_id_from_token, # <-- Pasar el tenant_id
        email_account_password_encrypted=encrypted_email_password,
        **update_data
    )
    
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado o no pertenece a su inquilino.")
    return updated_user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    tenant_id_from_token: str = Depends(get_current_tenant_id) # Proteger y filtrar por tenant_id
):
    user_crud = UserCRUD(db)
    # Eliminar usuario filtrando por user_id Y tenant_id
    success = user_crud.delete_user(user_id=user_id, tenant_id=tenant_id_from_token) # <-- Pasar el tenant_id
    
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado o no pertenece a su inquilino.")
    return