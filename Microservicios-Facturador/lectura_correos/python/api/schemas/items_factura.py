# from pydantic import BaseModel
# from typing import Optional

# class ItemFacturaBase(BaseModel):
#     descripcion: Optional[str] = None
#     cantidad: Optional[float] = None
#     valor_unitario: Optional[float] = None
#     valor_total: Optional[float] = None

# class ItemFacturaCreate(ItemFacturaBase):
#     descripcion: str
#     cantidad: float
#     valor_unitario: float
#     valor_total: float

# class ItemFacturaUpdate(ItemFacturaBase):
#     pass

# class ItemFactura(ItemFacturaBase):
#     id: int
#     factura_id: int

#     class Config:
#         from_attributes = True 

from pydantic import BaseModel
from typing import Optional

class ItemFacturaBase(BaseModel):
    descripcion: Optional[str] = None
    cantidad: Optional[float] = None
    valor_unitario: Optional[float] = None
    valor_total: Optional[float] = None

class ItemFacturaCreate(ItemFacturaBase):
    descripcion: str
    cantidad: float
    valor_unitario: float
    valor_total: float

class ItemFacturaUpdate(ItemFacturaBase):
    pass

class ItemFactura(ItemFacturaBase):
    id: int
    factura_id: int
    tenant_id: Optional[str] = None

    class Config:
        from_attributes = True