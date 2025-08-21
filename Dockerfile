FROM nginx:alpine-slim

WORKDIR /app

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/

COPY nginx.conf /etc/nginx/templates/nginx.conf.template

COPY static /app
COPY dist/client/assets /app/private/assets
COPY dist/static /app/private
