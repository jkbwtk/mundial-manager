FROM node:22-alpine AS build

WORKDIR /build

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

RUN cp resources/fonts src/assets/fonts -r && \
  pnpm fetch-symbols && \
  pnpm build && \
  pnpm prerender

FROM nginx:alpine-slim AS runtime

WORKDIR /app

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/


COPY --from=build /build/dist/client/assets /app/private/assets
COPY --from=build /build/dist/static /app/private

COPY nginx.conf /etc/nginx/templates/nginx.conf.template
