FROM php:8.3-fpm-bookworm AS build

WORKDIR /app

# 1. Instalar dependencias del sistema y extensiones PHP
RUN apt-get update && apt-get install -y --no-install-recommends \
    git unzip zip \
    libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
    libonig-dev libicu-dev libmagickwand-dev \
    mariadb-client tzdata fontconfig fonts-dejavu imagemagick \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        gd \
        zip \
        pdo \
        pdo_mysql \
        mbstring \
        exif \
        intl \
    && pecl install imagick \
    && docker-php-ext-enable imagick \
    && rm -rf /var/lib/apt/lists/*

# 2. Copiar Composer
COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# 3. Copiar composer.json y composer.lock para cache
COPY composer.json composer.lock ./

# 4. Composer install (con cache)
RUN composer install --no-dev --prefer-dist --optimize-autoloader --classmap-authoritative --no-scripts --no-interaction --no-progress

# Copiar el resto del código
COPY . .

RUN composer dump-autoload --optimize

# ------------------------
# Etapa 2: Producción ligera
# ------------------------
FROM php:8.3-fpm-bookworm AS production
WORKDIR /var/www

# Instalar dependencias mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    fontconfig \
    fonts-dejavu \
    ghostscript \
    libzip4 \
    libpng16-16 \
    libjpeg62-turbo \
    libfreetype6 \
    libicu72 \
    libmagickwand-6.q16-6 \
    imagemagick \
    wget xfonts-75dpi xfonts-base \
    && rm -rf /var/lib/apt/lists/*


# Instalar wkhtmltopdf (binario .deb porque no está en repos)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wkhtmltopdf \
    && rm -rf /var/lib/apt/lists/*


# Copiar PHP y extensiones
COPY --from=build /usr/local /usr/local

COPY --from=composer:2.7 /usr/bin/composer /usr/bin/composer

# Copiar aplicación con vendor incluido
COPY --from=build /app /var/www

COPY .env /var/www/.env

# Ejecutar scripts de Composer ya con artisan presente
RUN composer run-script post-autoload-dump --no-dev --no-interaction

# Configurar permisos
RUN chown -R www-data:www-data /var/www/storage \
    && chown -R www-data:www-data /var/www/bootstrap/cache \
    && chmod -R 777 /var/www/storage \
    && chmod -R 777 /var/www/bootstrap

# Crear usuario no root
RUN groupadd -g 1000 www && useradd -u 1000 -ms /bin/bash -g www www \
    && chown -R www:www /var/www

EXPOSE 9000
CMD ["php-fpm"]
