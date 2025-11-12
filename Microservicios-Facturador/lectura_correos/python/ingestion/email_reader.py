import os
from imap_tools import MailBox
import logging
from database.models import SessionLocal, Usuario
from config.settings import settings
from ingestion.utils import cargar_uids_procesados, guardar_uid

logger = logging.getLogger(__name__)

def contiene_factura(texto):
    texto = texto.lower()
    palabras_clave = [
        "factura", "invoice", "comprobante", "recibo", "cuenta",
        "estado de cuenta", "billing", "cxc", "facturación",
        "orden de compra", "remisión", "nota crédito", "nota débito"
    ]
    return any(palabra in texto for palabra in palabras_clave)

def obtener_usuarios_db():
    usuarios_list = []
    try:
        with SessionLocal() as session:
            for user in session.query(Usuario).all():
                try:
                    decrypted_password = settings.CIPHER_SUITE.decrypt(user.email_account_password_encrypted.encode()).decode()
                    usuarios_list.append({
                        "correo": user.correo,
                        "password": decrypted_password,
                        "tenant_id": user.tenant_id 
                    })
                except Exception as e:
                    logger.error(f"Error desencriptando contraseña de {user.correo}: {e}", exc_info=True)
    except Exception as e:
        logger.error(f"Error al consultar usuarios: {e}", exc_info=True)
    return usuarios_list

def obtener_correos_con_facturas():
    correos = []
    for usuario in obtener_usuarios_db():
        email, password, tenant_id = usuario.get("correo"), usuario.get("password"), usuario.get("tenant_id") 
        if not email or not password or not tenant_id: 
            logger.warning(f"Usuario {email} no tiene correo, contraseña o tenant_id configurado. Saltando.")
            continue

        uids_procesados = cargar_uids_procesados(email)
        try:
            with MailBox(settings.EMAIL_IMAP_SERVER).login(email, password, 'INBOX') as mailbox:
                for msg in mailbox.fetch(reverse=True, limit=settings.EMAIL_FETCH_LIMIT):
                    if str(msg.uid) in uids_procesados:
                        continue

                    cuerpo = msg.text or msg.html or ""
                    asunto = msg.subject or ""

                    if (contiene_factura(cuerpo) or contiene_factura(asunto)) and msg.attachments:
                        adjuntos = [
                            {"filename": att.filename, "payload_binary": att.payload}
                            for att in msg.attachments
                            if att.filename.lower().endswith(('.pdf', '.zip', '.xml'))
                        ]

                        if adjuntos:
                            correos.append({
                                "from": msg.from_ or "",
                                "subject": asunto,
                                "uid": msg.uid,
                                "adjuntos_binarios": adjuntos,
                                "correo_cliente": email, 
                                "body": cuerpo,
                                "tenant_id": tenant_id 
                            })
                            guardar_uid(str(msg.uid), email)
        except Exception as e:
            logger.error(f"Error leyendo correos de {email}: {e}", exc_info=True)

    return correos
