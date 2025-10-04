# tianji reporter
FROM golang:1.23.11-bookworm AS reporter
WORKDIR /app

COPY ./reporter/ ./reporter/

RUN apt update
RUN cd reporter && CGO_ENABLED=0 GOOS=linux go build -a -ldflags '-extldflags "-static"' -o tianji-reporter .

# Base ------------------------------
# The current Chromium version in Alpine 3.20 is causing timeout issues with Puppeteer. Downgrading to Alpine 3.19 fixes the issue. See #11640, #12637, #12189
FROM node:22.14.0-alpine3.20 AS base

RUN npm install -g pnpm@10.17.1

# For apprise
RUN apk add --update --no-cache python3 py3-pip g++ make

# For puppeteer
RUN apk upgrade --no-cache --available glib \
    && apk add --no-cache \
      chromium-swiftshader \
      ttf-freefont \
      font-noto-emoji \
    && apk add --no-cache \
      --repository=https://dl-cdn.alpinelinux.org/alpine/edge/community \
      font-wqy-zenhei

# For zeromq
RUN apk add --update --no-cache curl cmake

# Tianji frontend ------------------------------
FROM base AS static
WORKDIR /app/tianji

# use with --build-arg VERSION=xxxx
ARG VERSION

COPY . .

RUN pnpm install --filter @tianji/client... --config.dedupe-peer-dependents=false --frozen-lockfile

ENV VITE_VERSION=$VERSION
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN pnpm build:static

# Tianji server ------------------------------
FROM base AS app
WORKDIR /app/tianji

# We don't need the standalone Chromium in alpine.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY . .

RUN pnpm install --filter @tianji/server... --config.dedupe-peer-dependents=false

RUN mkdir -p ./src/server/public
COPY --from=static /app/tianji/geo /app/tianji/geo
COPY --from=static /app/tianji/src/server/public /app/tianji/src/server/public

# Copy reporter binary from reporter stage
COPY --from=reporter /app/reporter/tianji-reporter /usr/local/bin/tianji-reporter
RUN chmod +x /usr/local/bin/tianji-reporter

RUN pnpm build:server

RUN pip install apprise cryptography --break-system-packages

# Copy startup script
COPY ./scripts/start-tianji-container.sh /usr/local/bin/start-tianji-container.sh
RUN chmod +x /usr/local/bin/start-tianji-container.sh


RUN rm -rf ./src/client
RUN rm -rf ./website
RUN rm -rf ./reporter

EXPOSE 12345

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:12345/health || exit 1

CMD ["/usr/local/bin/start-tianji-container.sh"]
