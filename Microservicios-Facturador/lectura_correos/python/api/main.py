from fastapi.middleware.cors import CORSMiddleware 
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
import os

from database.models import SessionLocal, Usuario, init_db
from api.routers import users, invoices, items_factura

init_db()

app = FastAPI(
    title="API de Gestión de Facturas y Correos",
    description="API para la gestión de facturas electrónicas extraídas de correos y funcionalidades de usuario.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,  
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app.include_router(users.router, prefix="/users", tags=["Usuarios"])
app.include_router(invoices.router, prefix="/invoices", tags=["Facturas"])
app.include_router(items_factura.router, prefix="/invoices", tags=["Ítems de Factura"])


@app.get("/")
async def root():
    return {"message": "API de Gestión de Facturas y Correos funcionando correctamente."}
