# from pydantic import BaseModel, Field
# from typing import Optional, List, Dict, Any
# from datetime import date, datetime

# class ItemFacturaBase(BaseModel):
#     descripcion: str
#     cantidad: float
#     valor_unitario: float
#     valor_total: float

# class ItemFacturaCreate(ItemFacturaBase):
#     pass

# class ItemFactura(ItemFacturaBase):
#     id: int
#     factura_id: int 

#     class Config:
#         orm_mode = True

# class InvoiceBase(BaseModel):
#     cufe: Optional[str] = None
#     numero_factura: str
#     fecha_emision: date
#     hora_emision: Optional[str] = None  
#     monto_subtotal: Optional[float] = None 
#     monto_impuesto: Optional[float] = None
#     monto_total: Optional[float] = None
#     moneda: Optional[str] = "COP" 
#     nombre_proveedor: Optional[str] = None
#     nit_proveedor: Optional[str] = None
#     email_proveedor: Optional[str] = None  
#     nombre_cliente: Optional[str] = None 
#     nit_cliente: Optional[str] = None 
#     fecha_vencimiento: Optional[date] = None
#     metodo_pago: Optional[str] = None
#     asunto_correo: Optional[str] = None
#     remitente_correo: Optional[str] = None  
#     correo_cliente_asociado: Optional[str] = None 
#     revisada_manualmente: bool = False
#     ruta_archivo_original: Optional[str] = None
#     procesado_en: Optional[datetime] = None

# class InvoiceCreate(InvoiceBase):
#     items: List[ItemFacturaCreate] = []

# class InvoiceUpdate(BaseModel):
#     cufe: Optional[str] = None
#     numero_factura: Optional[str] = None
#     fecha_emision: Optional[date] = None
#     hora_emision: Optional[str] = None  
#     monto_subtotal: Optional[float] = None
#     monto_impuesto: Optional[float] = None
#     monto_total: Optional[float] = None
#     moneda: Optional[str] = None
#     nombre_proveedor: Optional[str] = None
#     nit_proveedor: Optional[str] = None
#     email_proveedor: Optional[str] = None 
#     nombre_cliente: Optional[str] = None
#     nit_cliente: Optional[str] = None
#     fecha_vencimiento: Optional[date] = None
#     metodo_pago: Optional[str] = None
#     asunto_correo: Optional[str] = None
#     remitente_correo: Optional[str] = None  
#     correo_cliente_asociado: Optional[str] = None 
#     revisada_manualmente: Optional[bool] = None
#     items: Optional[List[ItemFacturaCreate]] = None 

# class Invoice(InvoiceBase):
#     id: int
#     categoria_proveedor_id: Optional[int] = None 
#     usuario_id: Optional[int] = None 
#     items: List[ItemFactura] = []

#     class Config:
#         orm_mode = True 

# class CampoCorregidoSchema(BaseModel):
#     id: int
#     factura_id: int
#     campo_modificado: str
#     valor_anterior: Optional[str]
#     valor_nuevo: Optional[str]
#     fecha_correccion: datetime
#     usuario_corrector_id: Optional[int]

#     class Config:
#         orm_mode = True

# class AuditLogSchema(BaseModel):
#     id: int
#     event_type: str
#     object_type: str
#     object_id: int
#     changes: Dict[str, Any]
#     timestamp: datetime
#     performed_by_user_id: Optional[int]

#     class Config:
#         orm_mode = True


from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import date, datetime

class ItemFacturaBase(BaseModel):
    descripcion: str
    cantidad: float
    valor_unitario: float
    valor_total: float

class ItemFacturaCreate(ItemFacturaBase):
    pass

class ItemFactura(ItemFacturaBase):
    id: int
    factura_id: int 
    tenant_id: Optional[str] = None 

    class Config:
        from_attributes = True 

class InvoiceBase(BaseModel):
    cufe: Optional[str] = None
    numero_factura: str
    fecha_emision: date
    hora_emision: Optional[str] = None  
    monto_subtotal: Optional[float] = None 
    monto_impuesto: Optional[float] = None
    monto_total: Optional[float] = None
    moneda: Optional[str] = "COP" 
    nombre_proveedor: Optional[str] = None
    nit_proveedor: Optional[str] = None
    email_proveedor: Optional[str] = None  
    nombre_cliente: Optional[str] = None 
    nit_cliente: Optional[str] = None 
    fecha_vencimiento: Optional[date] = None
    metodo_pago: Optional[str] = None
    asunto_correo: Optional[str] = None
    remitente_correo: Optional[str] = None  
    correo_cliente_asociado: Optional[str] = None 
    revisada_manualmente: bool = False
    ruta_archivo_original: Optional[str] = None
    procesado_en: Optional[datetime] = None
    tenant_id: Optional[str] = None 

class InvoiceCreate(InvoiceBase):
    items: List[ItemFacturaCreate] = []

class InvoiceUpdate(BaseModel):
    cufe: Optional[str] = None
    numero_factura: Optional[str] = None
    fecha_emision: Optional[date] = None
    hora_emision: Optional[str] = None  
    monto_subtotal: Optional[float] = None
    monto_impuesto: Optional[float] = None
    monto_total: Optional[float] = None
    moneda: Optional[str] = None
    nombre_proveedor: Optional[str] = None
    nit_proveedor: Optional[str] = None
    email_proveedor: Optional[str] = None 
    nombre_cliente: Optional[str] = None
    nit_cliente: Optional[str] = None
    fecha_vencimiento: Optional[date] = None
    metodo_pago: Optional[str] = None
    asunto_correo: Optional[str] = None
    remitente_correo: Optional[str] = None  
    correo_cliente_asociado: Optional[str] = None 
    revisada_manualmente: Optional[bool] = None
    items: Optional[List[ItemFacturaCreate]] = None 
    tenant_id: Optional[str] = None

class Invoice(InvoiceBase):
    id: int
    categoria_proveedor_id: Optional[int] = None 
    usuario_id: Optional[int] = None 
    items: List[ItemFactura] = []

    class Config:
        from_attributes = True 

class CampoCorregidoSchema(BaseModel):
    id: int
    factura_id: int
    campo_modificado: str
    valor_anterior: Optional[str]
    valor_nuevo: Optional[str]
    fecha_correccion: datetime
    usuario_corrector_id: Optional[int]

    class Config:
        from_attributes = True 

class AuditLogSchema(BaseModel):
    id: int
    event_type: str
    object_type: str
    object_id: int
    changes: Dict[str, Any]
    timestamp: datetime
    performed_by_user_id: Optional[int]

    class Config:
        from_attributes = True 