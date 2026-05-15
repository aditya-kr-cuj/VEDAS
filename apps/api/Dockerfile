FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web-admin/package.json apps/web-admin/package.json
COPY packages/common/package.json packages/common/package.json
RUN npm ci --legacy-peer-deps

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
RUN npm run build --workspace @vedas/api

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/package-lock.json /app/package-lock.json
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/src /app/apps/api/src
EXPOSE 4000
CMD ["sh", "-c", "npm run db:migrate --workspace @vedas/api && npm run db:seed-super-admin --workspace @vedas/api && npm run start --workspace @vedas/api"]
