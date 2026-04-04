FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm install

FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
WORKDIR /app/apps/api
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
EXPOSE 4000
CMD ["node", "/app/apps/api/dist/index.js"]
