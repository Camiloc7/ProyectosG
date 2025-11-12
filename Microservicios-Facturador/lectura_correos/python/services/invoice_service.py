import os
import zipfile
import io
import logging
import re
from typing import Dict, Any, Optional
from datetime import datetime, date
from database.models import SessionLocal, Usuario 
from database.crud import InvoiceCRUD, UserCRUD, set_current_audit_tenant_id, set_current_audit_user_id 
from extraction.xml_parser import parse_invoice_xml, extract_nested_invoice_xml

logger = logging.getLogger(__name__)

class InvoiceService:
    def __init__(self):
        self.db_session = SessionLocal()
        self.invoice_crud = InvoiceCRUD(self.db_session)
        self.user_crud = UserCRUD(self.db_session)

    def __del__(self):
        try:
            if self.db_session.is_active:
                self.db_session.close()
        except Exception as e:
            logger.error(f"Error al cerrar la sesión de base de datos: {e}", exc_info=True)

    def _extract_from_email_body(self, body_content: str) -> Dict[str, Any]:
        extracted_data = {}
        body_content = body_content.replace('\r\n', '\n').replace('\r', '\n')
        patterns = {
            'nombre_proveedor': r'Empresa:\s*(.+)',
            'nit_proveedor': r'Identificación:\s*(\d{9,10})',
            'fecha_emision': r'Fecha:\s*(\d{4}-\d{2}-\d{2})',
            'numero_factura': r'Número:\s*([A-Za-z0-9\-\_]+)',
            'cufe': r'CUFE:\s*([a-f0-9]{64,128})'
        }
        for key, pattern in patterns.items():
            match = re.search(pattern, body_content, re.IGNORECASE)
            if match:
                value = match.group(1).strip()
                if key == 'fecha_emision':
                    try:
                        extracted_data[key] = datetime.strptime(value, '%Y-%m-%d').date()
                    except ValueError:
                        continue
                else:
                    extracted_data[key] = value
        return extracted_data

    def process_document(self, filename: str, file_binary_content: bytes, email_metadata: Dict[str, Any] = None, tenant_id: str = None) -> Optional[int]:
        email_metadata = email_metadata or {}
        
        if tenant_id is None:
            tenant_id = email_metadata.get("tenant_id")

        if tenant_id is None:
            logger.error(f"No se pudo determinar el tenant_id para el procesamiento de la factura '{filename}'. Saltando.")
            return None

        set_current_audit_tenant_id(tenant_id)
        
        extracted_invoice_data = {
            "procesado_en": datetime.now(),
            "ruta_archivo_original": filename,
            "cufe": None,
            "numero_factura": None,
            "fecha_emision": None,
            "hora_emision": None,
            "monto_subtotal": None,
            "monto_impuesto": None,
            "monto_total": None,
            "moneda": None,
            "nombre_proveedor": None,
            "nit_proveedor": None,
            "email_proveedor": None,
            "nombre_cliente": None,
            "nit_cliente": None,
            "fecha_vencimiento": None,
            "metodo_pago": None,
            "texto_crudo_xml": None,
            "contenido_pdf_binario": None,
            "usuario_id": None, 
            "items": [],
            "asunto_correo": email_metadata.get("subject", ""),
            "remitente_correo": email_metadata.get("from", ""),
            "correo_cliente_asociado": email_metadata.get("correo_cliente") or email_metadata.get("from", ""),
            "uid": email_metadata.get("uid"),
            # No añadir tenant_id aquí, se pasará como argumento separado al CRUD
            # "tenant_id": tenant_id 
        }

        xml_content_str = None
        pdf_binary_content = None

        if filename.lower().endswith('.zip'):
            try:
                with zipfile.ZipFile(io.BytesIO(file_binary_content), 'r') as zf:
                    for zinfo in zf.infolist():
                        with zf.open(zinfo.filename) as f:
                            inner_file_binary = f.read()
                            if zinfo.filename.lower().endswith('.xml'):
                                xml = extract_nested_invoice_xml(inner_file_binary)
                                if xml:
                                    xml_content_str = xml
                            elif zinfo.filename.lower().endswith('.pdf'):
                                pdf_binary_content = inner_file_binary
            except Exception as e:
                logger.error(f"Error procesando archivo ZIP {filename}: {e}", exc_info=True)
                return None
        elif filename.lower().endswith('.pdf'):
            pdf_binary_content = file_binary_content
        elif filename.lower().endswith('.xml'):
            try:
                xml_content_str = file_binary_content.decode('utf-8')
            except UnicodeDecodeError:
                logger.error(f"Error de decodificación Unicode para archivo XML {filename}.", exc_info=True)
                return None
        else:
            logger.warning(f"Tipo de archivo no soportado o desconocido: {filename}")
            return None
        
        parsed_xml_data = None
        if xml_content_str:
            try:
                parsed_xml_data = parse_invoice_xml(xml_content_str)
                if parsed_xml_data:
                    extracted_invoice_data.update(parsed_xml_data)
                    extracted_invoice_data['texto_crudo_xml'] = xml_content_str
            except Exception as e:
                logger.warning(f"Error al parsear XML de {filename}: {e}", exc_info=True)
        
        email_body_content = email_metadata.get("body")
        if email_body_content:
            extracted_from_body = self._extract_from_email_body(email_body_content)
            for key, value in extracted_from_body.items():
                if value is not None and not extracted_invoice_data.get(key): 
                    extracted_invoice_data[key] = value

        if pdf_binary_content:
            extracted_invoice_data['contenido_pdf_binario'] = pdf_binary_content
        
        if not extracted_invoice_data.get('numero_factura'):
            match = re.search(r'\b[A-Z0-9\-]{3,20}\b', extracted_invoice_data.get('asunto_correo', ''))
            if match:
                extracted_invoice_data['numero_factura'] = match.group(0).strip()
            else:
                extracted_invoice_data['numero_factura'] = extracted_invoice_data.get('uid') or f"TEMP_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        
        if not extracted_invoice_data.get('nit_proveedor'):
            match = re.search(r'\b\d{9,10}\b', extracted_invoice_data.get('asunto_correo', ''))
            if match:
                extracted_invoice_data['nit_proveedor'] = match.group(0)
        
        if not extracted_invoice_data.get('nombre_proveedor') and extracted_invoice_data.get('remitente_correo'):
            match_name = re.match(r'^(.*?)<.*>$', extracted_invoice_data['remitente_correo'])
            if match_name:
                extracted_invoice_data['nombre_proveedor'] = match_name.group(1).strip()
            else:
                extracted_invoice_data['nombre_proveedor'] = extracted_invoice_data['remitente_correo'].split('@')[0].replace('.', ' ').title()
        
        correo_cliente_asociado_final = extracted_invoice_data.get('correo_cliente_asociado')
        if correo_cliente_asociado_final:
            user_obj = self.user_crud.db.query(Usuario).filter(Usuario.correo == correo_cliente_asociado_final, Usuario.tenant_id == tenant_id).first()
            if user_obj:
                extracted_invoice_data['usuario_id'] = user_obj.id
                set_current_audit_user_id(user_obj.id)
            else:
                logger.warning(f"Usuario asociado '{correo_cliente_asociado_final}' no encontrado para tenant '{tenant_id}'. La factura se guardará sin usuario_id asociado.")

        items_to_save = extracted_invoice_data.pop('items', [])
        extracted_invoice_data.pop('uid', None)

        if not extracted_invoice_data.get('numero_factura') and not extracted_invoice_data.get('cufe'):
            logger.warning(f"Factura '{filename}' no tiene número de factura ni CUFE. No se guardará.")
            return None
        
        # Pasar tenant_id a create_invoice. Ahora invoice_data NO contiene tenant_id
        invoice_id = self.invoice_crud.create_invoice(extracted_invoice_data, items_to_save, tenant_id)
        
        if invoice_id:
            logger.info(f"Factura procesada y guardada con éxito. ID: {invoice_id}. Número: {extracted_invoice_data.get('numero_factura')}")
        else:
            logger.error(f"Fallo al guardar la factura para el archivo: {filename}. Revisa logs del CRUD para más detalles.")
        
        return invoice_id if invoice_id else None



# import os
# import zipfile
# import io
# import logging
# import re
# from typing import Dict, Any, Optional
# from datetime import datetime, date
# from database.models import SessionLocal
# from database.crud import InvoiceCRUD, UserCRUD, set_current_audit_tenant_id, set_current_audit_user_id
# from extraction.xml_parser import parse_invoice_xml, extract_nested_invoice_xml

# logger = logging.getLogger(__name__)

# class InvoiceService:
#     def __init__(self):
#         self.db_session = SessionLocal()
#         self.invoice_crud = InvoiceCRUD(self.db_session)
#         self.user_crud = UserCRUD(self.db_session)

#     def __del__(self):
#         try:
#             if self.db_session.is_active:
#                 self.db_session.close()
#         except Exception as e:
#             logger.error(f"Error al cerrar la sesión de base de datos: {e}", exc_info=True)

#     def _extract_from_email_body(self, body_content: str) -> Dict[str, Any]:
#         extracted_data = {}
#         body_content = body_content.replace('\r\n', '\n').replace('\r', '\n')
#         patterns = {
#             'nombre_proveedor': r'Empresa:\s*(.+)',
#             'nit_proveedor': r'Identificación:\s*(\d{9,10})',
#             'fecha_emision': r'Fecha:\s*(\d{4}-\d{2}-\d{2})',
#             'numero_factura': r'Número:\s*([A-Za-z0-9\-\_]+)',
#             'cufe': r'CUFE:\s*([a-f0-9]{64,128})'
#         }
#         for key, pattern in patterns.items():
#             match = re.search(pattern, body_content, re.IGNORECASE)
#             if match:
#                 value = match.group(1).strip()
#                 if key == 'fecha_emision':
#                     try:
#                         extracted_data[key] = datetime.strptime(value, '%Y-%m-%d').date()
#                     except ValueError:
#                         continue
#                 else:
#                     extracted_data[key] = value
#         return extracted_data

#     # Modificar process_document para recibir tenant_id
#     def process_document(self, filename: str, file_binary_content: bytes, email_metadata: Dict[str, Any] = None, tenant_id: str = None) -> Optional[int]:
#         email_metadata = email_metadata or {}
        
#         # Si el tenant_id no se pasa directamente, intentar obtenerlo de email_metadata
#         if tenant_id is None:
#             tenant_id = email_metadata.get("tenant_id")

#         if tenant_id is None:
#             logger.error(f"No se pudo determinar el tenant_id para el procesamiento de la factura '{filename}'. Saltando.")
#             return None

#         # Establecer el tenant_id para la auditoría
#         set_current_audit_tenant_id(tenant_id)
        
#         extracted_invoice_data = {
#             "procesado_en": datetime.now(),
#             "ruta_archivo_original": filename,
#             "cufe": None,
#             "numero_factura": None,
#             "fecha_emision": None,
#             "hora_emision": None,
#             "monto_subtotal": None,
#             "monto_impuesto": None,
#             "monto_total": None,
#             "moneda": None,
#             "nombre_proveedor": None,
#             "nit_proveedor": None,
#             "email_proveedor": None,
#             "nombre_cliente": None,
#             "nit_cliente": None,
#             "fecha_vencimiento": None,
#             "metodo_pago": None,
#             "texto_crudo_xml": None,
#             "contenido_pdf_binario": None,
#             "usuario_id": None, 
#             "items": [],
#             "asunto_correo": email_metadata.get("subject", ""),
#             "remitente_correo": email_metadata.get("from", ""),
#             "correo_cliente_asociado": email_metadata.get("correo_cliente") or email_metadata.get("from", ""),
#             "uid": email_metadata.get("uid"),
#             "tenant_id": tenant_id # <-- Asegurar que el tenant_id esté en los datos de la factura
#         }
#         xml_content_str = None
#         pdf_binary_content = None
#         if filename.lower().endswith('.zip'):
#             try:
#                 with zipfile.ZipFile(io.BytesIO(file_binary_content), 'r') as zf:
#                     for zinfo in zf.infolist():
#                         with zf.open(zinfo.filename) as f:
#                             inner_file_binary = f.read()
#                             if zinfo.filename.lower().endswith('.xml'):
#                                 xml = extract_nested_invoice_xml(inner_file_binary)
#                                 if xml:
#                                     xml_content_str = xml
#                             elif zinfo.filename.lower().endswith('.pdf'):
#                                 pdf_binary_content = inner_file_binary
#             except Exception as e:
#                 logger.error(f"Error procesando archivo ZIP {filename}: {e}", exc_info=True)
#                 return None
#         elif filename.lower().endswith('.pdf'):
#             pdf_binary_content = file_binary_content
#         elif filename.lower().endswith('.xml'):
#             try:
#                 xml_content_str = file_binary_content.decode('utf-8')
#             except UnicodeDecodeError:
#                 logger.error(f"Error de decodificación Unicode para archivo XML {filename}.", exc_info=True)
#                 return None
#         else:
#             logger.warning(f"Tipo de archivo no soportado o desconocido: {filename}")
#             return None
        
#         parsed_xml_data = None
#         if xml_content_str:
#             try:
#                 parsed_xml_data = parse_invoice_xml(xml_content_str)
#                 if parsed_xml_data:
#                     extracted_invoice_data.update(parsed_xml_data)
#                     extracted_invoice_data['texto_crudo_xml'] = xml_content_str
#             except Exception as e:
#                 logger.warning(f"Error al parsear XML de {filename}: {e}", exc_info=True)
        
#         email_body_content = email_metadata.get("body")
#         if email_body_content:
#             extracted_from_body = self._extract_from_email_body(email_body_content)
#             for key, value in extracted_from_body.items():
#                 if value is not None and not extracted_invoice_data.get(key): 
#                     extracted_invoice_data[key] = value

#         if pdf_binary_content:
#             extracted_invoice_data['contenido_pdf_binario'] = pdf_binary_content
        
#         if not extracted_invoice_data.get('numero_factura'):
#             match = re.search(r'\b[A-Z0-9\-]{3,20}\b', extracted_invoice_data.get('asunto_correo', ''))
#             if match:
#                 extracted_invoice_data['numero_factura'] = match.group(0).strip()
#             else:
#                 extracted_invoice_data['numero_factura'] = extracted_invoice_data.get('uid') or f"TEMP_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        
#         if not extracted_invoice_data.get('nit_proveedor'):
#             match = re.search(r'\b\d{9,10}\b', extracted_invoice_data.get('asunto_correo', ''))
#             if match:
#                 extracted_invoice_data['nit_proveedor'] = match.group(0)
        
#         if not extracted_invoice_data.get('nombre_proveedor') and extracted_invoice_data.get('remitente_correo'):
#             match_name = re.match(r'^(.*?)<.*>$', extracted_invoice_data['remitente_correo'])
#             if match_name:
#                 extracted_invoice_data['nombre_proveedor'] = match_name.group(1).strip()
#             else:
#                 extracted_invoice_data['nombre_proveedor'] = extracted_invoice_data['remitente_correo'].split('@')[0].replace('.', ' ').title()
        
#         correo_cliente_asociado_final = extracted_invoice_data.get('correo_cliente_asociado')
#         if correo_cliente_asociado_final:
#             # Al buscar el usuario, también filtrar por tenant_id para asegurar que pertenece al mismo inquilino
#             user_obj = self.user_crud.db.query(Usuario).filter(Usuario.correo == correo_cliente_asociado_final, Usuario.tenant_id == tenant_id).first()
#             if user_obj:
#                 extracted_invoice_data['usuario_id'] = user_obj.id
#                 # Establecer el user_id para la auditoría si se encuentra un usuario asociado
#                 set_current_audit_user_id(user_obj.id)
#             else:
#                 logger.warning(f"Usuario asociado '{correo_cliente_asociado_final}' no encontrado para tenant '{tenant_id}'. La factura se guardará sin usuario_id asociado.")

#         items_to_save = extracted_invoice_data.pop('items', [])
#         extracted_invoice_data.pop('uid', None)

#         if not extracted_invoice_data.get('numero_factura') and not extracted_invoice_data.get('cufe'):
#             logger.warning(f"Factura '{filename}' no tiene número de factura ni CUFE. No se guardará.")
#             return None
        
#         # Pasar tenant_id a create_invoice
#         invoice_id = self.invoice_crud.create_invoice(extracted_invoice_data, items_to_save, tenant_id)
        
#         if invoice_id:
#             logger.info(f"Factura procesada y guardada con éxito. ID: {invoice_id}. Número: {extracted_invoice_data.get('numero_factura')}")
#         else:
#             logger.error(f"Fallo al guardar la factura para el archivo: {filename}. Revisa logs del CRUD para más detalles.")
        
#         return invoice_id if invoice_id else None
    
    
    
    
    
    
    
# import os
# import zipfile
# import io
# import logging
# import re
# from typing import Dict, Any, Optional
# from datetime import datetime, date

# from database.models import SessionLocal
# from database.crud import InvoiceCRUD, UserCRUD 
# from extraction.xml_parser import parse_invoice_xml, extract_nested_invoice_xml

# logger = logging.getLogger(__name__)

# class InvoiceService:
#     def __init__(self):
#         self.db_session = SessionLocal()
#         self.invoice_crud = InvoiceCRUD(self.db_session)
#         self.user_crud = UserCRUD(self.db_session)

#     def __del__(self):
#         try:
#             if self.db_session.is_active:
#                 self.db_session.close()
#         except Exception as e:
#             logger.error(f"Error al cerrar la sesión de base de datos: {e}", exc_info=True)

#     def _extract_from_email_body(self, body_content: str) -> Dict[str, Any]:
#         extracted_data = {}
#         body_content = body_content.replace('\r\n', '\n').replace('\r', '\n')
#         patterns = {
#             'nombre_proveedor': r'Empresa:\s*(.+)',
#             'nit_proveedor': r'Identificación:\s*(\d{9,10})',
#             'fecha_emision': r'Fecha:\s*(\d{4}-\d{2}-\d{2})',
#             'numero_factura': r'Número:\s*([A-Za-z0-9\-\_]+)',
#             'cufe': r'CUFE:\s*([a-f0-9]{64,128})'
#         }
#         for key, pattern in patterns.items():
#             match = re.search(pattern, body_content, re.IGNORECASE)
#             if match:
#                 value = match.group(1).strip()
#                 if key == 'fecha_emision':
#                     try:
#                         extracted_data[key] = datetime.strptime(value, '%Y-%m-%d').date()
#                     except ValueError:
#                         continue
#                 else:
#                     extracted_data[key] = value
#         return extracted_data

#     def process_document(self, filename: str, file_binary_content: bytes, email_metadata: Dict[str, Any] = None) -> Optional[int]:
#         email_metadata = email_metadata or {}
#         extracted_invoice_data = {
#             "procesado_en": datetime.now(),
#             "ruta_archivo_original": filename,
#             "cufe": None,
#             "numero_factura": None,
#             "fecha_emision": None,
#             "hora_emision": None,
#             "monto_subtotal": None,
#             "monto_impuesto": None,
#             "monto_total": None,
#             "moneda": None,
#             "nombre_proveedor": None,
#             "nit_proveedor": None,
#             "email_proveedor": None,
#             "nombre_cliente": None,
#             "nit_cliente": None,
#             "fecha_vencimiento": None,
#             "metodo_pago": None,
#             "texto_crudo_xml": None,
#             "contenido_pdf_binario": None,
#             "usuario_id": None, 
#             "items": [],
#             "asunto_correo": email_metadata.get("subject", ""),
#             "remitente_correo": email_metadata.get("from", ""),
#             "correo_cliente_asociado": email_metadata.get("correo_cliente") or email_metadata.get("from", ""),
#             "uid": email_metadata.get("uid")
#         }
#         xml_content_str = None
#         pdf_binary_content = None
#         if filename.lower().endswith('.zip'):
#             try:
#                 with zipfile.ZipFile(io.BytesIO(file_binary_content), 'r') as zf:
#                     for zinfo in zf.infolist():
#                         with zf.open(zinfo.filename) as f:
#                             inner_file_binary = f.read()
#                             if zinfo.filename.lower().endswith('.xml'):
#                                 xml = extract_nested_invoice_xml(inner_file_binary)
#                                 if xml:
#                                     xml_content_str = xml
#                             elif zinfo.filename.lower().endswith('.pdf'):
#                                 pdf_binary_content = inner_file_binary
#             except Exception as e:
#                 logger.error(f"Error procesando archivo ZIP {filename}: {e}", exc_info=True)
#                 return None
#         elif filename.lower().endswith('.pdf'):
#             pdf_binary_content = file_binary_content

#         elif filename.lower().endswith('.xml'):
#             try:
#                 xml_content_str = file_binary_content.decode('utf-8')
#             except UnicodeDecodeError:
#                 logger.error(f"Error de decodificación Unicode para archivo XML {filename}.", exc_info=True)
#                 return None
#         else:
#             logger.warning(f"Tipo de archivo no soportado o desconocido: {filename}")
#             return None
#         parsed_xml_data = None
#         if xml_content_str:
#             try:
#                 parsed_xml_data = parse_invoice_xml(xml_content_str)
#                 if parsed_xml_data:
#                     extracted_invoice_data.update(parsed_xml_data)
#                     extracted_invoice_data['texto_crudo_xml'] = xml_content_str
#             except Exception as e:
#                 logger.warning(f"Error al parsear XML de {filename}: {e}", exc_info=True)
#         email_body_content = email_metadata.get("body")
#         if email_body_content:
#             extracted_from_body = self._extract_from_email_body(email_body_content)
#             for key, value in extracted_from_body.items():
#                 if value is not None and not extracted_invoice_data.get(key): 
#                     extracted_invoice_data[key] = value

#         if pdf_binary_content:
#             extracted_invoice_data['contenido_pdf_binario'] = pdf_binary_content
#         if not extracted_invoice_data.get('numero_factura'):
#             match = re.search(r'\b[A-Z0-9\-]{3,20}\b', extracted_invoice_data.get('asunto_correo', ''))
#             if match:
#                 extracted_invoice_data['numero_factura'] = match.group(0).strip()
#             else:
#                 extracted_invoice_data['numero_factura'] = extracted_invoice_data.get('uid') or f"TEMP_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
#         if not extracted_invoice_data.get('nit_proveedor'):
#             match = re.search(r'\b\d{9,10}\b', extracted_invoice_data.get('asunto_correo', ''))
#             if match:
#                 extracted_invoice_data['nit_proveedor'] = match.group(0)
#         if not extracted_invoice_data.get('nombre_proveedor') and extracted_invoice_data.get('remitente_correo'):
#             match_name = re.match(r'^(.*?)<.*>$', extracted_invoice_data['remitente_correo'])
#             if match_name:
#                 extracted_invoice_data['nombre_proveedor'] = match_name.group(1).strip()
#             else:
#                 extracted_invoice_data['nombre_proveedor'] = extracted_invoice_data['remitente_correo'].split('@')[0].replace('.', ' ').title()
#         correo_cliente_asociado_final = extracted_invoice_data.get('correo_cliente_asociado')
#         if correo_cliente_asociado_final:
#             user_obj = self.user_crud.get_user_by_email(correo_cliente_asociado_final)
#             if user_obj:
#                 extracted_invoice_data['usuario_id'] = user_obj.id
#         items_to_save = extracted_invoice_data.pop('items', [])
#         extracted_invoice_data.pop('uid', None)
#         if not extracted_invoice_data.get('numero_factura') and not extracted_invoice_data.get('cufe'):
#             logger.warning(f"Factura '{filename}' no tiene número de factura ni CUFE. No se guardará.")
#             return None
#         invoice_id = self.invoice_crud.create_invoice(extracted_invoice_data, items_to_save)
        
#         if invoice_id:
#             logger.info(f"Factura procesada y guardada con éxito. ID: {invoice_id}. Número: {extracted_invoice_data.get('numero_factura')}")
#         else:
#             logger.error(f"Fallo al guardar la factura para el archivo: {filename}. Revisa logs del CRUD para más detalles.")
        
#         return invoice_id if invoice_id else None
