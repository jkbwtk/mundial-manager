FROM node:26-alpine AS dependencies

WORKDIR /build

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN npm install -g corepack --no-cache && \
  corepack enable && \
  corepack prepare --activate && \
  pnpm config set store-dir /root/.pnpm-store

RUN --mount=type=cache,target=/root/.pnpm-store pnpm ci

FROM dependencies AS build

ARG VITE_BUILD_CHANNEL
ARG VITE_BUILD_COMMIT_SHA
ARG VITE_BUILD_DATE
ARG VITE_BUILD_TAGS
ARG VITE_BUILD_RUNNER
ARG VITE_BUILD_RUN_NUMBER

COPY . .

RUN pnpm cli fetch && \
  pnpm prerender && \
  chmod u+x dist/backend/server.js

FROM nginx:alpine-slim AS runtime-node

RUN apk add --no-cache nodejs-current && \
  mkdir -p /out/usr/bin && \
  cp -p /usr/bin/node /out/usr/bin/node && \
  find /out -exec touch -h -d @0 {} +

FROM nginx:alpine-slim AS runtime-config

COPY nginx.conf /out/etc/nginx/templates/nginx.conf.template
COPY --chmod=755 start.sh /out/usr/local/bin/start.sh

RUN find /out -exec touch -h -d @0 {} +

FROM nginx:alpine-slim AS runtime

ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/

RUN touch /tmp/.apk-start && \
  apk add --no-cache bash tini nodejs-current && \
  rm /usr/bin/node /var/log/apk.log && \
  mkdir /app && \
  find / -xdev -newer /tmp/.apk-start -exec touch -h -d @0 {} + && \
  rm /tmp/.apk-start && \
  touch -d @0 /tmp

COPY --link --from=runtime-node /out/ /
COPY --link --from=runtime-config /out/ /

WORKDIR /app

ENV NODE_ENV=production
ENV DIST_DIR=.

COPY --from=build /build/static /app
COPY --from=build /build/dist/client /app/private/client
COPY --from=build /build/dist/server /app/private/server
COPY --from=build /build/dist/backend /app/private/backend
COPY --from=build /build/drizzle /app/private/backend/migrations

STOPSIGNAL SIGTERM

ENTRYPOINT ["/sbin/tini", "--", "/docker-entrypoint.sh"]
CMD ["start.sh"]
