import logging
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from sqlalchemy.exc import IntegrityError, OperationalError, DataError
from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
import json
from datetime import datetime, date
from typing import List, Dict, Any, Optional
# Asegurarse de que todos los modelos necesarios estén importados
from database.models import Factura, ItemFactura, Usuario, FacturaAudit, ItemFacturaAudit, Supplier
from config.settings import settings

logger = logging.getLogger(__name__)

CURRENT_AUDIT_USER_ID = None
CURRENT_AUDIT_TENANT_ID = None 

def set_current_audit_user_id(user_id: int):
    global CURRENT_AUDIT_USER_ID
    CURRENT_AUDIT_USER_ID = user_id

def set_current_audit_tenant_id(tenant_id: str):
    global CURRENT_AUDIT_TENANT_ID
    CURRENT_AUDIT_TENANT_ID = tenant_id

def audit_log(func):
    def wrapper(self, *args, **kwargs):
        session = self.db
        obj = None
        old_data = None
        object_type = None
        object_id_for_audit = None 
        
        # La forma más segura de obtener tenant_id para el decorador es que sea un argumento explícito
        # en los métodos CRUD que se auditan.
        audit_tenant_id = kwargs.get('tenant_id') 
        if not audit_tenant_id:
            # Heurística: si el primer argumento es una cadena y parece un tenant_id
            if args and isinstance(args[0], str) and len(args[0]) > 5:
                audit_tenant_id = args[0]
            # Heurística: si el segundo argumento es una cadena y parece un tenant_id (para update/delete)
            elif len(args) > 1 and isinstance(args[1], str) and len(args[1]) > 5:
                audit_tenant_id = args[1]


        if func.__name__ in ['update_invoice', 'delete_invoice']:
            # Para update_invoice(self, tenant_id, invoice_id, ...)
            # Para delete_invoice(self, tenant_id, invoice_id)
            invoice_id = args[1] 
            obj = session.query(Factura).filter(Factura.id == invoice_id, Factura.tenant_id == audit_tenant_id).first()
            object_type = 'Factura'
            object_id_for_audit = invoice_id
            if not obj:
                logger.warning(f"Objeto Factura no encontrado para auditoría en {func.__name__} con ID {invoice_id} y tenant_id {audit_tenant_id}")
                return func(self, *args, **kwargs)
        elif func.__name__ in ['update_item_factura', 'delete_item_factura']:
            # Para update_item_factura(self, tenant_id, item_id, factura_id, ...)
            # Para delete_item_factura(self, tenant_id, item_id, factura_id)
            item_id = args[1] 
            factura_id = args[2] 
            obj = session.query(ItemFactura).filter(ItemFactura.id == item_id, ItemFactura.factura_id == factura_id, ItemFactura.tenant_id == audit_tenant_id).first()
            object_type = 'ItemFactura'
            object_id_for_audit = item_id
            if not obj:
                logger.warning(f"Objeto ItemFactura no encontrado para auditoría en {func.__name__} con ID {item_id}, FacturaID {factura_id} y tenant_id {audit_tenant_id}")
                return func(self, *args, **kwargs)

        if obj:
            exclude_cols = ['contenido_pdf_binario'] 
            obj_dict = {c.name: getattr(obj, c.name) for c in obj.__table__.columns if c.name not in exclude_cols}
            for k, v in obj_dict.items():
                if isinstance(v, (datetime, date)):
                    obj_dict[k] = v.isoformat()
            old_data = json.dumps(obj_dict, default=str)
            logger.debug(f"Datos anteriores para auditoría ({func.__name__}, {object_type}): {old_data}")
        
        try:
            result = func(self, *args, **kwargs)
            session.commit() 
            
            if func.__name__ == 'create_invoice':
                new_invoice_id = result
                if new_invoice_id:
                    new_obj = session.query(Factura).filter(Factura.id == new_invoice_id, Factura.tenant_id == audit_tenant_id).first()
                    if new_obj:
                        audit_entry = FacturaAudit(
                            id_factura=new_obj.id,
                            procesado_en=new_obj.procesado_en,
                            ruta_archivo_original=new_obj.ruta_archivo_original,
                            asunto_correo=new_obj.asunto_correo,
                            remitente_correo=new_obj.remitente_correo,
                            correo_cliente_asociado=new_obj.correo_cliente_asociado,
                            cufe=new_obj.cufe,
                            numero_factura=new_obj.numero_factura,
                            fecha_emision=new_obj.fecha_emision,
                            hora_emision=new_obj.hora_emision,
                            monto_subtotal=new_obj.monto_subtotal,
                            monto_impuesto=new_obj.monto_impuesto,
                            monto_total=new_obj.monto_total,
                            moneda=new_obj.moneda,
                            nombre_proveedor=new_obj.nombre_proveedor,
                            nit_proveedor=new_obj.nit_proveedor,
                            email_proveedor=new_obj.email_proveedor,
                            nombre_cliente=new_obj.nombre_cliente,
                            nit_cliente=new_obj.nit_cliente,
                            fecha_vencimiento=new_obj.fecha_vencimiento,
                            metodo_pago=new_obj.metodo_pago,
                            texto_crudo_xml=new_obj.texto_crudo_xml,
                            tipo_documento_dian=new_obj.tipo_documento_dian, 
                            revisada_manualmente=new_obj.revisada_manualmente,
                            usuario_id_asociado_factura=new_obj.usuario_id,
                            tipo_operacion='INSERT',
                            usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
                            datos_anteriores=None,
                            tenant_id=new_obj.tenant_id 
                        )
                        session.add(audit_entry)
                        for item in new_obj.items:
                            item_audit_entry = ItemFacturaAudit(
                                id_item_factura=item.id,
                                factura_id=item.factura_id,
                                descripcion=item.descripcion,
                                cantidad=item.cantidad,
                                valor_unitario=item.valor_unitario,
                                valor_total=item.valor_total,
                                tipo_operacion='INSERT',
                                usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
                                datos_anteriores=None,
                                tenant_id=item.tenant_id 
                            )
                            session.add(item_audit_entry)
                        session.commit()
            
            elif func.__name__ == 'update_invoice':
                updated_invoice_id = result
                if updated_invoice_id:
                    updated_obj = session.query(Factura).filter(Factura.id == updated_invoice_id, Factura.tenant_id == audit_tenant_id).first()
                    if updated_obj:
                        audit_entry = FacturaAudit(
                            id_factura=updated_obj.id,
                            procesado_en=updated_obj.procesado_en,
                            ruta_archivo_original=updated_obj.ruta_archivo_original,
                            asunto_correo=updated_obj.asunto_correo,
                            remitente_correo=updated_obj.remitente_correo,
                            correo_cliente_asociado=updated_obj.correo_cliente_asociado,
                            cufe=updated_obj.cufe,
                            numero_factura=updated_obj.numero_factura,
                            fecha_emision=updated_obj.fecha_emision,
                            hora_emision=updated_obj.hora_emision,
                            monto_subtotal=updated_obj.monto_subtotal,
                            monto_impuesto=updated_obj.monto_impuesto,
                            monto_total=updated_obj.monto_total,
                            moneda=updated_obj.moneda,
                            nombre_proveedor=updated_obj.nombre_proveedor,
                            nit_proveedor=updated_obj.nit_proveedor,
                            email_proveedor=updated_obj.email_proveedor,
                            nombre_cliente=updated_obj.nombre_cliente,
                            nit_cliente=updated_obj.nit_cliente,
                            fecha_vencimiento=updated_obj.fecha_vencimiento,
                            metodo_pago=updated_obj.metodo_pago,
                            texto_crudo_xml=updated_obj.texto_crudo_xml,
                            tipo_documento_dian=updated_obj.tipo_documento_dian, 
                            revisada_manualmente=updated_obj.revisada_manualmente,
                            usuario_id_asociado_factura=updated_obj.usuario_id,
                            tipo_operacion='UPDATE',
                            usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
                            datos_anteriores=old_data,
                            tenant_id=updated_obj.tenant_id 
                        )
                        session.add(audit_entry)
                        session.commit()
            elif func.__name__ == 'delete_invoice':
                deleted_invoice_id = object_id_for_audit 
                audit_entry = FacturaAudit(
                    id_factura=deleted_invoice_id,
                    tipo_operacion='DELETE',
                    usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
                    datos_anteriores=old_data,
                    tenant_id=audit_tenant_id 
                )
                session.add(audit_entry)
                logger.warning("Auditoría de ítems eliminados en delete_invoice: Considerar triggers de DB o capturar ítems antes de la eliminación.")
                session.commit()
            elif func.__name__ == 'create_item_factura':
                new_item_id = result
                if new_item_id:
                    new_item_obj = session.query(ItemFactura).filter(ItemFactura.id == new_item_id, ItemFactura.tenant_id == audit_tenant_id).first()
                    if new_item_obj:
                        item_audit_entry = ItemFacturaAudit(
                            id_item_factura=new_item_obj.id,
                            factura_id=new_item_obj.factura_id,
                            descripcion=new_item_obj.descripcion,
                            cantidad=new_item_obj.cantidad,
                            valor_unitario=new_item_obj.valor_unitario,
                            valor_total=new_item_obj.valor_total,
                            tipo_operacion='INSERT',
                            usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
                            datos_anteriores=None,
                            tenant_id=new_item_obj.tenant_id 
                        )
                        session.add(item_audit_entry)
                        session.commit()
            elif func.__name__ == 'update_item_factura':
                updated_item_id = result 
                if updated_item_id:
                    updated_item_obj = session.query(ItemFactura).filter(ItemFactura.id == updated_item_id, ItemFactura.tenant_id == audit_tenant_id).first()
                    if updated_item_obj:
                        item_audit_entry = ItemFacturaAudit(
                            id_item_factura=updated_item_obj.id,
                            factura_id=updated_item_obj.factura_id,
                            descripcion=updated_item_obj.descripcion,
                            cantidad=updated_item_obj.cantidad,
                            valor_unitario=updated_item_obj.valor_unitario,
                            valor_total=updated_item_obj.valor_total,
                            tipo_operacion='UPDATE',
                            usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
                            datos_anteriores=old_data,
                            tenant_id=updated_item_obj.tenant_id 
                        )
                        session.add(item_audit_entry)
                        session.commit()
            elif func.__name__ == 'delete_item_factura':
                deleted_item_id = object_id_for_audit
                item_audit_entry = ItemFacturaAudit(
                    id_item_factura=deleted_item_id,
                    factura_id=args[2], 
                    tipo_operacion='DELETE',
                    usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
                    datos_anteriores=old_data,
                    tenant_id=audit_tenant_id 
                )
                session.add(item_audit_entry)
                session.commit()

            return result 
        except (IntegrityError, DataError, OperationalError) as e:
            session.rollback()
            logger.error(f"Error de base de datos en {func.__name__}: {e}", exc_info=True)
            if "Data too long for column" in str(e) or "Incorrect string value" in str(e):
                logger.warning(f"Reintentando {func.__name__} sin contenido binario debido a error de tamaño/codificación.")
                if func.__name__ == 'create_invoice':
                    invoice_data_retry = args[0].copy()
                    items_data_retry = args[1]
                    tenant_id_param = args[2] 
                    if 'contenido_pdf_binario' in invoice_data_retry:
                        invoice_data_retry['contenido_pdf_binario'] = None
                    return func(self, invoice_data_retry, items_data_retry, tenant_id_param)
                elif func.__name__ == 'update_invoice':
                    tenant_id_param = args[0]
                    invoice_id_param = args[1]
                    update_data_retry = args[2].copy()
                    items_data_retry = args[3] if len(args) > 3 else None
                    if 'contenido_pdf_binario' in update_data_retry:
                        update_data_retry['contenido_pdf_binario'] = None
                    return func(self, tenant_id_param, invoice_id_param, update_data_retry, items_data_retry) 
            raise 
        except Exception as e:
            session.rollback()
            logger.error(f"Error inesperado durante {func.__name__}: {e}", exc_info=True)
            raise
    return wrapper

class UserCRUD:
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, email: str, email_account_password_encrypted: Optional[str], tenant_id: Optional[str] = None) -> Optional[Usuario]:
        try:
            new_user = Usuario(
                correo=email,
                email_account_password_encrypted=email_account_password_encrypted,
                tenant_id=tenant_id
            )
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)
            logger.info(f"Usuario '{email}' creado exitosamente para tenant '{tenant_id}'.")
            return new_user
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Error al crear usuario '{email}': Ya existe un usuario con ese correo.", exc_info=True)
            return None
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error inesperado al crear usuario '{email}': {e}", exc_info=True)
            return None
    
    def get_user_by_email(self, email: str) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(Usuario.correo == email).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[Usuario]:
        return self.db.query(Usuario).filter(Usuario.id == user_id).first()
    
    def get_users(self, skip: int = 0, limit: int = 100, tenant_id: Optional[str] = None) -> List[Usuario]:
        query = self.db.query(Usuario)
        if tenant_id:
            query = query.filter(Usuario.tenant_id == tenant_id)
        return query.offset(skip).limit(limit).all()
    
    def update_user(self, user_id: int, tenant_id: str, email_account_password_encrypted: Optional[str] = None, **update_data: Any) -> Optional[Usuario]:
        user = self.db.query(Usuario).filter(Usuario.id == user_id, Usuario.tenant_id == tenant_id).first()
        if not user:
            logger.warning(f"Intento de actualizar usuario con ID {user_id} fallido: Usuario no encontrado o no pertenece a su inquilino.")
            return None
        try:
            if email_account_password_encrypted is not None:
                user.email_account_password_encrypted = email_account_password_encrypted
            
            for key, value in update_data.items():
                if hasattr(user, key) and key not in ['id', 'tenant_id', 'email_account_password_encrypted']:
                    setattr(user, key, value)
            self.db.commit()
            self.db.refresh(user)
            logger.info(f"Usuario con ID {user_id} actualizado exitosamente para tenant '{tenant_id}'.")
            return user
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Error al actualizar usuario con ID {user_id}: Posible duplicado de correo o problema de integridad.", exc_info=True)
            return None
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error inesperado al actualizar usuario con ID {user_id}: {e}", exc_info=True)
            return None
    
    def delete_user(self, user_id: int, tenant_id: str) -> bool:
        user = self.db.query(Usuario).filter(Usuario.id == user_id, Usuario.tenant_id == tenant_id).first()
        if not user:
            logger.warning(f"Intento de eliminar usuario con ID {user_id} fallido: Usuario no encontrado o no pertenece a su inquilino.")
            return False
        try:
            self.db.delete(user)
            self.db.commit()
            logger.info(f"Usuario con ID {user_id} eliminado exitosamente para tenant '{tenant_id}'.")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al eliminar usuario con ID {user_id}: {e}", exc_info=True)
            return False

class InvoiceCRUD:
    def __init__(self, db: Session):
        self.db = db

    @audit_log
    def create_invoice(self, invoice_data: Dict[str, Any], items_data: List[Dict[str, Any]], tenant_id: str) -> Optional[int]:
        try:
            invoice_data.pop('id', None)
            
            nit_proveedor_actual = invoice_data.get('nit_proveedor')
            proveedor_id = None
            if nit_proveedor_actual:
                try:
                    supplier = self.db.query(Supplier).filter(Supplier.nit == nit_proveedor_actual, Supplier.tenant_id == tenant_id).first()
                    if supplier:
                        proveedor_id = supplier.id
                        logger.info(f"Proveedor '{supplier.name}' (NIT: {nit_proveedor_actual}) encontrado en la tabla 'suppliers'. ID: {proveedor_id}")
                    else:
                        logger.info(f"Proveedor con NIT '{nit_proveedor_actual}' NO encontrado en la tabla 'suppliers' para tenant '{tenant_id}'.")
                except OperationalError as e:
                    logger.error(f"Error de conexión/operación al consultar tabla 'suppliers': {e}", exc_info=True)
                    logger.warning("Factura se guardará sin proveedor_id debido a error de DB en consulta de proveedores.")
                except Exception as e:
                    logger.error(f"Error inesperado al buscar proveedor en tabla 'suppliers': {e}", exc_info=True)
                    logger.warning("Factura se guardará sin proveedor_id debido a error al buscar proveedor.")
            
            invoice_data['proveedor_id'] = proveedor_id
            
            if proveedor_id is None:
                invoice_data['revisada_manualmente'] = False
                invoice_data['tipo_documento_dian'] = invoice_data.get('tipo_documento_dian', 'Por revisar') 
            else:
                pass 

            new_invoice = Factura(**{k: v for k, v in invoice_data.items() if k != 'items'}, tenant_id=tenant_id)
            self.db.add(new_invoice)
            self.db.flush() 

            for item_data in items_data:
                item_data.pop('id', None)
                new_item = ItemFactura(factura_id=new_invoice.id, **item_data, tenant_id=tenant_id)
                self.db.add(new_item)
            logger.info(f"Factura {new_invoice.numero_factura} agregada a la sesión para tenant '{tenant_id}'. Proveedor ID: {new_invoice.proveedor_id}. Tipo Documento DIAN: {new_invoice.tipo_documento_dian}")
            return new_invoice.id 
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Error de integridad al crear factura (posible duplicado de CUFE/Número): {e}", exc_info=True)
            return None
        except DataError as e:
            self.db.rollback()
            logger.error(f"DataError al crear factura: {e}", exc_info=True)
            if 'contenido_pdf_binario' in invoice_data and ("Data too long for column" in str(e) or "Incorrect string value" in str(e)):
                logger.warning(f"Reintentando create_invoice sin contenido binario debido a error de tamaño/codificación.")
                invoice_data['contenido_pdf_binario'] = None
                return self.create_invoice(invoice_data, items_data, tenant_id)
            return None
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error inesperado al crear factura: {e}", exc_info=True)
            return None
    
    def get_invoices(
        self,
        tenant_id: str, 
        skip: int = 0,
        limit: int = 100,
        numero_factura: Optional[str] = None,
        nit_proveedor: Optional[str] = None,
        nombre_proveedor: Optional[str] = None,
        fecha_desde: Optional[date] = None,
        fecha_hasta: Optional[date] = None,
        monto_total_min: Optional[float] = None,
        monto_total_max: Optional[float] = None,
        tipo_documento_dian: Optional[str] = None, 
        revisada_manualmente: Optional[bool] = None,
        usuario_id: Optional[int] = None
    ) -> List[Factura]:
        query = self.db.query(Factura).filter(Factura.tenant_id == tenant_id)
        if numero_factura:
            query = query.filter(Factura.numero_factura.ilike(f"%{numero_factura}%"))
        if nit_proveedor:
            query = query.filter(Factura.nit_proveedor == nit_proveedor)
        if nombre_proveedor:
            query = query.filter(Factura.nombre_proveedor.ilike(f"%{nombre_proveedor}%"))
        if fecha_desde:
            query = query.filter(Factura.fecha_emision >= fecha_desde)
        if fecha_hasta:
            query = query.filter(Factura.fecha_emision <= fecha_hasta)
        if monto_total_min:
            query = query.filter(Factura.monto_total >= monto_total_min)
        if monto_total_max:
            query = query.filter(Factura.monto_total <= monto_total_max)
        if tipo_documento_dian: 
            query = query.filter(Factura.tipo_documento_dian == tipo_documento_dian) 
        if revisada_manualmente is not None:
            query = query.filter(Factura.revisada_manualmente == revisada_manualmente)
        if usuario_id:
            query = query.filter(Factura.usuario_id == usuario_id)
        return query.offset(skip).limit(limit).all()

    @audit_log
    def update_invoice(self, tenant_id: str, invoice_id: int, update_data: Dict[str, Any], items_data: Optional[List[Dict[str, Any]]] = None) -> Optional[int]: # <-- tenant_id al inicio
        invoice = self.db.query(Factura).filter(Factura.id == invoice_id, Factura.tenant_id == tenant_id).first()
        if not invoice:
            logger.warning(f"Intento de actualizar factura con ID {invoice_id} fallido: Factura no encontrada o no pertenece a su inquilino.")
            return None

        try:
            for key, value in update_data.items():
                if hasattr(invoice, key) and key not in ['id', 'items', 'tenant_id']:
                    setattr(invoice, key, value)
            
            if 'nit_proveedor' in update_data or invoice.proveedor_id is None:
                nit_proveedor_actual = update_data.get('nit_proveedor', invoice.nit_proveedor)
                if nit_proveedor_actual:
                    supplier = self.db.query(Supplier).filter(Supplier.nit == nit_proveedor_actual, Supplier.tenant_id == tenant_id).first()
                    if supplier:
                        proveedor_id = supplier.id
                        logger.info(f"Proveedor '{supplier.name}' (NIT: {nit_proveedor_actual}) re-asociado en la tabla 'suppliers'. ID: {supplier.id}")
                    else:
                        invoice.proveedor_id = None
                        logger.info(f"Proveedor con NIT '{nit_proveedor_actual}' NO encontrado en la tabla 'suppliers' para tenant '{tenant_id}' durante actualización.")
                else:
                    invoice.proveedor_id = None
            
            if 'tipo_documento_dian' in update_data:
                invoice.tipo_documento_dian = update_data['tipo_documento_dian']

            if items_data is not None:
                self.db.query(ItemFactura).filter(ItemFactura.factura_id == invoice.id, ItemFactura.tenant_id == tenant_id).delete()
                self.db.flush() 
                for item_data in items_data:
                    item_data.pop('id', None) 
                    new_item = ItemFactura(factura_id=invoice.id, **item_data, tenant_id=tenant_id)
                    self.db.add(new_item)
            self.db.flush() 
            logger.info(f"Factura con ID {invoice_id} actualizada exitosamente para tenant '{tenant_id}'. Tipo Documento DIAN: {invoice.tipo_documento_dian}")
            return invoice.id
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Error de integridad al actualizar factura con ID {invoice_id}: {e}", exc_info=True)
            return None
        except DataError as e:
            self.db.rollback()
            logger.error(f"DataError al actualizar factura: {e}", exc_info=True)
            if 'contenido_pdf_binario' in update_data and ("Data too long for column" in str(e) or "Incorrect string value" in str(e)):
                logger.warning(f"Reintentando update_invoice sin contenido binario debido a error de tamaño/codificación.")
                update_data['contenido_pdf_binario'] = None
                return self.update_invoice(tenant_id, invoice_id, update_data, items_data) 
            raise 
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error inesperado al actualizar factura con ID {invoice_id}: {e}", exc_info=True)
            return None
    
    @audit_log
    def delete_invoice(self, tenant_id: str, invoice_id: int) -> bool: # <-- tenant_id al inicio
        invoice = self.db.query(Factura).filter(Factura.id == invoice_id, Factura.tenant_id == tenant_id).first()
        if not invoice:
            logger.warning(f"Intento de eliminar factura con ID {invoice_id} fallido: Factura no encontrada o no pertenece a su inquilino.")
            return False
        try:
            self.db.delete(invoice)
            logger.info(f"Factura con ID {invoice_id} eliminada exitosamente para tenant '{tenant_id}'.")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al eliminar factura con ID {invoice_id}: {e}", exc_info=True)
            return False

class ItemFacturaCRUD:
    def __init__(self, db: Session):
        self.db = db
    
    @audit_log
    def create_item_factura(self, factura_id: int, descripcion: str, cantidad: float, valor_unitario: float, valor_total: float, tenant_id: str) -> Optional[int]:
        try:
            db_item = ItemFactura(
                factura_id=factura_id,
                descripcion=descripcion,
                cantidad=cantidad,
                valor_unitario=valor_unitario,
                valor_total=valor_total,
                tenant_id=tenant_id
            )
            self.db.add(db_item)
            self.db.flush() 
            logger.info(f"Ítem de factura {db_item.id} creado para factura {factura_id} y tenant '{tenant_id}'.")
            return db_item.id 
        except IntegrityError as e:
            self.db.rollback()
            logger.error(f"Error de integridad al crear ítem de factura para factura {factura_id}: {e}", exc_info=True)
            return None
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error inesperado al crear ítem de factura para factura {factura_id}: {e}", exc_info=True)
            return None
    
    def get_item_factura(self, item_id: int, factura_id: int, tenant_id: str) -> Optional[ItemFactura]:
        return self.db.query(ItemFactura).filter(
            ItemFactura.id == item_id,
            ItemFactura.factura_id == factura_id,
            ItemFactura.tenant_id == tenant_id
        ).first()
    
    def get_items_by_factura(self, factura_id: int, tenant_id: str, skip: int = 0, limit: int = 100) -> List[ItemFactura]:
        return self.db.query(ItemFactura).filter(
            ItemFactura.factura_id == factura_id,
            ItemFactura.tenant_id == tenant_id
        ).offset(skip).limit(limit).all()
    
    @audit_log
    def update_item_factura(self, tenant_id: str, item_id: int, factura_id: int, update_data: Any) -> Optional[int]: # <-- tenant_id al inicio
        db_item = self.get_item_factura(item_id, factura_id, tenant_id)
        if not db_item:
            logger.warning(f"Intento de actualizar ítem {item_id} de factura {factura_id} fallido: Ítem no encontrado o no pertenece a su inquilino.")
            return None
        try:
            for key, value in update_data.items():
                if hasattr(db_item, key) and key not in ['id', 'factura_id', 'tenant_id']:
                    setattr(db_item, key, value)
            self.db.flush() 
            logger.info(f"Ítem de factura {item_id} para factura {factura_id} actualizado exitosamente para tenant '{tenant_id}'.")
            return db_item.id 
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al actualizar ítem {item_id} de factura {factura_id}: {e}", exc_info=True)
            return None
    
    @audit_log
    def delete_item_factura(self, tenant_id: str, item_id: int, factura_id: int) -> bool: # <-- tenant_id al inicio
        db_item = self.get_item_factura(item_id, factura_id, tenant_id)
        if not db_item:
            logger.warning(f"Intento de eliminar ítem {item_id} de factura {factura_id} fallido: Ítem no encontrado o no pertenece a su inquilino.")
            return False
        try:
            self.db.delete(db_item)
            logger.info(f"Ítem de factura {item_id} para factura {factura_id} eliminado exitosamente para tenant '{tenant_id}'.")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error al eliminar ítem {item_id} de factura {factura_id}: {e}", exc_info=True)
            return False

class FacturaAuditCRUD:
    def __init__(self, db: Session):
        self.db = db

    def create_factura_audit(self, audit_data: dict, tenant_id: str):
        db_audit = FacturaAudit(**audit_data, tenant_id=tenant_id)
        self.db.add(db_audit)
        self.db.commit()
        self.db.refresh(db_audit)
        return db_audit
    
    def get_factura_audits(self, factura_id: int, tenant_id: str):
        return self.db.query(FacturaAudit).filter(FacturaAudit.id_factura == factura_id, FacturaAudit.tenant_id == tenant_id).all()

class ItemFacturaAuditCRUD: # <-- ¡FALTABA ESTA CLASE COMPLETA!
    def __init__(self, db: Session):
        self.db = db

    def create_item_factura_audit(self, audit_data: dict, tenant_id: str):
        db_audit = ItemFacturaAudit(**audit_data, tenant_id=tenant_id)
        self.db.add(db_audit)
        self.db.commit()
        self.db.refresh(db_audit)
        return db_audit

    def get_item_factura_audits(self, item_factura_id: int, tenant_id: str):
        return self.db.query(ItemFacturaAudit).filter(ItemFacturaAudit.id_item_factura == item_factura_id, ItemFacturaAudit.tenant_id == tenant_id).all()




# import logging
# from sqlalchemy.orm import Session
# from sqlalchemy import text, inspect
# from sqlalchemy.exc import IntegrityError, OperationalError, DataError
# from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
# import json
# from datetime import datetime, date
# from typing import List, Dict, Any, Optional
# from database.models import Factura, ItemFactura, Usuario, FacturaAudit, ItemFacturaAudit, Supplier
# from config.settings import settings

# logger = logging.getLogger(__name__)

# CURRENT_AUDIT_USER_ID = None
# CURRENT_AUDIT_TENANT_ID = None 

# def set_current_audit_user_id(user_id: int):
#     global CURRENT_AUDIT_USER_ID
#     CURRENT_AUDIT_USER_ID = user_id

# def set_current_audit_tenant_id(tenant_id: str):
#     global CURRENT_AUDIT_TENANT_ID
#     CURRENT_AUDIT_TENANT_ID = tenant_id

# def audit_log(func):
#     def wrapper(self, *args, **kwargs):
#         session = self.db
#         obj = None
#         old_data = None
#         object_type = None
#         object_id_for_audit = None 
        
#         # Extraer tenant_id de los argumentos si está presente
#         audit_tenant_id = kwargs.get('tenant_id')
#         if not audit_tenant_id and args and isinstance(args[0], str) and len(args[0]) > 5: # Asume que el primer argumento es tenant_id si es una cadena y no es self
#              audit_tenant_id = args[0] 
#         elif not audit_tenant_id and len(args) > 1 and isinstance(args[1], str) and len(args[1]) > 5 and func.__name__ not in ['create_invoice', 'create_item_factura']: # Si hay ID antes, intenta con el segundo arg
#              audit_tenant_id = args[1]


#         if func.__name__ in ['update_invoice', 'delete_invoice']:
#             invoice_id = args[1] # Ahora invoice_id es el segundo argumento
#             obj = session.query(Factura).filter(Factura.id == invoice_id, Factura.tenant_id == audit_tenant_id).first()
#             object_type = 'Factura'
#             object_id_for_audit = invoice_id
#             if not obj:
#                 logger.warning(f"Objeto Factura no encontrado para auditoría en {func.__name__} con ID {invoice_id} y tenant_id {audit_tenant_id}")
#                 return func(self, *args, **kwargs)
#         elif func.__name__ in ['update_item_factura', 'delete_item_factura']:
#             item_id = args[1] # Ahora item_id es el segundo argumento
#             factura_id = args[2] # Ahora factura_id es el tercer argumento
#             obj = session.query(ItemFactura).filter(ItemFactura.id == item_id, ItemFactura.factura_id == factura_id, ItemFactura.tenant_id == audit_tenant_id).first()
#             object_type = 'ItemFactura'
#             object_id_for_audit = item_id
#             if not obj:
#                 logger.warning(f"Objeto ItemFactura no encontrado para auditoría en {func.__name__} con ID {item_id}, FacturaID {factura_id} y tenant_id {audit_tenant_id}")
#                 return func(self, *args, **kwargs)

#         if obj:
#             exclude_cols = ['contenido_pdf_binario'] 
#             obj_dict = {c.name: getattr(obj, c.name) for c in obj.__table__.columns if c.name not in exclude_cols}
#             for k, v in obj_dict.items():
#                 if isinstance(v, (datetime, date)):
#                     obj_dict[k] = v.isoformat()
#             old_data = json.dumps(obj_dict, default=str)
#             logger.debug(f"Datos anteriores para auditoría ({func.__name__}, {object_type}): {old_data}")
        
#         try:
#             result = func(self, *args, **kwargs)
#             session.commit() 
            
#             if func.__name__ == 'create_invoice':
#                 new_invoice_id = result
#                 if new_invoice_id:
#                     new_obj = session.query(Factura).filter(Factura.id == new_invoice_id, Factura.tenant_id == audit_tenant_id).first()
#                     if new_obj:
#                         audit_entry = FacturaAudit(
#                             id_factura=new_obj.id,
#                             procesado_en=new_obj.procesado_en,
#                             ruta_archivo_original=new_obj.ruta_archivo_original,
#                             asunto_correo=new_obj.asunto_correo,
#                             remitente_correo=new_obj.remitente_correo,
#                             correo_cliente_asociado=new_obj.correo_cliente_asociado,
#                             cufe=new_obj.cufe,
#                             numero_factura=new_obj.numero_factura,
#                             fecha_emision=new_obj.fecha_emision,
#                             hora_emision=new_obj.hora_emision,
#                             monto_subtotal=new_obj.monto_subtotal,
#                             monto_impuesto=new_obj.monto_impuesto,
#                             monto_total=new_obj.monto_total,
#                             moneda=new_obj.moneda,
#                             nombre_proveedor=new_obj.nombre_proveedor,
#                             nit_proveedor=new_obj.nit_proveedor,
#                             email_proveedor=new_obj.email_proveedor,
#                             nombre_cliente=new_obj.nombre_cliente,
#                             nit_cliente=new_obj.nit_cliente,
#                             fecha_vencimiento=new_obj.fecha_vencimiento,
#                             metodo_pago=new_obj.metodo_pago,
#                             texto_crudo_xml=new_obj.texto_crudo_xml,
#                             tipo_documento_dian=new_obj.tipo_documento_dian, 
#                             revisada_manualmente=new_obj.revisada_manualmente,
#                             usuario_id_asociado_factura=new_obj.usuario_id,
#                             tipo_operacion='INSERT',
#                             usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                             datos_anteriores=None,
#                             tenant_id=new_obj.tenant_id 
#                         )
#                         session.add(audit_entry)
#                         for item in new_obj.items:
#                             item_audit_entry = ItemFacturaAudit(
#                                 id_item_factura=item.id,
#                                 factura_id=item.factura_id,
#                                 descripcion=item.descripcion,
#                                 cantidad=item.cantidad,
#                                 valor_unitario=item.valor_unitario,
#                                 valor_total=item.valor_total,
#                                 tipo_operacion='INSERT',
#                                 usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                                 datos_anteriores=None,
#                                 tenant_id=item.tenant_id 
#                             )
#                             session.add(item_audit_entry)
#                         session.commit()
            
#             elif func.__name__ == 'update_invoice':
#                 updated_invoice_id = result
#                 if updated_invoice_id:
#                     updated_obj = session.query(Factura).filter(Factura.id == updated_invoice_id, Factura.tenant_id == audit_tenant_id).first()
#                     if updated_obj:
#                         audit_entry = FacturaAudit(
#                             id_factura=updated_obj.id,
#                             procesado_en=updated_obj.procesado_en,
#                             ruta_archivo_original=updated_obj.ruta_archivo_original,
#                             asunto_correo=updated_obj.asunto_correo,
#                             remitente_correo=updated_obj.remitente_correo,
#                             correo_cliente_asociado=updated_obj.correo_cliente_asociado,
#                             cufe=updated_obj.cufe,
#                             numero_factura=updated_obj.numero_factura,
#                             fecha_emision=updated_obj.fecha_emision,
#                             hora_emision=updated_obj.hora_emision,
#                             monto_subtotal=updated_obj.monto_subtotal,
#                             monto_impuesto=updated_obj.monto_impuesto,
#                             monto_total=updated_obj.monto_total,
#                             moneda=updated_obj.moneda,
#                             nombre_proveedor=updated_obj.nombre_proveedor,
#                             nit_proveedor=updated_obj.nit_proveedor,
#                             email_proveedor=updated_obj.email_proveedor,
#                             nombre_cliente=updated_obj.nombre_cliente,
#                             nit_cliente=updated_obj.nit_cliente,
#                             fecha_vencimiento=updated_obj.fecha_vencimiento,
#                             metodo_pago=updated_obj.metodo_pago,
#                             texto_crudo_xml=updated_obj.texto_crudo_xml,
#                             tipo_documento_dian=updated_obj.tipo_documento_dian, 
#                             revisada_manualmente=updated_obj.revisada_manualmente,
#                             usuario_id_asociado_factura=updated_obj.usuario_id,
#                             tipo_operacion='UPDATE',
#                             usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                             datos_anteriores=old_data,
#                             tenant_id=updated_obj.tenant_id 
#                         )
#                         session.add(audit_entry)
#                         session.commit()
#             elif func.__name__ == 'delete_invoice':
#                 deleted_invoice_id = object_id_for_audit 
#                 audit_entry = FacturaAudit(
#                     id_factura=deleted_invoice_id,
#                     tipo_operacion='DELETE',
#                     usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                     datos_anteriores=old_data,
#                     tenant_id=audit_tenant_id 
#                 )
#                 session.add(audit_entry)
#                 logger.warning("Auditoría de ítems eliminados en delete_invoice: Considerar triggers de DB o capturar ítems antes de la eliminación.")
#                 session.commit()
#             elif func.__name__ == 'create_item_factura':
#                 new_item_id = result
#                 if new_item_id:
#                     new_item_obj = session.query(ItemFactura).filter(ItemFactura.id == new_item_id, ItemFactura.tenant_id == audit_tenant_id).first()
#                     if new_item_obj:
#                         item_audit_entry = ItemFacturaAudit(
#                             id_item_factura=new_item_obj.id,
#                             factura_id=new_item_obj.factura_id,
#                             descripcion=new_item_obj.descripcion,
#                             cantidad=new_item_obj.cantidad,
#                             valor_unitario=new_item_obj.valor_unitario,
#                             valor_total=new_item_obj.valor_total,
#                             tipo_operacion='INSERT',
#                             usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                             datos_anteriores=None,
#                             tenant_id=new_item_obj.tenant_id 
#                         )
#                         session.add(item_audit_entry)
#                         session.commit()
#             elif func.__name__ == 'update_item_factura':
#                 updated_item_id = result 
#                 if updated_item_id:
#                     updated_item_obj = session.query(ItemFactura).filter(ItemFactura.id == updated_item_id, ItemFactura.tenant_id == audit_tenant_id).first()
#                     if updated_item_obj:
#                         item_audit_entry = ItemFacturaAudit(
#                             id_item_factura=updated_item_obj.id,
#                             factura_id=updated_item_obj.factura_id,
#                             descripcion=updated_item_obj.descripcion,
#                             cantidad=updated_item_obj.cantidad,
#                             valor_unitario=updated_item_obj.valor_unitario,
#                             valor_total=updated_item_obj.valor_total,
#                             tipo_operacion='UPDATE',
#                             usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                             datos_anteriores=old_data,
#                             tenant_id=updated_item_obj.tenant_id 
#                         )
#                         session.add(item_audit_entry)
#                         session.commit()
#             elif func.__name__ == 'delete_item_factura':
#                 deleted_item_id = object_id_for_audit
#                 item_audit_entry = ItemFacturaAudit(
#                     id_item_factura=deleted_item_id,
#                     factura_id=args[2], # factura_id ahora es el tercer argumento
#                     tipo_operacion='DELETE',
#                     usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                     datos_anteriores=old_data,
#                     tenant_id=audit_tenant_id 
#                 )
#                 session.add(item_audit_entry)
#                 session.commit()

#             return result 
#         except (IntegrityError, DataError, OperationalError) as e:
#             session.rollback()
#             logger.error(f"Error de base de datos en {func.__name__}: {e}", exc_info=True)
#             if "Data too long for column" in str(e) or "Incorrect string value" in str(e):
#                 logger.warning(f"Reintentando {func.__name__} sin contenido binario debido a error de tamaño/codificación.")
#                 if func.__name__ == 'create_invoice':
#                     # Si es create_invoice, tenant_id es el último argumento pasado
#                     invoice_data_retry = args[0].copy()
#                     items_data_retry = args[1]
#                     tenant_id_param = args[2] # El tenant_id está en la tercera posición
#                     if 'contenido_pdf_binario' in invoice_data_retry:
#                         invoice_data_retry['contenido_pdf_binario'] = None
#                     return func(self, invoice_data_retry, items_data_retry, tenant_id_param)
#                 elif func.__name__ == 'update_invoice':
#                     # Si es update_invoice, tenant_id es el primer argumento, invoice_id el segundo
#                     tenant_id_param = args[0]
#                     invoice_id_param = args[1]
#                     update_data_retry = args[2].copy()
#                     items_data_retry = args[3] if len(args) > 3 else None
#                     if 'contenido_pdf_binario' in update_data_retry:
#                         update_data_retry['contenido_pdf_binario'] = None
#                     return func(self, tenant_id_param, invoice_id_param, update_data_retry, items_data_retry) 
#             raise 
#         except Exception as e:
#             session.rollback()
#             logger.error(f"Error inesperado durante {func.__name__}: {e}", exc_info=True)
#             raise
#     return wrapper

# class UserCRUD:
#     def __init__(self, db: Session):
#         self.db = db
    
#     def create_user(self, email: str, email_account_password_encrypted: Optional[str], tenant_id: Optional[str] = None) -> Optional[Usuario]:
#         try:
#             new_user = Usuario(
#                 correo=email,
#                 email_account_password_encrypted=email_account_password_encrypted,
#                 tenant_id=tenant_id
#             )
#             self.db.add(new_user)
#             self.db.commit()
#             self.db.refresh(new_user)
#             logger.info(f"Usuario '{email}' creado exitosamente para tenant '{tenant_id}'.")
#             return new_user
#         except IntegrityError as e:
#             self.db.rollback()
#             logger.error(f"Error al crear usuario '{email}': Ya existe un usuario con ese correo.", exc_info=True)
#             return None
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error inesperado al crear usuario '{email}': {e}", exc_info=True)
#             return None
    
#     def get_user_by_email(self, email: str) -> Optional[Usuario]:
#         return self.db.query(Usuario).filter(Usuario.correo == email).first()
    
#     def get_user_by_id(self, user_id: int) -> Optional[Usuario]:
#         return self.db.query(Usuario).filter(Usuario.id == user_id).first()
    
#     def get_users(self, skip: int = 0, limit: int = 100, tenant_id: Optional[str] = None) -> List[Usuario]:
#         query = self.db.query(Usuario)
#         if tenant_id:
#             query = query.filter(Usuario.tenant_id == tenant_id)
#         return query.offset(skip).limit(limit).all()
    
#     def update_user(self, user_id: int, tenant_id: str, email_account_password_encrypted: Optional[str] = None, **update_data: Any) -> Optional[Usuario]:
#         user = self.db.query(Usuario).filter(Usuario.id == user_id, Usuario.tenant_id == tenant_id).first()
#         if not user:
#             logger.warning(f"Intento de actualizar usuario con ID {user_id} fallido: Usuario no encontrado o no pertenece a su inquilino.")
#             return None
#         try:
#             if email_account_password_encrypted is not None:
#                 user.email_account_password_encrypted = email_account_password_encrypted
            
#             for key, value in update_data.items():
#                 if hasattr(user, key) and key not in ['id', 'tenant_id', 'email_account_password_encrypted']:
#                     setattr(user, key, value)
#             self.db.commit()
#             self.db.refresh(user)
#             logger.info(f"Usuario con ID {user_id} actualizado exitosamente para tenant '{tenant_id}'.")
#             return user
#         except IntegrityError as e:
#             self.db.rollback()
#             logger.error(f"Error al actualizar usuario con ID {user_id}: Posible duplicado de correo o problema de integridad.", exc_info=True)
#             return None
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error inesperado al actualizar usuario con ID {user_id}: {e}", exc_info=True)
#             return None
    
#     def delete_user(self, user_id: int, tenant_id: str) -> bool:
#         user = self.db.query(Usuario).filter(Usuario.id == user_id, Usuario.tenant_id == tenant_id).first()
#         if not user:
#             logger.warning(f"Intento de eliminar usuario con ID {user_id} fallido: Usuario no encontrado o no pertenece a su inquilino.")
#             return False
#         try:
#             self.db.delete(user)
#             self.db.commit()
#             logger.info(f"Usuario con ID {user_id} eliminado exitosamente para tenant '{tenant_id}'.")
#             return True
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error al eliminar usuario con ID {user_id}: {e}", exc_info=True)
#             return False

# class InvoiceCRUD:
#     def __init__(self, db: Session):
#         self.db = db

#     @audit_log
#     def create_invoice(self, invoice_data: Dict[str, Any], items_data: List[Dict[str, Any]], tenant_id: str) -> Optional[int]:
#         try:
#             invoice_data.pop('id', None)
            
#             nit_proveedor_actual = invoice_data.get('nit_proveedor')
#             proveedor_id = None
#             if nit_proveedor_actual:
#                 try:
#                     supplier = self.db.query(Supplier).filter(Supplier.nit == nit_proveedor_actual, Supplier.tenant_id == tenant_id).first()
#                     if supplier:
#                         proveedor_id = supplier.id
#                         logger.info(f"Proveedor '{supplier.name}' (NIT: {nit_proveedor_actual}) encontrado en la tabla 'suppliers'. ID: {proveedor_id}")
#                     else:
#                         logger.info(f"Proveedor con NIT '{nit_proveedor_actual}' NO encontrado en la tabla 'suppliers' para tenant '{tenant_id}'.")
#                 except OperationalError as e:
#                     logger.error(f"Error de conexión/operación al consultar tabla 'suppliers': {e}", exc_info=True)
#                     logger.warning("Factura se guardará sin proveedor_id debido a error de DB en consulta de proveedores.")
#                 except Exception as e:
#                     logger.error(f"Error inesperado al buscar proveedor en tabla 'suppliers': {e}", exc_info=True)
#                     logger.warning("Factura se guardará sin proveedor_id debido a error al buscar proveedor.")
            
#             invoice_data['proveedor_id'] = proveedor_id
            
#             if proveedor_id is None:
#                 invoice_data['revisada_manualmente'] = False
#                 invoice_data['tipo_documento_dian'] = invoice_data.get('tipo_documento_dian', 'Por revisar') 
#             else:
#                 pass 

#             new_invoice = Factura(**{k: v for k, v in invoice_data.items() if k != 'items'}, tenant_id=tenant_id)
#             self.db.add(new_invoice)
#             self.db.flush() 

#             for item_data in items_data:
#                 item_data.pop('id', None)
#                 new_item = ItemFactura(factura_id=new_invoice.id, **item_data, tenant_id=tenant_id)
#                 self.db.add(new_item)
#             logger.info(f"Factura {new_invoice.numero_factura} agregada a la sesión para tenant '{tenant_id}'. Proveedor ID: {new_invoice.proveedor_id}. Tipo Documento DIAN: {new_invoice.tipo_documento_dian}")
#             return new_invoice.id 
#         except IntegrityError as e:
#             self.db.rollback()
#             logger.error(f"Error de integridad al crear factura (posible duplicado de CUFE/Número): {e}", exc_info=True)
#             return None
#         except DataError as e:
#             self.db.rollback()
#             logger.error(f"DataError al crear factura: {e}", exc_info=True)
#             if 'contenido_pdf_binario' in invoice_data and ("Data too long for column" in str(e) or "Incorrect string value" in str(e)):
#                 logger.warning(f"Reintentando create_invoice sin contenido binario debido a error de tamaño/codificación.")
#                 invoice_data['contenido_pdf_binario'] = None
#                 return self.create_invoice(invoice_data, items_data, tenant_id)
#             return None
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error inesperado al crear factura: {e}", exc_info=True)
#             return None
    
#     def get_invoices(
#         self,
#         tenant_id: str, 
#         skip: int = 0,
#         limit: int = 100,
#         numero_factura: Optional[str] = None,
#         nit_proveedor: Optional[str] = None,
#         nombre_proveedor: Optional[str] = None,
#         fecha_desde: Optional[date] = None,
#         fecha_hasta: Optional[date] = None,
#         monto_total_min: Optional[float] = None,
#         monto_total_max: Optional[float] = None,
#         tipo_documento_dian: Optional[str] = None, 
#         revisada_manualmente: Optional[bool] = None,
#         usuario_id: Optional[int] = None
#     ) -> List[Factura]:
#         query = self.db.query(Factura).filter(Factura.tenant_id == tenant_id)
#         if numero_factura:
#             query = query.filter(Factura.numero_factura.ilike(f"%{numero_factura}%"))
#         if nit_proveedor:
#             query = query.filter(Factura.nit_proveedor == nit_proveedor)
#         if nombre_proveedor:
#             query = query.filter(Factura.nombre_proveedor.ilike(f"%{nombre_proveedor}%"))
#         if fecha_desde:
#             query = query.filter(Factura.fecha_emision >= fecha_desde)
#         if fecha_hasta:
#             query = query.filter(Factura.fecha_emision <= fecha_hasta)
#         if monto_total_min:
#             query = query.filter(Factura.monto_total >= monto_total_min)
#         if monto_total_max:
#             query = query.filter(Factura.monto_total <= monto_total_max)
#         if tipo_documento_dian: 
#             query = query.filter(Factura.tipo_documento_dian == tipo_documento_dian) 
#         if revisada_manualmente is not None:
#             query = query.filter(Factura.revisada_manualmente == revisada_manualmente)
#         if usuario_id:
#             query = query.filter(Factura.usuario_id == usuario_id)
#         return query.offset(skip).limit(limit).all()

#     @audit_log
#     def update_invoice(self, tenant_id: str, invoice_id: int, update_data: Dict[str, Any], items_data: Optional[List[Dict[str, Any]]] = None) -> Optional[int]: # <-- tenant_id al inicio
#         invoice = self.db.query(Factura).filter(Factura.id == invoice_id, Factura.tenant_id == tenant_id).first()
#         if not invoice:
#             logger.warning(f"Intento de actualizar factura con ID {invoice_id} fallido: Factura no encontrada o no pertenece a su inquilino.")
#             return None

#         try:
#             for key, value in update_data.items():
#                 if hasattr(invoice, key) and key not in ['id', 'items', 'tenant_id']:
#                     setattr(invoice, key, value)
            
#             if 'nit_proveedor' in update_data or invoice.proveedor_id is None:
#                 nit_proveedor_actual = update_data.get('nit_proveedor', invoice.nit_proveedor)
#                 if nit_proveedor_actual:
#                     supplier = self.db.query(Supplier).filter(Supplier.nit == nit_proveedor_actual, Supplier.tenant_id == tenant_id).first()
#                     if supplier:
#                         invoice.proveedor_id = supplier.id
#                         logger.info(f"Proveedor '{supplier.name}' (NIT: {nit_proveedor_actual}) re-asociado en la tabla 'suppliers'. ID: {supplier.id}")
#                     else:
#                         invoice.proveedor_id = None
#                         logger.info(f"Proveedor con NIT '{nit_proveedor_actual}' NO encontrado en la tabla 'suppliers' para tenant '{tenant_id}' durante actualización.")
#                 else:
#                     invoice.proveedor_id = None
            
#             if 'tipo_documento_dian' in update_data:
#                 invoice.tipo_documento_dian = update_data['tipo_documento_dian']

#             if items_data is not None:
#                 self.db.query(ItemFactura).filter(ItemFactura.factura_id == invoice.id, ItemFactura.tenant_id == tenant_id).delete()
#                 self.db.flush() 
#                 for item_data in items_data:
#                     item_data.pop('id', None) 
#                     new_item = ItemFactura(factura_id=invoice.id, **item_data, tenant_id=tenant_id)
#                     self.db.add(new_item)
#             self.db.flush() 
#             logger.info(f"Factura con ID {invoice_id} actualizada exitosamente para tenant '{tenant_id}'. Tipo Documento DIAN: {invoice.tipo_documento_dian}")
#             return invoice.id
#         except IntegrityError as e:
#             self.db.rollback()
#             logger.error(f"Error de integridad al actualizar factura con ID {invoice_id}: {e}", exc_info=True)
#             return None
#         except DataError as e:
#             self.db.rollback()
#             logger.error(f"DataError al actualizar factura: {e}", exc_info=True)
#             if 'contenido_pdf_binario' in update_data and ("Data too long for column" in str(e) or "Incorrect string value" in str(e)):
#                 logger.warning(f"Reintentando update_invoice sin contenido binario debido a error de tamaño/codificación.")
#                 update_data['contenido_pdf_binario'] = None
#                 return self.update_invoice(tenant_id, invoice_id, update_data, items_data) 
#             raise 
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error inesperado al actualizar factura con ID {invoice_id}: {e}", exc_info=True)
#             return None
    
#     @audit_log
#     def delete_invoice(self, tenant_id: str, invoice_id: int) -> bool: # <-- tenant_id al inicio
#         invoice = self.db.query(Factura).filter(Factura.id == invoice_id, Factura.tenant_id == tenant_id).first()
#         if not invoice:
#             logger.warning(f"Intento de eliminar factura con ID {invoice_id} fallido: Factura no encontrada o no pertenece a su inquilino.")
#             return False
#         try:
#             self.db.delete(invoice)
#             logger.info(f"Factura con ID {invoice_id} eliminada exitosamente para tenant '{tenant_id}'.")
#             return True
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error al eliminar factura con ID {invoice_id}: {e}", exc_info=True)
#             return False

# class ItemFacturaCRUD:
#     def __init__(self, db: Session):
#         self.db = db
    
#     @audit_log
#     def create_item_factura(self, factura_id: int, descripcion: str, cantidad: float, valor_unitario: float, valor_total: float, tenant_id: str) -> Optional[int]:
#         try:
#             db_item = ItemFactura(
#                 factura_id=factura_id,
#                 descripcion=descripcion,
#                 cantidad=cantidad,
#                 valor_unitario=valor_unitario,
#                 valor_total=valor_total,
#                 tenant_id=tenant_id
#             )
#             self.db.add(db_item)
#             self.db.flush() 
#             logger.info(f"Ítem de factura {db_item.id} creado para factura {factura_id} y tenant '{tenant_id}'.")
#             return db_item.id 
#         except IntegrityError as e:
#             self.db.rollback()
#             logger.error(f"Error de integridad al crear ítem de factura para factura {factura_id}: {e}", exc_info=True)
#             return None
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error inesperado al crear ítem de factura para factura {factura_id}: {e}", exc_info=True)
#             return None
    
#     def get_item_factura(self, item_id: int, factura_id: int, tenant_id: str) -> Optional[ItemFactura]:
#         return self.db.query(ItemFactura).filter(
#             ItemFactura.id == item_id,
#             ItemFactura.factura_id == factura_id,
#             ItemFactura.tenant_id == tenant_id
#         ).first()
    
#     def get_items_by_factura(self, factura_id: int, tenant_id: str, skip: int = 0, limit: int = 100) -> List[ItemFactura]:
#         return self.db.query(ItemFactura).filter(
#             ItemFactura.factura_id == factura_id,
#             ItemFactura.tenant_id == tenant_id
#         ).offset(skip).limit(limit).all()
    
#     @audit_log
#     def update_item_factura(self, tenant_id: str, item_id: int, factura_id: int, update_data: Any) -> Optional[int]: # <-- tenant_id al inicio
#         db_item = self.get_item_factura(item_id, factura_id, tenant_id)
#         if not db_item:
#             logger.warning(f"Intento de actualizar ítem {item_id} de factura {factura_id} fallido: Ítem no encontrado o no pertenece a su inquilino.")
#             return None
#         try:
#             for key, value in update_data.items():
#                 if hasattr(db_item, key) and key not in ['id', 'factura_id', 'tenant_id']:
#                     setattr(db_item, key, value)
#             self.db.flush() 
#             logger.info(f"Ítem de factura {item_id} para factura {factura_id} actualizado exitosamente para tenant '{tenant_id}'.")
#             return db_item.id 
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error al actualizar ítem {item_id} de factura {factura_id}: {e}", exc_info=True)
#             return None
    
#     @audit_log
#     def delete_item_factura(self, tenant_id: str, item_id: int, factura_id: int) -> bool: # <-- tenant_id al inicio
#         db_item = self.get_item_factura(item_id, factura_id, tenant_id)
#         if not db_item:
#             logger.warning(f"Intento de eliminar ítem {item_id} de factura {factura_id} fallido: Ítem no encontrado o no pertenece a su inquilino.")
#             return False
#         try:
#             self.db.delete(db_item)
#             logger.info(f"Ítem de factura {item_id} para factura {factura_id} eliminado exitosamente para tenant '{tenant_id}'.")
#             return True
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error al eliminar ítem {item_id} de factura {factura_id}: {e}", exc_info=True)
#             return False

# class FacturaAuditCRUD:
#     def __init__(self, db: Session):
#         self.db = db

#     def create_factura_audit(self, audit_data: dict, tenant_id: str):
#         db_audit = FacturaAudit(**audit_data, tenant_id=tenant_id)
#         self.db.add(db_audit)
#         self.db.commit()
#         self.db.refresh(db_audit)
#         return db_audit
    
#     def get_factura_audits(self, factura_id: int, tenant_id: str):
#         return self.db.query(FacturaAudit).filter(FacturaAudit.id_factura == factura_id, FacturaAudit.tenant_id == tenant_id).all()

# class ItemFacturaAuditCRUD:
#     def __init__(self, db: Session):
#         self.db = db

#     def create_item_factura_audit(self, audit_data: dict, tenant_id: str):
#         db_audit = ItemFacturaAudit(**audit_data, tenant_id=tenant_id)
#         self.db.add(db_audit)
#         self.db.commit()
#         self.db.refresh(db_audit)
#         return db_audit

#     def get_item_factura_audits(self, item_factura_id: int, tenant_id: str):
#         return self.db.query(ItemFacturaAudit).filter(ItemFacturaAudit.id_item_factura == item_factura_id, ItemFacturaAudit.tenant_id == tenant_id).all()






# import logging
# from sqlalchemy.orm import Session
# from sqlalchemy import text, inspect
# from sqlalchemy.exc import IntegrityError, OperationalError, DataError
# from sqlalchemy.orm.exc import NoResultFound, MultipleResultsFound
# import json
# from datetime import datetime, date
# from typing import List, Dict, Any, Optional
# from database.models import Factura, ItemFactura, Usuario, FacturaAudit, ItemFacturaAudit, Supplier

# logger = logging.getLogger(__name__)

# CURRENT_AUDIT_USER_ID = None

# def set_current_audit_user_id(user_id: int):
#     global CURRENT_AUDIT_USER_ID
#     CURRENT_AUDIT_USER_ID = user_id

# def audit_log(func):
#     def wrapper(self, *args, **kwargs):
#         session = self.db
#         obj = None
#         old_data = None
#         object_type = None
#         object_id_for_audit = None 

#         if func.__name__ in ['update_invoice', 'delete_invoice']:
#             invoice_id = args[0]
#             obj = session.query(Factura).filter(Factura.id == invoice_id).first()
#             object_type = 'Factura'
#             object_id_for_audit = invoice_id
#             if not obj:
#                 logger.warning(f"Objeto Factura no encontrado para auditoría en {func.__name__} con ID {invoice_id}")
#                 return func(self, *args, **kwargs)
#         elif func.__name__ in ['update_item_factura', 'delete_item_factura']:
#             item_id = args[0]
#             factura_id = args[1] 
#             obj = session.query(ItemFactura).filter(ItemFactura.id == item_id, ItemFactura.factura_id == factura_id).first()
#             object_type = 'ItemFactura'
#             object_id_for_audit = item_id
#             if not obj:
#                 logger.warning(f"Objeto ItemFactura no encontrado para auditoría en {func.__name__} con ID {item_id} y FacturaID {factura_id}")
#                 return func(self, *args, **kwargs)

#         if obj:
#             exclude_cols = ['contenido_pdf_binario'] 
#             if object_type == 'ItemFactura':
#                 obj_dict = {c.name: getattr(obj, c.name) for c in obj.__table__.columns if c.name not in exclude_cols}
#             else:
#                 obj_dict = {c.name: getattr(obj, c.name) for c in obj.__table__.columns if c.name not in exclude_cols}
#             for k, v in obj_dict.items():
#                 if isinstance(v, (datetime, date)):
#                     obj_dict[k] = v.isoformat()
#             old_data = json.dumps(obj_dict, default=str)
#             logger.debug(f"Datos anteriores para auditoría ({func.__name__}, {object_type}): {old_data}")
        
#         try:
#             result = func(self, *args, **kwargs)
#             session.commit() 
            
#             if func.__name__ == 'create_invoice':
#                 new_invoice_id = result
#                 if new_invoice_id:
#                     new_obj = session.query(Factura).filter(Factura.id == new_invoice_id).first()
#                     if new_obj:
#                         audit_entry = FacturaAudit(
#                             id_factura=new_obj.id,
#                             procesado_en=new_obj.procesado_en,
#                             ruta_archivo_original=new_obj.ruta_archivo_original,
#                             asunto_correo=new_obj.asunto_correo,
#                             remitente_correo=new_obj.remitente_correo,
#                             correo_cliente_asociado=new_obj.correo_cliente_asociado,
#                             cufe=new_obj.cufe,
#                             numero_factura=new_obj.numero_factura,
#                             fecha_emision=new_obj.fecha_emision,
#                             hora_emision=new_obj.hora_emision,
#                             monto_subtotal=new_obj.monto_subtotal,
#                             monto_impuesto=new_obj.monto_impuesto,
#                             monto_total=new_obj.monto_total,
#                             moneda=new_obj.moneda,
#                             nombre_proveedor=new_obj.nombre_proveedor,
#                             nit_proveedor=new_obj.nit_proveedor,
#                             email_proveedor=new_obj.email_proveedor,
#                             nombre_cliente=new_obj.nombre_cliente,
#                             nit_cliente=new_obj.nit_cliente,
#                             fecha_vencimiento=new_obj.fecha_vencimiento,
#                             metodo_pago=new_obj.metodo_pago,
#                             texto_crudo_xml=new_obj.texto_crudo_xml,
#                             tipo_documento_dian=new_obj.tipo_documento_dian, # AQUI SE CAMBIA
#                             revisada_manualmente=new_obj.revisada_manualmente,
#                             usuario_id_asociado_factura=new_obj.usuario_id,
#                             tipo_operacion='INSERT',
#                             usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                             datos_anteriores=None 
#                         )
#                         session.add(audit_entry)
#                         for item in new_obj.items:
#                             item_audit_entry = ItemFacturaAudit(
#                                 id_item_factura=item.id,
#                                 factura_id=item.factura_id,
#                                 descripcion=item.descripcion,
#                                 cantidad=item.cantidad,
#                                 valor_unitario=item.valor_unitario,
#                                 valor_total=item.valor_total,
#                                 tipo_operacion='INSERT',
#                                 usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                                 datos_anteriores=None
#                             )
#                             session.add(item_audit_entry)
#                         session.commit()
            
#             elif func.__name__ == 'update_invoice':
#                 updated_invoice_id = result
#                 if updated_invoice_id:
#                     updated_obj = session.query(Factura).filter(Factura.id == updated_invoice_id).first()
#                     if updated_obj:
#                         audit_entry = FacturaAudit(
#                             id_factura=updated_obj.id,
#                             procesado_en=updated_obj.procesado_en,
#                             ruta_archivo_original=updated_obj.ruta_archivo_original,
#                             asunto_correo=updated_obj.asunto_correo,
#                             remitente_correo=updated_obj.remitente_correo,
#                             correo_cliente_asociado=updated_obj.correo_cliente_asociado,
#                             cufe=updated_obj.cufe,
#                             numero_factura=updated_obj.numero_factura,
#                             fecha_emision=updated_obj.fecha_emision,
#                             hora_emision=updated_obj.hora_emision,
#                             monto_subtotal=updated_obj.monto_subtotal,
#                             monto_impuesto=updated_obj.monto_impuesto,
#                             monto_total=updated_obj.monto_total,
#                             moneda=updated_obj.moneda,
#                             nombre_proveedor=updated_obj.nombre_proveedor,
#                             nit_proveedor=updated_obj.nit_proveedor,
#                             email_proveedor=updated_obj.email_proveedor,
#                             nombre_cliente=updated_obj.nombre_cliente,
#                             nit_cliente=updated_obj.nit_cliente,
#                             fecha_vencimiento=updated_obj.fecha_vencimiento,
#                             metodo_pago=updated_obj.metodo_pago,
#                             texto_crudo_xml=updated_obj.texto_crudo_xml,
#                             tipo_documento_dian=updated_obj.tipo_documento_dian, # AQUI SE CAMBIA
#                             revisada_manualmente=updated_obj.revisada_manualmente,
#                             usuario_id_asociado_factura=updated_obj.usuario_id,
#                             tipo_operacion='UPDATE',
#                             usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                             datos_anteriores=old_data
#                         )
#                         session.add(audit_entry)
#                         session.commit()
#             elif func.__name__ == 'delete_invoice':
#                 deleted_invoice_id = object_id_for_audit 
#                 audit_entry = FacturaAudit(
#                     id_factura=deleted_invoice_id,
#                     tipo_operacion='DELETE',
#                     usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                     datos_anteriores=old_data
#                 )
#                 session.add(audit_entry)
#                 logger.warning("Auditoría de ítems eliminados en delete_invoice: Considerar triggers de DB o capturar ítems antes de la eliminación.")
#                 session.commit()
#             elif func.__name__ == 'create_item_factura':
#                 new_item_id = result
#                 if new_item_id:
#                     new_item_obj = session.query(ItemFactura).filter(ItemFactura.id == new_item_id).first()
#                     if new_item_obj:
#                         item_audit_entry = ItemFacturaAudit(
#                             id_item_factura=new_item_obj.id,
#                             factura_id=new_item_obj.factura_id,
#                             descripcion=new_item_obj.descripcion,
#                             cantidad=new_item_obj.cantidad,
#                             valor_unitario=new_item_obj.valor_unitario,
#                             valor_total=new_item_obj.valor_total,
#                             tipo_operacion='INSERT',
#                             usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                             datos_anteriores=None
#                         )
#                         session.add(item_audit_entry)
#                         session.commit()
#             elif func.__name__ == 'update_item_factura':
#                 updated_item_id = result 
#                 if updated_item_id:
#                     updated_item_obj = session.query(ItemFactura).filter(ItemFactura.id == updated_item_id).first()
#                     if updated_item_obj:
#                         item_audit_entry = ItemFacturaAudit(
#                             id_item_factura=updated_item_obj.id,
#                             factura_id=updated_item_obj.factura_id,
#                             descripcion=updated_item_obj.descripcion,
#                             cantidad=updated_item_obj.cantidad,
#                             valor_unitario=updated_item_obj.valor_unitario,
#                             valor_total=updated_item_obj.valor_total,
#                             tipo_operacion='UPDATE',
#                             usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                             datos_anteriores=old_data
#                         )
#                         session.add(item_audit_entry)
#                         session.commit()
#             elif func.__name__ == 'delete_item_factura':
#                 deleted_item_id = object_id_for_audit
#                 item_audit_entry = ItemFacturaAudit(
#                     id_item_factura=deleted_item_id,
#                     factura_id=args[1], 
#                     tipo_operacion='DELETE',
#                     usuario_auditoria_id=CURRENT_AUDIT_USER_ID,
#                     datos_anteriores=old_data
#                 )
#                 session.add(item_audit_entry)
#                 session.commit()

#             return result 
#         except (IntegrityError, DataError, OperationalError) as e:
#             session.rollback()
#             logger.error(f"Error de base de datos en {func.__name__}: {e}", exc_info=True)
#             if "Data too long for column" in str(e) or "Incorrect string value" in str(e):
#                 logger.warning(f"Reintentando {func.__name__} sin contenido binario debido a error de tamaño/codificación.")
#                 if func.__name__ == 'create_invoice':
#                     invoice_data_retry = args[0].copy()
#                     if 'contenido_pdf_binario' in invoice_data_retry:
#                         invoice_data_retry['contenido_pdf_binario'] = None
#                     return func(self, invoice_data_retry, *args[1:])
#                 elif func.__name__ == 'update_invoice':
#                     update_data_retry = args[1].copy()
#                     if 'contenido_pdf_binario' in update_data_retry:
#                         update_data_retry['contenido_pdf_binario'] = None
#                     return func(self, args[0], update_data_retry, *args[2:]) 
#             raise 
#         except Exception as e:
#             session.rollback()
#             logger.error(f"Error inesperado durante {func.__name__}: {e}", exc_info=True)
#             raise
#     return wrapper

# class UserCRUD:
#     def __init__(self, db: Session):
#         self.db = db
    
#     def create_user(self, email: str, password: str, email_account_password_encrypted: Optional[str] = None) -> Optional[Usuario]:
#         try:
#             new_user = Usuario(correo=email)
#             new_user.contrasena = password
#             if email_account_password_encrypted:
#                 new_user.email_account_password_encrypted = email_account_password_encrypted
#             self.db.add(new_user)
#             self.db.commit()
#             self.db.refresh(new_user)
#             logger.info(f"Usuario '{email}' creado exitosamente.")
#             return new_user
#         except IntegrityError as e:
#             self.db.rollback()
#             logger.error(f"Error al crear usuario '{email}': Ya existe un usuario con ese correo.", exc_info=True)
#             return None
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error inesperado al crear usuario '{email}': {e}", exc_info=True)
#             return None
    
#     def get_user_by_email(self, email: str) -> Optional[Usuario]:
#         return self.db.query(Usuario).filter(Usuario.correo == email).first()
    
#     def get_user_by_id(self, user_id: int) -> Optional[Usuario]:
#         return self.db.query(Usuario).filter(Usuario.id == user_id).first()
    
#     def get_users(self, skip: int = 0, limit: int = 100) -> List[Usuario]:
#         return self.db.query(Usuario).offset(skip).limit(limit).all()
    
#     def update_user(self, user_id: int, **update_data: Any) -> Optional[Usuario]:
#         user = self.get_user_by_id(user_id)
#         if not user:
#             logger.warning(f"Intento de actualizar usuario con ID {user_id} fallido: Usuario no encontrado.")
#             return None
#         try:
#             for key, value in update_data.items():
#                 if hasattr(user, key):
#                     setattr(user, key, value)
#             self.db.commit()
#             self.db.refresh(user)
#             logger.info(f"Usuario con ID {user_id} actualizado exitosamente.")
#             return user
#         except IntegrityError as e:
#             self.db.rollback()
#             logger.error(f"Error al actualizar usuario con ID {user_id}: Posible duplicado de correo o problema de integridad.", exc_info=True)
#             return None
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error inesperado al actualizar usuario con ID {user_id}: {e}", exc_info=True)
#             return None
    
#     def delete_user(self, user_id: int) -> bool:
#         user = self.get_user_by_id(user_id)
#         if not user:
#             logger.warning(f"Intento de eliminar usuario con ID {user_id} fallido: Usuario no encontrado.")
#             return False
#         try:
#             self.db.delete(user)
#             self.db.commit()
#             logger.info(f"Usuario con ID {user_id} eliminado exitosamente.")
#             return True
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error al eliminar usuario con ID {user_id}: {e}", exc_info=True)
#             return False

# class InvoiceCRUD:
#     def __init__(self, db: Session):
#         self.db = db

#     @audit_log
#     def create_invoice(self, invoice_data: Dict[str, Any], items_data: List[Dict[str, Any]]) -> Optional[int]:
#         try:
#             invoice_data.pop('id', None)
            
#             nit_proveedor_actual = invoice_data.get('nit_proveedor')
#             proveedor_id = None
#             if nit_proveedor_actual:
#                 try:
#                     supplier = self.db.query(Supplier).filter(Supplier.nit == nit_proveedor_actual).first()
#                     if supplier:
#                         proveedor_id = supplier.id
#                         logger.info(f"Proveedor '{supplier.name}' (NIT: {nit_proveedor_actual}) encontrado en la tabla 'suppliers'. ID: {proveedor_id}")
#                     else:
#                         logger.info(f"Proveedor con NIT '{nit_proveedor_actual}' NO encontrado en la tabla 'suppliers'.")
#                 except OperationalError as e:
#                     logger.error(f"Error de conexión/operación al consultar tabla 'suppliers': {e}", exc_info=True)
#                     logger.warning("Factura se guardará sin proveedor_id debido a error de DB en consulta de proveedores.")
#                 except Exception as e:
#                     logger.error(f"Error inesperado al buscar proveedor en tabla 'suppliers': {e}", exc_info=True)
#                     logger.warning("Factura se guardará sin proveedor_id debido a error al buscar proveedor.")
            
#             invoice_data['proveedor_id'] = proveedor_id
            
#             if proveedor_id is None:
#                 invoice_data['revisada_manualmente'] = False
#                 invoice_data['tipo_documento_dian'] = invoice_data.get('tipo_documento_dian', 'Por revisar') # Aseguramos que se use el valor del parser
#             else:
#                 pass 

#             new_invoice = Factura(**{k: v for k, v in invoice_data.items() if k != 'items'})
#             self.db.add(new_invoice)
#             self.db.flush() 

#             for item_data in items_data:
#                 item_data.pop('id', None)
#                 new_item = ItemFactura(factura_id=new_invoice.id, **item_data)
#                 self.db.add(new_item)
#             logger.info(f"Factura {new_invoice.numero_factura} agregada a la sesión. Proveedor ID: {new_invoice.proveedor_id}. Tipo Documento DIAN: {new_invoice.tipo_documento_dian}")
#             return new_invoice.id 
#         except IntegrityError as e:
#             self.db.rollback()
#             logger.error(f"Error de integridad al crear factura (posible duplicado de CUFE/Número): {e}", exc_info=True)
#             return None
#         except DataError as e:
#             self.db.rollback()
#             logger.error(f"DataError al crear factura: {e}", exc_info=True)
#             if 'contenido_pdf_binario' in invoice_data and ("Data too long for column" in str(e) or "Incorrect string value" in str(e)):
#                 logger.warning(f"Reintentando create_invoice sin contenido binario debido a error de tamaño/codificación.")
#                 invoice_data['contenido_pdf_binario'] = None
#                 return self.create_invoice(invoice_data, items_data)
#             return None
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error inesperado al crear factura: {e}", exc_info=True)
#             return None
    
#     def get_invoices(
#         self,
#         skip: int = 0,
#         limit: int = 100,
#         numero_factura: Optional[str] = None,
#         nit_proveedor: Optional[str] = None,
#         nombre_proveedor: Optional[str] = None,
#         fecha_desde: Optional[date] = None,
#         fecha_hasta: Optional[date] = None,
#         monto_total_min: Optional[float] = None,
#         monto_total_max: Optional[float] = None,
#         tipo_documento_dian: Optional[str] = None, # AQUI SE CAMBIA
#         revisada_manualmente: Optional[bool] = None,
#         usuario_id: Optional[int] = None
#     ) -> List[Factura]:
#         query = self.db.query(Factura)
#         if numero_factura:
#             query = query.filter(Factura.numero_factura.ilike(f"%{numero_factura}%"))
#         if nit_proveedor:
#             query = query.filter(Factura.nit_proveedor == nit_proveedor)
#         if nombre_proveedor:
#             query = query.filter(Factura.nombre_proveedor.ilike(f"%{nombre_proveedor}%"))
#         if fecha_desde:
#             query = query.filter(Factura.fecha_emision >= fecha_desde)
#         if fecha_hasta:
#             query = query.filter(Factura.fecha_emision <= fecha_hasta)
#         if monto_total_min:
#             query = query.filter(Factura.monto_total >= monto_total_min)
#         if monto_total_max:
#             query = query.filter(Factura.monto_total <= monto_total_max)
#         if tipo_documento_dian: # AQUI SE CAMBIA
#             query = query.filter(Factura.tipo_documento_dian == tipo_documento_dian) # AQUI SE CAMBIA
#         if revisada_manualmente is not None:
#             query = query.filter(Factura.revisada_manualmente == revisada_manualmente)
#         if usuario_id:
#             query = query.filter(Factura.usuario_id == usuario_id)
#         return query.offset(skip).limit(limit).all()

#     @audit_log
#     def update_invoice(self, invoice_id: int, update_data: Dict[str, Any], items_data: Optional[List[Dict[str, Any]]] = None) -> Optional[int]:
#         invoice = self.db.query(Factura).filter(Factura.id == invoice_id).first()
#         if not invoice:
#             logger.warning(f"Intento de actualizar factura con ID {invoice_id} fallido: Factura no encontrada.")
#             return None

#         try:
#             for key, value in update_data.items():
#                 if hasattr(invoice, key) and key not in ['id', 'items']: 
#                     setattr(invoice, key, value)
            
#             # Si se actualiza el nit_proveedor o si no había proveedor_id, reevaluamos
#             if 'nit_proveedor' in update_data or invoice.proveedor_id is None:
#                 nit_proveedor_actual = update_data.get('nit_proveedor', invoice.nit_proveedor)
#                 if nit_proveedor_actual:
#                     supplier = self.db.query(Supplier).filter(Supplier.nit == nit_proveedor_actual).first()
#                     if supplier:
#                         invoice.proveedor_id = supplier.id
#                         logger.info(f"Proveedor '{supplier.name}' (NIT: {nit_proveedor_actual}) re-asociado en la tabla 'suppliers'. ID: {supplier.id}")
#                     else:
#                         invoice.proveedor_id = None
#                         logger.info(f"Proveedor con NIT '{nit_proveedor_actual}' NO encontrado en la tabla 'suppliers' durante actualización.")
#                 else:
#                     invoice.proveedor_id = None
            
#             # Asegura que tipo_documento_dian se actualice si está presente en update_data
#             if 'tipo_documento_dian' in update_data:
#                 invoice.tipo_documento_dian = update_data['tipo_documento_dian']

#             if items_data is not None:
#                 for item in list(invoice.items): 
#                     self.db.delete(item)
#                 invoice.items = [] 
#                 self.db.flush()
#                 for item_data in items_data:
#                     item_data.pop('id', None) 
#                     new_item = ItemFactura(factura_id=invoice.id, **item_data)
#                     self.db.add(new_item)
#             self.db.flush() 
#             logger.info(f"Factura con ID {invoice_id} actualizada exitosamente. Tipo Documento DIAN: {invoice.tipo_documento_dian}")
#             return invoice.id
#         except IntegrityError as e:
#             self.db.rollback()
#             logger.error(f"Error de integridad al actualizar factura con ID {invoice_id}: {e}", exc_info=True)
#             return None
#         except DataError as e:
#             self.db.rollback()
#             logger.error(f"DataError al actualizar factura: {e}", exc_info=True)
#             if 'contenido_pdf_binario' in update_data and ("Data too long for column" in str(e) or "Incorrect string value" in str(e)):
#                 logger.warning(f"Reintentando update_invoice sin contenido binario debido a error de tamaño/codificación.")
#                 update_data['contenido_pdf_binario'] = None
#                 return self.update_invoice(invoice_id, update_data, items_data)
#             return None
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error inesperado al actualizar factura con ID {invoice_id}: {e}", exc_info=True)
#             return None
    
#     @audit_log
#     def delete_invoice(self, invoice_id: int) -> bool:
#         invoice = self.db.query(Factura).filter(Factura.id == invoice_id).first()
#         if not invoice:
#             logger.warning(f"Intento de eliminar factura con ID {invoice_id} fallido: Factura no encontrada.")
#             return False
#         try:
#             self.db.delete(invoice)
#             logger.info(f"Factura con ID {invoice_id} eliminada exitosamente.")
#             return True
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error al eliminar factura con ID {invoice_id}: {e}", exc_info=True)
#             return False

# class ItemFacturaCRUD:
#     def __init__(self, db: Session):
#         self.db = db
    
#     @audit_log
#     def create_item_factura(self, factura_id: int, descripcion: str, cantidad: float, valor_unitario: float, valor_total: float) -> Optional[int]:
#         try:
#             db_item = ItemFactura(
#                 factura_id=factura_id,
#                 descripcion=descripcion,
#                 cantidad=cantidad,
#                 valor_unitario=valor_unitario,
#                 valor_total=valor_total
#             )
#             self.db.add(db_item)
#             self.db.flush() 
#             logger.info(f"Ítem de factura {db_item.id} creado para factura {factura_id}.")
#             return db_item.id 
#         except IntegrityError as e:
#             self.db.rollback()
#             logger.error(f"Error de integridad al crear ítem de factura para factura {factura_id}: {e}", exc_info=True)
#             return None
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error inesperado al crear ítem de factura para factura {factura_id}: {e}", exc_info=True)
#             return None
    
#     def get_item_factura(self, item_id: int, factura_id: int) -> Optional[ItemFactura]:
#         return self.db.query(ItemFactura).filter(
#             ItemFactura.id == item_id,
#             ItemFactura.factura_id == factura_id
#         ).first()
    
#     def get_items_by_factura(self, factura_id: int, skip: int = 0, limit: int = 100) -> List[ItemFactura]:
#         return self.db.query(ItemFactura).filter(
#             ItemFactura.factura_id == factura_id
#         ).offset(skip).limit(limit).all()
    
#     @audit_log
#     def update_item_factura(self, item_id: int, factura_id: int, **update_data: Any) -> Optional[int]:
#         db_item = self.get_item_factura(item_id, factura_id)
#         if not db_item:
#             logger.warning(f"Intento de actualizar ítem {item_id} de factura {factura_id} fallido: Ítem no encontrado.")
#             return None
#         try:
#             for key, value in update_data.items():
#                 if hasattr(db_item, key) and key != 'id' and key != 'factura_id':
#                     setattr(db_item, key, value)
#             self.db.flush() 
#             logger.info(f"Ítem de factura {item_id} para factura {factura_id} actualizado exitosamente.")
#             return db_item.id 
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error al actualizar ítem {item_id} de factura {factura_id}: {e}", exc_info=True)
#             return None
    
#     @audit_log
#     def delete_item_factura(self, item_id: int, factura_id: int) -> bool:
#         db_item = self.get_item_factura(item_id, factura_id)
#         if not db_item:
#             logger.warning(f"Intento de eliminar ítem {item_id} de factura {factura_id} fallido: Ítem no encontrado.")
#             return False
#         try:
#             self.db.delete(db_item)
#             logger.info(f"Ítem de factura {item_id} para factura {factura_id} eliminado exitosamente.")
#             return True
#         except Exception as e:
#             self.db.rollback()
#             logger.error(f"Error al eliminar ítem {item_id} de factura {factura_id}: {e}", exc_info=True)
#             return False
