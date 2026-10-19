FROM node:26-alpine AS dependencies

WORKDIR /build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN npm install -g corepack --no-cache && \
  corepack enable && \
  corepack prepare --activate && \
  pnpm config set store-dir /root/.pnpm-store

RUN --mount=type=cache,target=/root/.pnpm-store pnpm ci

FROM dependencies AS build

COPY . .

RUN pnpm cli fetch && \
  pnpm prerender

FROM nginx:alpine-slim AS runtime

WORKDIR /app

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/

RUN apk add --no-cache bash tini nodejs-current

COPY nginx.conf /etc/nginx/templates/nginx.conf.template
COPY --chmod=755 start.sh /usr/local/bin/start.sh

ENV NODE_ENV=production
ENV DIST_DIR=.

COPY --from=build /build/static /app
COPY --from=build /build/dist/client /app/private/client
COPY --from=build /build/dist/server /app/private/server
COPY --from=build /build/dist/backend /app/private/backend
COPY --from=build /build/drizzle /app/private/backend/migrations

RUN chmod u+x /app/private/backend/server.js


STOPSIGNAL SIGTERM

ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
CMD ["start.sh"]
