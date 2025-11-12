# =========================
# Etapa 1: Build
# =========================
FROM node:20-alpine AS builder

# Dependencias necesarias para Puppeteer en Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wget \
    bash \
    udev

# Evitar descarga de Chromium por Puppeteer ANTES de npm install
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig*.json ./

# Instalar dependencias
RUN npm install && npm cache clean --force

# Copiar el resto del código
COPY . .

# Compilar
RUN npm run build


# =========================
# Etapa 2: Producción
# =========================
FROM node:20-alpine AS production

# Instalar dependencias necesarias para ejecutar Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    udev

# Crear directorio de trabajo
WORKDIR /app

# Copiar dependencias y código compilado desde builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Variables de entorno
ENV NODE_ENV=production
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Exponer puerto
EXPOSE 3000

# Comando de arranque
CMD ["node", "dist/src/main.js"]
