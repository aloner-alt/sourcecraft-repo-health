FROM node:22-alpine AS development

WORKDIR /app
ARG SOURCECRAFT_CLI_VERSION=0.0.105
ARG TARGETARCH
RUN apk add --no-cache ca-certificates curl \
  && mkdir -p /opt/sourcecraft/bin /tmp/sourcecraft-cli \
  && curl -fsSL "https://s3.yandexcloud.net/sourcecraft-cli/releases/${SOURCECRAFT_CLI_VERSION}/linux_${TARGETARCH}/src.tar.gz" -o /tmp/sourcecraft-cli/src.tar.gz \
  && curl -fsSL "https://s3.yandexcloud.net/sourcecraft-cli/releases/${SOURCECRAFT_CLI_VERSION}/linux_${TARGETARCH}/.checksum" -o /tmp/sourcecraft-cli/.checksum \
  && expected="$(sed 's/^sha256://' /tmp/sourcecraft-cli/.checksum | tr -d '[:space:]')" \
  && actual="$(sha256sum /tmp/sourcecraft-cli/src.tar.gz | cut -d' ' -f1)" \
  && test "$expected" = "$actual" \
  && tar -xzf /tmp/sourcecraft-cli/src.tar.gz -C /opt/sourcecraft/bin src \
  && chmod +x /opt/sourcecraft/bin/src \
  && /opt/sourcecraft/bin/src version \
  && rm -rf /tmp/sourcecraft-cli
ENV PATH="/opt/sourcecraft/bin:${PATH}"
RUN corepack enable

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile=false

COPY . .
RUN pnpm prisma:generate
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start:prod"]
