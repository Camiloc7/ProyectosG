import logging
from config.settings import settings
from database.models import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

logger = logging.getLogger(__name__)

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Tablas creadas/verificadas correctamente.")
    except Exception as e:
        logger.critical(f"Error al inicializar la base de datos: {e}", exc_info=True)
        raise