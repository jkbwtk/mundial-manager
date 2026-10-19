#!/bin/bash

/docker-entrypoint.sh nginx -g 'daemon off;' &
nginx_pid=$!

(cd /app/private && exec node backend/server.js) &
node_pid=$!

stop() {
  kill -QUIT "$nginx_pid" 2>/dev/null
  kill -TERM "$node_pid" 2>/dev/null
}

trap stop TERM INT QUIT

wait -n
code=$?

stop
wait

exit "$code"
