FROM php:8.3-fpm

# Set working directory
WORKDIR /var/www

# System dependencies for your specific app
RUN apt-get update && apt-get install -y \
    git curl libpng-dev libonig-dev libxml2-dev zip unzip libzip-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
# Added bcmath for AcadPack financial tracking & gd for images
RUN docker-php-ext-install pdo_mysql mysqli mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy all files (vendor, app, public, etc.)
COPY . /var/www

# Permissions: www-data needs to own the files to execute them
RUN chown -R www-data:www-data /var/www

EXPOSE 9000
CMD ["php-fpm"]
