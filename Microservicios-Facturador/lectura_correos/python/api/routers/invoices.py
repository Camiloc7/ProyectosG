from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from database.models import SessionLocal, Factura, ItemFactura
from database.crud import InvoiceCRUD 
from api.schemas.invoices import Invoice, InvoiceCreate, InvoiceUpdate, ItemFacturaCreate 
from auth.security import get_current_tenant_id # <-- Importar para obtener tenant_id

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[Invoice], summary="Obtener lista de facturas con filtros y paginación")
async def get_invoices(
    # tenant_id debe ser el primer argumento no predeterminado
    tenant_id: str = Depends(get_current_tenant_id), # <-- Proteger y filtrar por tenant_id
    skip: int = Query(0, ge=0, description="Número de registros a saltar para paginación"),
    limit: int = Query(100, ge=1, le=500, description="Número máximo de registros a devolver"),
    numero_factura: Optional[str] = Query(None, description="Filtrar por número de factura (búsqueda parcial)"),
    nit_proveedor: Optional[str] = Query(None, description="Filtrar por NIT del proveedor"),
    nombre_proveedor: Optional[str] = Query(None, description="Filtrar por nombre del proveedor (búsqueda parcial)"),
    fecha_desde: Optional[date] = Query(None, description="Filtrar facturas con fecha de emisión igual o posterior a esta (YYYY-MM-DD)"),
    fecha_hasta: Optional[date] = Query(None, description="Filtrar facturas con fecha de emisión igual o anterior a esta (YYYY-MM-DD)"),
    monto_total_min: Optional[float] = Query(None, ge=0, description="Filtrar facturas con monto total igual o superior a este"),
    monto_total_max: Optional[float] = Query(None, ge=0, description="Filtrar facturas con monto total igual o inferior a este"),
    tipo_documento_dian: Optional[str] = Query(None, description="Filtrar por categoría de proveedor"),
    revisada_manualmente: Optional[bool] = Query(None, description="Filtrar por estado de revisión manual (True/False)"),
    usuario_id: Optional[int] = Query(None, ge=1, description="Filtrar por ID de usuario asociado"),
    db: Session = Depends(get_db)
):
    invoice_crud = InvoiceCRUD(db)
    invoices = invoice_crud.get_invoices(
        tenant_id=tenant_id, # <-- Pasar tenant_id
        skip=skip,
        limit=limit,
        numero_factura=numero_factura,
        nit_proveedor=nit_proveedor,
        nombre_proveedor=nombre_proveedor,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        monto_total_min=monto_total_min,
        monto_total_max=monto_total_max,
        tipo_documento_dian=tipo_documento_dian,
        revisada_manualmente=revisada_manualmente,
        usuario_id=usuario_id
    )
    return invoices

@router.get("/{invoice_id}", response_model=Invoice, summary="Obtener detalles de una factura por ID")
async def get_invoice_details(
    invoice_id: int, 
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id) # <-- Proteger y filtrar por tenant_id
):
    invoice_crud = InvoiceCRUD(db)
    invoice = invoice_crud.get_invoice(invoice_id, tenant_id) # <-- Pasar tenant_id
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada o no pertenece a su inquilino.")
    return invoice

@router.post("/", response_model=Invoice, status_code=status.HTTP_201_CREATED, summary="Crear una nueva factura manualmente")
async def create_invoice(
    invoice: InvoiceCreate, 
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id) # <-- Proteger y pasar tenant_id
):
    invoice_crud = InvoiceCRUD(db)
    items_data = [item.dict() for item in invoice.items]
    invoice_data = invoice.dict(exclude={'items'})

    invoice_id = invoice_crud.create_invoice(invoice_data, items_data, tenant_id) # <-- Pasar tenant_id
    if not invoice_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo crear la factura. Verifique los datos o si ya existe un CUFE/Número de factura duplicado.")
    
    # Al recuperar, también filtrar por tenant_id
    created_invoice = invoice_crud.get_invoice(invoice_id, tenant_id) 
    if not created_invoice:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Factura creada pero no se pudo recuperar.")
    return created_invoice

@router.put("/{invoice_id}", response_model=Invoice, summary="Actualizar una factura existente")
async def update_invoice(
    invoice_id: int, 
    invoice_update: InvoiceUpdate, 
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id) # <-- Proteger y pasar tenant_id
):
    invoice_crud = InvoiceCRUD(db)
    update_data = invoice_update.dict(exclude_unset=True)
    items_data_to_update = None
    if "items" in update_data:
        items_data_to_update = update_data.pop("items")
        items_data_to_update = [item.dict() for item in items_data_to_update] 
    
    updated_invoice_id = invoice_crud.update_invoice(
        tenant_id=tenant_id, # <-- Mover tenant_id al inicio
        invoice_id=invoice_id, 
        update_data=update_data, 
        items_data=items_data_to_update
    )
    if not updated_invoice_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada o error al actualizar o no pertenece a su inquilino.")
    
    # Al recuperar, también filtrar por tenant_id
    updated_invoice = invoice_crud.get_invoice(updated_invoice_id, tenant_id) 
    if not updated_invoice:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Factura actualizada pero no se pudo recuperar.")
    return updated_invoice

@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar una factura")
async def delete_invoice(
    invoice_id: int, 
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id) # <-- Proteger y pasar tenant_id
):
    invoice_crud = InvoiceCRUD(db)
    success = invoice_crud.delete_invoice(
        tenant_id=tenant_id, # <-- Mover tenant_id al inicio
        invoice_id=invoice_id
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada o no pertenece a su inquilino.")
    return


# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlalchemy.orm import Session
# from typing import List, Optional
# from datetime import date, datetime
# from database.models import SessionLocal, Factura, ItemFactura
# from database.crud import InvoiceCRUD 
# from api.schemas.invoices import Invoice, InvoiceCreate, InvoiceUpdate, ItemFacturaCreate 
# router = APIRouter()
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
# @router.get("/", response_model=List[Invoice], summary="Obtener lista de facturas con filtros y paginación")
# async def get_invoices(
#     skip: int = Query(0, ge=0, description="Número de registros a saltar para paginación"),
#     limit: int = Query(100, ge=1, le=500, description="Número máximo de registros a devolver"),
#     numero_factura: Optional[str] = Query(None, description="Filtrar por número de factura (búsqueda parcial)"),
#     nit_proveedor: Optional[str] = Query(None, description="Filtrar por NIT del proveedor"),
#     nombre_proveedor: Optional[str] = Query(None, description="Filtrar por nombre del proveedor (búsqueda parcial)"),
#     fecha_desde: Optional[date] = Query(None, description="Filtrar facturas con fecha de emisión igual o posterior a esta (YYYY-MM-DD)"),
#     fecha_hasta: Optional[date] = Query(None, description="Filtrar facturas con fecha de emisión igual o anterior a esta (YYYY-MM-DD)"),
#     monto_total_min: Optional[float] = Query(None, ge=0, description="Filtrar facturas con monto total igual o superior a este"),
#     monto_total_max: Optional[float] = Query(None, ge=0, description="Filtrar facturas con monto total igual o inferior a este"),
#     tipo_documento_dian: Optional[str] = Query(None, description="Filtrar por categoría de proveedor"),
#     revisada_manualmente: Optional[bool] = Query(None, description="Filtrar por estado de revisión manual (True/False)"),
#     usuario_id: Optional[int] = Query(None, ge=1, description="Filtrar por ID de usuario asociado"),
#     db: Session = Depends(get_db)
# ):
#     invoice_crud = InvoiceCRUD(db)
#     invoices = invoice_crud.get_invoices(
#         skip=skip,
#         limit=limit,
#         numero_factura=numero_factura,
#         nit_proveedor=nit_proveedor,
#         nombre_proveedor=nombre_proveedor,
#         fecha_desde=fecha_desde,
#         fecha_hasta=fecha_hasta,
#         monto_total_min=monto_total_min,
#         monto_total_max=monto_total_max,
#         tipo_documento_dian=tipo_documento_dian,
#         revisada_manualmente=revisada_manualmente,
#         usuario_id=usuario_id
#     )
#     return invoices

# @router.get("/{invoice_id}", response_model=Invoice, summary="Obtener detalles de una factura por ID")
# async def get_invoice_details(invoice_id: int, db: Session = Depends(get_db)):
#     invoice_crud = InvoiceCRUD(db)
#     invoice = invoice_crud.get_invoice(invoice_id)
#     if not invoice:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada")
#     return invoice

# @router.post("/", response_model=Invoice, status_code=status.HTTP_201_CREATED, summary="Crear una nueva factura manualmente")
# async def create_invoice(invoice: InvoiceCreate, db: Session = Depends(get_db)):
#     invoice_crud = InvoiceCRUD(db)
#     items_data = [item.dict() for item in invoice.items]
#     invoice_data = invoice.dict(exclude={'items'})

#     invoice_id = invoice_crud.create_invoice(invoice_data, items_data)
#     if not invoice_id:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo crear la factura. Verifique los datos o si ya existe un CUFE/Número de factura duplicado.")
#     created_invoice = invoice_crud.get_invoice(invoice_id)
#     if not created_invoice:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Factura creada pero no se pudo recuperar.")
#     return created_invoice

# @router.put("/{invoice_id}", response_model=Invoice, summary="Actualizar una factura existente")
# async def update_invoice(invoice_id: int, invoice_update: InvoiceUpdate, db: Session = Depends(get_db)):
#     invoice_crud = InvoiceCRUD(db)
#     update_data = invoice_update.dict(exclude_unset=True)
#     items_data_to_update = None
#     if "items" in update_data:
#         items_data_to_update = update_data.pop("items")
#         items_data_to_update = [item.dict() for item in items_data_to_update] 
#     updated_invoice_id = invoice_crud.update_invoice(invoice_id, update_data, items_data_to_update)
#     if not updated_invoice_id:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada o error al actualizar.")
#     updated_invoice = invoice_crud.get_invoice(updated_invoice_id)
#     if not updated_invoice:
#         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Factura actualizada pero no se pudo recuperar.")
#     return updated_invoice
# @router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Eliminar una factura")
# async def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):

#     invoice_crud = InvoiceCRUD(db)
#     success = invoice_crud.delete_invoice(invoice_id)
#     if not success:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada")
#     return 