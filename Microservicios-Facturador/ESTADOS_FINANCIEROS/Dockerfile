FROM node:18

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia package.json y package-lock.json
COPY package*.json ./
COPY tsconfig.json ./

# Instala dependencias de producción solamente
RUN npm install && npm install --save-dev @types/cookie-parser

# Copia el resto del código
COPY . .

# Compila el proyecto TypeScript a JavaScript
RUN npm run build

# Expone el puerto de la app (ajustalo si es necesario)
EXPOSE 3002

# Comando de inicio (ejecuta el código JS compilado)
CMD ["npm", "start"]
