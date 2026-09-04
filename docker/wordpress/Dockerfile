FROM wordpress:latest

#==============================
# mailhog
#==============================
RUN curl --location --output /usr/local/bin/mhsendmail https://github.com/mailhog/mhsendmail/releases/download/v0.2.0/mhsendmail_linux_amd64 && \
    chmod +x /usr/local/bin/mhsendmail

COPY mailhog.ini /usr/local/etc/php/conf.d/mailhog.ini

#==============================
# WP-CLI
#==============================
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp \
    && wp --info

#==============================
# mysqlクライアント
#==============================
RUN apt-get update && \
apt-get install -y default-mysql-client && \
rm -rf /var/lib/apt/lists/*

#==============================
# PHP CS Fixer
#==============================
RUN curl -L https://cs.symfony.com/download/php-cs-fixer-v3.phar -o /usr/local/bin/php-cs-fixer && \
    chmod +x /usr/local/bin/php-cs-fixer

WORKDIR /var/www/html/wp-dir