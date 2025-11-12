from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.models import SessionLocal, Factura
from database.crud import ItemFacturaCRUD
from api.schemas.items_factura import ItemFacturaCreate, ItemFactura, ItemFacturaUpdate
from auth.security import get_current_tenant_id # <-- Importar para obtener tenant_id

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Modificar para que también filtre la factura por tenant_id
async def check_invoice_exists(
    factura_id: int, 
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id) # Obtener tenant_id del token
):
    factura = db.query(Factura).filter(Factura.id == factura_id, Factura.tenant_id == tenant_id).first()
    if not factura:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La factura con ID {factura_id} no fue encontrada o no pertenece a su inquilino."
        )
    return factura

@router.post("/{factura_id}/items/", response_model=ItemFactura, status_code=status.HTTP_201_CREATED)
async def create_item_for_invoice(
    factura_id: int,
    item: ItemFacturaCreate,
    db: Session = Depends(get_db),
    current_invoice: Factura = Depends(check_invoice_exists), # Ya valida el tenant_id
    tenant_id: str = Depends(get_current_tenant_id) # Pasar tenant_id al CRUD
):
    item_crud = ItemFacturaCRUD(db)
    created_item = item_crud.create_item_factura(
        factura_id=factura_id,
        descripcion=item.descripcion,
        cantidad=item.cantidad,
        valor_unitario=item.valor_unitario,
        valor_total=item.valor_total,
        tenant_id=tenant_id # <-- Pasar tenant_id
    )
    if not created_item:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo crear el ítem de factura.")
    return created_item

@router.get("/{factura_id}/items/", response_model=List[ItemFactura])
async def get_items_for_invoice(
    factura_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_invoice: Factura = Depends(check_invoice_exists), # Ya valida el tenant_id
    tenant_id: str = Depends(get_current_tenant_id) # Pasar tenant_id al CRUD
):
    item_crud = ItemFacturaCRUD(db)
    items = item_crud.get_items_by_factura(factura_id=factura_id, tenant_id=tenant_id, skip=skip, limit=limit) # <-- Pasar tenant_id
    return items

@router.get("/{factura_id}/items/{item_id}", response_model=ItemFactura)
async def get_item_from_invoice(
    factura_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_invoice: Factura = Depends(check_invoice_exists), # Ya valida el tenant_id
    tenant_id: str = Depends(get_current_tenant_id) # Pasar tenant_id al CRUD
):
    item_crud = ItemFacturaCRUD(db)
    item = item_crud.get_item_factura(item_id=item_id, factura_id=factura_id, tenant_id=tenant_id) # <-- Pasar tenant_id
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ítem de factura no encontrado en esta factura o no pertenece a su inquilino.")
    return item

@router.put("/{factura_id}/items/{item_id}", response_model=ItemFactura)
async def update_item_in_invoice(
    factura_id: int,
    item_id: int,
    item_update: ItemFacturaUpdate,
    db: Session = Depends(get_db),
    current_invoice: Factura = Depends(check_invoice_exists), # Ya valida el tenant_id
    tenant_id: str = Depends(get_current_tenant_id) # Pasar tenant_id al CRUD
):
    item_crud = ItemFacturaCRUD(db)
    update_data = item_update.dict(exclude_unset=True)
    updated_item = item_crud.update_item_factura(
        tenant_id=tenant_id, # <-- Mover tenant_id al inicio
        item_id=item_id, 
        factura_id=factura_id, 
        update_data=update_data
    )
    if not updated_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ítem de factura no encontrado en esta factura o no se pudo actualizar o no pertenece a su inquilino.")
    return updated_item

@router.delete("/{factura_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item_from_invoice(
    factura_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_invoice: Factura = Depends(check_invoice_exists), # Ya valida el tenant_id
    tenant_id: str = Depends(get_current_tenant_id) # Pasar tenant_id al CRUD
):
    item_crud = ItemFacturaCRUD(db)
    success = item_crud.delete_item_factura(
        tenant_id=tenant_id, # <-- Mover tenant_id al inicio
        item_id=item_id, 
        factura_id=factura_id
    )
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ítem de factura no encontrado en esta factura o no pertenece a su inquilino.")
    return

# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from typing import List

# from database.models import SessionLocal, Factura
# from database.crud import ItemFacturaCRUD
# from api.schemas.items_factura import ItemFacturaCreate, ItemFactura, ItemFacturaUpdate

# router = APIRouter()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
# async def check_invoice_exists(factura_id: int, db: Session = Depends(get_db)):
#     factura = db.query(Factura).filter(Factura.id == factura_id).first()
#     if not factura:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail=f"La factura con ID {factura_id} no fue encontrada."
#         )
#     return factura

# @router.post("/{factura_id}/items/", response_model=ItemFactura, status_code=status.HTTP_201_CREATED)
# async def create_item_for_invoice(
#     factura_id: int,
#     item: ItemFacturaCreate,
#     db: Session = Depends(get_db),
#     current_invoice: Factura = Depends(check_invoice_exists)
# ):
#     item_crud = ItemFacturaCRUD(db)
#     created_item = item_crud.create_item_factura(
#         factura_id=factura_id,
#         descripcion=item.descripcion,
#         cantidad=item.cantidad,
#         valor_unitario=item.valor_unitario,
#         valor_total=item.valor_total
#     )
#     if not created_item:
#         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo crear el ítem de factura.")
#     return created_item

# @router.get("/{factura_id}/items/", response_model=List[ItemFactura])
# async def get_items_for_invoice(
#     factura_id: int,
#     skip: int = 0,
#     limit: int = 100,
#     db: Session = Depends(get_db),
#     current_invoice: Factura = Depends(check_invoice_exists)
# ):
#     item_crud = ItemFacturaCRUD(db)
#     items = item_crud.get_items_by_factura(factura_id=factura_id, skip=skip, limit=limit)
#     return items

# @router.get("/{factura_id}/items/{item_id}", response_model=ItemFactura)
# async def get_item_from_invoice(
#     factura_id: int,
#     item_id: int,
#     db: Session = Depends(get_db),
#     current_invoice: Factura = Depends(check_invoice_exists)
# ):
#     item_crud = ItemFacturaCRUD(db)
#     item = item_crud.get_item_factura(item_id=item_id, factura_id=factura_id)
#     if not item:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ítem de factura no encontrado en esta factura.")
#     return item

# @router.put("/{factura_id}/items/{item_id}", response_model=ItemFactura)
# async def update_item_in_invoice(
#     factura_id: int,
#     item_id: int,
#     item_update: ItemFacturaUpdate,
#     db: Session = Depends(get_db),
#     current_invoice: Factura = Depends(check_invoice_exists)
# ):
#     item_crud = ItemFacturaCRUD(db)
#     update_data = item_update.dict(exclude_unset=True)
#     updated_item = item_crud.update_item_factura(item_id=item_id, factura_id=factura_id, **update_data)
#     if not updated_item:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ítem de factura no encontrado en esta factura o no se pudo actualizar.")
#     return updated_item

# @router.delete("/{factura_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_item_from_invoice(
#     factura_id: int,
#     item_id: int,
#     db: Session = Depends(get_db),
#     current_invoice: Factura = Depends(check_invoice_exists)
# ):
#     item_crud = ItemFacturaCRUD(db)
#     success = item_crud.delete_item_factura(item_id=item_id, factura_id=factura_id)
#     if not success:
#         raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ítem de factura no encontrado en esta factura.")
#     return