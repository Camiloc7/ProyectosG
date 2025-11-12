from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Date, Boolean, Text, LargeBinary, ForeignKey, inspect
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.mysql import LONGBLOB, TINYINT 
import json 
from config.settings import settings
from typing import Optional
from datetime import datetime 

Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    correo = Column(String(255), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    email_account_password_encrypted = Column(String(255), nullable=True)
    tenant_id = Column(String(255), index=True, nullable=True) 

    facturas = relationship("Factura", back_populates="usuario")
    def __repr__(self):
        return f"<Usuario(id={self.id}, correo='{self.correo}', tenant_id='{self.tenant_id}')>"

class Factura(Base):
    __tablename__ = "facturas"
    id = Column(Integer, primary_key=True, index=True)
    procesado_en = Column(DateTime, default=func.now())
    ruta_archivo_original = Column(String(500), nullable=True)
    asunto_correo = Column(String(500), nullable=True)
    remitente_correo = Column(String(255), nullable=True)
    correo_cliente_asociado = Column(String(255), nullable=True)
    cufe = Column(String(200), unique=True, index=True, nullable=True) 
    numero_factura = Column(String(100), unique=True, index=True, nullable=True)
    fecha_emision = Column(Date, nullable=True)
    hora_emision = Column(String(50), nullable=True)
    monto_subtotal = Column(Float, nullable=True)
    monto_impuesto = Column(Float, nullable=True)
    monto_total = Column(Float, nullable=True)
    moneda = Column(String(10), nullable=True)
    nombre_proveedor = Column(String(255), nullable=True)
    nit_proveedor = Column(String(50), nullable=True, index=True)
    email_proveedor = Column(String(255), nullable=True)
    nombre_cliente = Column(String(255), nullable=True)
    nit_cliente = Column(String(50), nullable=True)
    fecha_vencimiento = Column(Date, nullable=True)
    metodo_pago = Column(String(100), nullable=True)
    texto_crudo_xml = Column(Text, nullable=True)
    contenido_pdf_binario = Column(LONGBLOB, nullable=True)
    tipo_documento_dian = Column(String(100),  nullable=True) 
    revisada_manualmente = Column(TINYINT, default=0, nullable=True) 
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) 
    proveedor_id = Column(String(36), ForeignKey("suppliers.id"), nullable=True) 
    proveedor_nest = relationship("Supplier", back_populates="facturas_asociadas")
    items = relationship("ItemFactura", back_populates="factura", cascade="all, delete-orphan")
    usuario = relationship("Usuario", back_populates="facturas") 
    
    tenant_id = Column(String(255), index=True, nullable=True) 

    def __repr__(self):
        return (f"<Factura(id={self.id}, numero='{self.numero_factura}', "
                f"total={self.monto_total}, tenant_id='{self.tenant_id}')>") 

class ItemFactura(Base):
    __tablename__ = "items_factura"
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id"), nullable=False)
    descripcion = Column(String(500), nullable=True)
    cantidad = Column(Float, nullable=True)
    valor_unitario = Column(Float, nullable=True)
    valor_total = Column(Float, nullable=True)

    factura = relationship("Factura", back_populates="items")
    
    tenant_id = Column(String(255), index=True, nullable=True) 

    def __repr__(self):
        return (f"<ItemFactura(id={self.id}, id_factura={self.factura_id}, "
                f"descripcion='{self.descripcion}', total={self.valor_total}, tenant_id='{self.tenant_id}')>")

class FacturaAudit(Base):
    __tablename__ = "facturas_audit"
    id = Column(Integer, primary_key=True, index=True)
    id_factura = Column(Integer, nullable=False) 
    
    procesado_en = Column(DateTime, nullable=True)
    ruta_archivo_original = Column(String(500), nullable=True)
    asunto_correo = Column(String(500), nullable=True)
    remitente_correo = Column(String(255), nullable=True)
    correo_cliente_asociado = Column(String(255), nullable=True)
    cufe = Column(String(200), nullable=True)
    numero_factura = Column(String(100), nullable=True) 
    fecha_emision = Column(Date, nullable=True)
    hora_emision = Column(String(50), nullable=True)
    monto_subtotal = Column(Float, nullable=True)
    monto_impuesto = Column(Float, nullable=True)
    monto_total = Column(Float, nullable=True)
    moneda = Column(String(10), nullable=True)
    nombre_proveedor = Column(String(255), nullable=True)
    nit_proveedor = Column(String(50), nullable=True)
    email_proveedor = Column(String(255), nullable=True)
    nombre_cliente = Column(String(255), nullable=True)
    nit_cliente = Column(String(50), nullable=True)
    fecha_vencimiento = Column(Date, nullable=True)
    metodo_pago = Column(String(100), nullable=True)
    texto_crudo_xml = Column(Text, nullable=True)
    tipo_documento_dian = Column(String(100), nullable=True)
    revisada_manualmente = Column(Boolean, nullable=True) 
    usuario_id_asociado_factura = Column(Integer, nullable=True) 
    fecha_modificacion = Column(DateTime, default=func.now(), nullable=False)
    tipo_operacion = Column(String(10), nullable=False) 
    usuario_auditoria_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) 
    datos_anteriores = Column(Text, nullable=True) 
    
    tenant_id = Column(String(255), index=True, nullable=True) 

    def __repr__(self):
        return (f"<FacturaAudit(id={self.id}, id_factura={self.id_factura}, "
                f"operacion='{self.tipo_operacion}', fecha='{self.fecha_modificacion}', tenant_id='{self.tenant_id}')>")

class ItemFacturaAudit(Base):
    __tablename__ = "items_factura_audit"
    id = Column(Integer, primary_key=True, index=True)
    id_item_factura = Column(Integer, nullable=False) 
    factura_id = Column(Integer, nullable=False) 
    descripcion = Column(String(500), nullable=True)
    cantidad = Column(Float, nullable=True)
    valor_unitario = Column(Float, nullable=True)
    valor_total = Column(Float, nullable=True)

    fecha_modificacion = Column(DateTime, default=func.now(), nullable=False)
    tipo_operacion = Column(String(10), nullable=False) 
    usuario_auditoria_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True) 
    datos_anteriores = Column(Text, nullable=True) 
    
    tenant_id = Column(String(255), index=True, nullable=True) 

    def __repr__(self):
        return (f"<ItemFacturaAudit(id={self.id}, id_item={self.id_item_factura}, "
                f"operacion='{self.tipo_operacion}', fecha='{self.fecha_modificacion}', tenant_id='{self.tenant_id}')>")

# Modelo para la tabla 'suppliers' de NestJS
class Supplier(Base):
    __tablename__ = "suppliers" 
    id = Column(String(36), primary_key=True, index=True) 
    nit = Column(String(255), nullable=True) 
    name = Column(String(255), nullable=False)
    contact_person = Column(String(255), nullable=True)
    phone = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    notes = Column(String(255), nullable=True)
    is_active = Column(TINYINT, nullable=False, default=1) 
    verification_digit = Column(String(255), nullable=True)
    city = Column(String(255), nullable=True)
    notifications_enabled = Column(TINYINT, nullable=False, default=0) 
    document_type = Column(String(255), nullable=True)
    contact_first_name = Column(String(255), nullable=True)
    contact_middle_name = Column(String(255), nullable=True)
    contact_last_name = Column(String(255), nullable=True)
    contact_second_last_name = Column(String(255), nullable=True)
    commercial_name = Column(String(255), nullable=True)
    bank_account_type = Column(String(255), nullable=True)
    bank_account_number = Column(String(255), nullable=True)
    bank_name = Column(String(255), nullable=True)
    category_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    tenant_id = Column(String(255), index=True, nullable=True) 
    facturas_asociadas = relationship("Factura", back_populates="proveedor_nest")


DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    try:
        inspector = inspect(engine)
        required_tables = [
            "usuarios", "facturas", "items_factura",
            "facturas_audit", "items_factura_audit", "suppliers" 
        ]
        
        for table_name in required_tables:
            if not inspector.has_table(table_name):
               
                pass 
        Base.metadata.create_all(bind=engine) 
        
        print("Base de datos inicializada y tablas creadas/verificadas.")
    except Exception as e:
        print(f"Error al inicializar la base de datos: {e}")
        raise 
if __name__ == "__main__":
    init_db()