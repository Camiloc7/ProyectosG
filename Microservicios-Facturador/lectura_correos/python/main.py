import os
import sys
import time
import logging
from datetime import datetime
from config.settings import settings
from database.models import init_db 
from ingestion.email_reader import obtener_correos_con_facturas
from services.invoice_service import InvoiceService

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def run_invoice_processing_loop():
    try:
        init_db()
    except Exception as e:
        logger.critical(f"No se pudo inicializar la base de datos: {e}", exc_info=True)
        sys.exit(1)

    os.makedirs(settings.TMP_DIR, exist_ok=True)
    logger.info("Servicio iniciado correctamente.")

    invoice_service = InvoiceService()
    error_count = 0
    max_errors = 5

    while True:
        start_loop_time = time.time()
        logger.info("Iniciando ciclo de procesamiento de correos.")
        try:
            correos_encontrados = obtener_correos_con_facturas()
            error_count = 0

            for correo in correos_encontrados or []:
                correo_inicio = time.time()
                remitente = correo.get("from", "desconocido")
                adjuntos = correo.get("adjuntos_binarios", [])
                tenant_id_del_correo = correo.get("tenant_id")
                if not tenant_id_del_correo:
                    logger.warning(f"Correo de {remitente} (UID: {correo.get('uid')}) no tiene tenant_id. Saltando procesamiento.")
                    continue

                for adjunto in adjuntos:
                    filename = adjunto["filename"]
                    payload = adjunto["payload_binary"]
                    try:
                        invoice_id = invoice_service.process_document(
                            filename, 
                            payload, 
                            {
                                "asunto_correo": correo.get("subject"),
                                "remitente_correo": remitente,
                                "correo_cliente_asociado": correo.get("correo_cliente"),
                                "uid": correo.get("uid"),
                                "body": correo.get("body"),
                                "tenant_id": tenant_id_del_correo 
                            },
                            tenant_id=tenant_id_del_correo 
                        )
                        if invoice_id:
                            logger.info(f"Correo de {remitente} (tenant: {tenant_id_del_correo}) procesado en {time.time() - correo_inicio:.2f}s.")
                        else:
                            logger.warning(f"No se pudo guardar la factura para '{filename}' (tenant: {tenant_id_del_correo}).")
                    except Exception as e:
                        logger.error(f"Error procesando '{filename}' para tenant '{tenant_id_del_correo}': {e}", exc_info=True)

        except Exception as e:
            error_count += 1
            logger.critical(f"Fallo en la ingesta de correos: {e}", exc_info=True)
            if error_count >= max_errors:
                logger.critical("Demasiados errores consecutivos. Abortando.")
                break

        elapsed = time.time() - start_loop_time
        logger.info(f"Ciclo completo en {elapsed:.2f}s. Esperando {settings.EMAIL_CHECK_INTERVAL_SECONDS}s...")
        time.sleep(settings.EMAIL_CHECK_INTERVAL_SECONDS)

if __name__ == "__main__":
    logger.info("Inicializando servicio de procesamiento de facturas...")
    run_invoice_processing_loop()
    