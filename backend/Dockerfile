FROM node:22-alpine AS development

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile=false

COPY . .
RUN pnpm prisma:generate
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start:prod"]
