from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class CategoriaProveedorBase(BaseModel):
    nit_proveedor: str = Field(..., min_length=9, max_length=50, description="NIT del proveedor asociado a la categoría")
    categoria: str = Field(..., min_length=1, max_length=100, description="Nombre de la categoría del proveedor (ej: 'Servicios', 'Alimentos', 'Tecnología')")
    nombre_proveedor: Optional[str] = Field(None, max_length=255, description="Nombre del proveedor (opcional, para referencia)")

class CategoriaProveedorCreate(CategoriaProveedorBase):
    pass

class CategoriaProveedorUpdate(BaseModel):
    categoria: Optional[str] = Field(None, min_length=1, max_length=100, description="Nuevo nombre de la categoría")
    nombre_proveedor: Optional[str] = Field(None, max_length=255, description="Nuevo nombre del proveedor (opcional)")

class CategoriaProveedor(CategoriaProveedorBase):
    id: int
    fecha_creacion: datetime
    ultima_actualizacion: datetime

    class Config:
        orm_mode = True 