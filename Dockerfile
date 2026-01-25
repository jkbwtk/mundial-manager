FROM node:22-alpine AS build

WORKDIR /build

ARG VITE_CALCULATOR_URL
ENV VITE_CALCULATOR_URL=${VITE_CALCULATOR_URL}

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

RUN cp resources/fonts frontend/assets -r && \
  pnpm fetch-symbols && \
  pnpm prerender

FROM nginx:alpine-slim AS runtime

WORKDIR /app

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/

COPY --from=build /usr/local/bin/node /usr/local/bin/node

RUN apk add --no-cache supervisor

COPY --from=build /build/static /app
COPY --from=build /build/dist/client /app/private
COPY --from=build /build/dist/static /app/private
COPY --from=build /build/dist/backend /app/backend

COPY nginx.conf /etc/nginx/templates/nginx.conf.template
COPY supervisord.conf /etc/supervisord.conf

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
