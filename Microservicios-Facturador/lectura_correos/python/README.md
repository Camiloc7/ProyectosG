# 📬 Microservicio: Lectura de Correos con Facturas

Este microservicio se encarga de conectarse a cuentas de correo IMAP, extraer correos con facturas electrónicas adjuntas (PDF/XML), y procesarlas para almacenar su información en una base de datos MySQL. Forma parte del sistema de [microservicios-Facturador](https://github.com/Quality-Soft-Bill/microservicios-Facturador).

## 🚀 Características

- Extracción automática de correos con facturas adjuntas.
- Procesamiento de facturas XML.
- Clasificación de facturas y auditoría de cambios.
- Exposición de una API REST con FastAPI.
- Autenticación JWT y manejo de múltiples usuarios.


## ⚙️ Requisitos

- Docker + Docker Compose
- Cuenta de correo IMAP (ej: Gmail, Outlook)
- Claves y contraseñas necesarias en el `.env`

## 🧪 Variables de Entorno

Crea un archivo `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

## 🐳 Cómo levantar el servicio

- Desde la carpeta lectura_correos, ejecutá:
    [docker compose up --build]

## 📫 Agregar una cuenta de correo

Para que el microservicio procese correos:

- Levanta los contenedores.
- Crea un usuario a través de la API [/users/register] o directamente en la base de datos. documentación http://localhost:8000/docs.
- Incluye en el usuario:
- correo: dirección IMAP válida.
- email_account_password_encrypted: contraseña de 16 caracteres del correo sin espacios, debe ponerse en los dos campos,
 Generacion de contraseña en el link  [https://myaccount.google.com/apppasswords]