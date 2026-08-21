FROM mcr.microsoft.com/devcontainers/base:bookworm

COPY install-codex /usr/local/bin/install-codex

RUN set -eux; \
    chmod +x /usr/local/bin/install-codex; \
    CODEX_INSTALL_DIR=/home/vscode/.local/bin install-codex; \
    chown -R vscode:vscode /home/vscode/.local

ENV PATH="/home/vscode/.local/bin:${PATH}"

USER vscode

FROM node:24-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV BUN_INSTALL=/home/node/.bun
ENV PATH=/home/node/.local/bin:${BUN_INSTALL}/bin:${PATH}

COPY .devcontainer/install-codex /usr/local/bin/install-codex

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    gnupg \
    less \
    procps \
    ripgrep \
    sqlite3 \
    unzip \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg \
  && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends google-chrome-stable \
  && mkdir -p /home/node/.bun /home/node/.cache \
  && chown -R node:node /home/node/.bun /home/node/.cache \
  && rm -rf /var/lib/apt/lists/*

USER node

RUN curl -fsSL https://bun.sh/install | bash
RUN install-codex

USER root

RUN bunx playwright install-deps chrome

USER node
