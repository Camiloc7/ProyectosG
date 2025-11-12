import os
import json
import logging
from config.settings import settings

logger = logging.getLogger(__name__)

PROCESSED_UIDS_DIR = os.path.join(settings.TMP_DIR, "processed_uids")

def _get_uids_file_path(email_address: str) -> str:
    os.makedirs(PROCESSED_UIDS_DIR, exist_ok=True)
    safe_email = email_address.replace('@', '_at_').replace('.', '_dot_')
    return os.path.join(PROCESSED_UIDS_DIR, f"{safe_email}_uids.json")

def cargar_uids_procesados(email_address: str) -> set:
    file_path = _get_uids_file_path(email_address)
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except Exception as e:
            logger.error(f"Error cargando UIDs para {email_address}: {e}", exc_info=True)
    return set()

def guardar_uid(uid: str, email_address: str):
    uids = cargar_uids_procesados(email_address)
    uids.add(uid)
    file_path = _get_uids_file_path(email_address)
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(list(uids), f, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Error guardando UID {uid} para {email_address}: {e}", exc_info=True)
