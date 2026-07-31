FROM node:26-alpine AS dependencies

WORKDIR /build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN npm install -g corepack --no-cache && \
  corepack enable && \
  corepack prepare --activate && \
  pnpm config set store-dir /root/.pnpm-store

RUN --mount=type=cache,target=/root/.pnpm-store pnpm ci

FROM dependencies AS build

ARG VITE_CALCULATOR_URL
ENV VITE_CALCULATOR_URL=${VITE_CALCULATOR_URL}

COPY . .

RUN cp resources/fonts frontend/assets -r && \
  pnpm cli fetch && \
  pnpm prerender

FROM nginx:alpine-slim AS runtime

WORKDIR /app

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/

RUN apk add --no-cache supervisor

COPY nginx.conf /etc/nginx/templates/nginx.conf.template
COPY supervisord.conf /etc/supervisord.conf

ENV NODE_ENV=production
ENV DIST_DIR=.

ARG VITE_CALCULATOR_URL
ENV VITE_CALCULATOR_URL=${VITE_CALCULATOR_URL}

COPY --from=build /usr/local/bin/node /usr/local/bin/node

COPY --from=build /build/static /app
COPY --from=build /build/dist/client /app/private/client
COPY --from=build /build/dist/server /app/private/server
COPY --from=build /build/dist/backend /app/private/backend
COPY --from=build /build/drizzle /app/private/backend/migrations

RUN chmod u+x /app/private/backend/server.js


CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
