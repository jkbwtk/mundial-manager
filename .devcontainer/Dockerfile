FROM mcr.microsoft.com/devcontainers/javascript-node:26-trixie

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends chromium pre-commit \
  && rm -rf /var/lib/apt/lists/*

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm uninstall -g pnpm \
  && npm install -g corepack --no-audit --no-fund \
  && corepack enable pnpm

RUN mkdir -p /commandhistory /home/node/.claude /home/node/.local/share/pnpm/store \
  && touch /commandhistory/.zsh_history \
  && chown -R node:node /commandhistory /home/node/.claude /home/node/.local \
  && echo 'HISTFILE=/commandhistory/.zsh_history' >> /home/node/.zshrc \
  && echo 'alias pn=pnpm' >> /home/node/.zshrc \
  && chsh -s /usr/bin/zsh node
