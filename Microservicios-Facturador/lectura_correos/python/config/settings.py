
# import os
# from typing import Optional
# from pydantic_settings import BaseSettings, SettingsConfigDict
# from cryptography.fernet import Fernet
# BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# class Settings(BaseSettings): 
#     DB_HOST: str = "localhost"
#     DB_PORT: str = "3306"
#     DB_USER: str = "root"
#     DB_PASSWORD: str = "root"
#     DB_NAME: str = "lectura_correos"
#     @property
#     def DATABASE_URL(self) -> str:
#         return f"mysql+mysqlconnector://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
#     PDF_INPUT_DIR: str = os.path.join(BASE_DIR, "data", "pdf_inbox")
#     PDF_PROCESSED_DIR: str = os.path.join(BASE_DIR, "data", "pdf_processed")
#     PDF_ERROR_DIR: str = os.path.join(BASE_DIR, "data", "pdf_errors")
#     TMP_DIR: str = os.path.join(BASE_DIR, "tmp")
#     TESSERACT_CMD: str = "/usr/local/bin/tesseract"
#     POPPLER_PATH: str = "/usr/local/bin"
#     TESSDATA_PREFIX: str = "/usr/local/share/tessdata"
#     TESSERACT_LANG: str = "spa"
#     SPACY_MODEL: str = "es_core_news_sm"
#     LEARNED_PATTERNS_FILE: str = os.path.join(BASE_DIR, 'learning', 'learned_patterns.json')
#     LOG_LEVEL: str = "WARNING"
#     EMAIL_IMAP_SERVER: str = "imap.gmail.com"
#     EMAIL_FETCH_LIMIT: int = 50
#     EMAIL_CHECK_INTERVAL_SECONDS: int = 60
#     PROCESSING_INTERVAL_SECONDS: int = 30
#     SECRET_KEY: str = "your-super-secret-key-replace-this-with-a-random-one-in-production"
#     ALGORITHM: str = "HS256"
#     ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
#     ENCRYPTION_KEY: str
#     _cipher_suite: Optional[Fernet] = None
#     model_config = SettingsConfigDict(env_file=".env", extra="ignore")
#     def __init__(self, **kwargs):
#         super().__init__(**kwargs)
#         try:
#             self._cipher_suite = Fernet(self.ENCRYPTION_KEY.encode())
#         except Exception as e:
#             raise ValueError(f"Error al inicializar Fernet. Asegúrate de que 'ENCRYPTION_KEY' esté definida y sea una clave válida en tu archivo .env. Detalles: {e}")
#     @property
#     def CIPHER_SUITE(self) -> Fernet:
#         if self._cipher_suite is None:
#             raise RuntimeError("CIPHER_SUITE no ha sido inicializado. Asegúrate de que la clase Settings se instancie correctamente.")
#         return self._cipher_suite

# settings = Settings()




######## config/settings.py (Versión Docker)

import os
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from cryptography.fernet import Fernet

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    PDF_INPUT_DIR: str = "/app/data/pdf_inbox" 
    PDF_PROCESSED_DIR: str = "/app/data/pdf_processed" 
    PDF_ERROR_DIR: str = "/app/data/pdf_errors" 
    TMP_DIR: str = "/app/tmp" 
    LEARNED_PATTERNS_FILE: str = "/app/learning/learned_patterns.json" 
    TESSERACT_LANG: str = "spa"
    SPACY_MODEL: str = "es_core_news_sm"
    LOG_LEVEL: str = "INFO" #
    EMAIL_IMAP_SERVER: str = "imap.gmail.com"
    EMAIL_FETCH_LIMIT: int = 200 
    EMAIL_CHECK_INTERVAL_SECONDS: int = 10
    PROCESSING_INTERVAL_SECONDS: int = 5
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENCRYPTION_KEY: str
    _cipher_suite: Optional[Fernet] = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        try:
            self._cipher_suite = Fernet(self.ENCRYPTION_KEY.encode())
        except Exception as e:
            raise ValueError(f"Error al inicializar Fernet. Asegúrate de que 'ENCRYPTION_KEY' esté definida y sea una clave válida de Fernet (base64 URL-safe). Detalles: {e}")

    @property
    def CIPHER_SUITE(self) -> Fernet:
        if self._cipher_suite is None:
            raise RuntimeError("CIPHER_SUITE no ha sido inicializado. Asegúrate de que la clase Settings se instancie correctamente.")
        return self._cipher_suite

settings = Settings()