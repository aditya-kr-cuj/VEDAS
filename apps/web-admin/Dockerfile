FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web-admin/package.json apps/web-admin/package.json
RUN npm install

FROM base AS build
COPY --from=deps /app/node_modules /app/node_modules
COPY . .
WORKDIR /app/apps/web-admin
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/web-admin
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/apps/web-admin/.next /app/apps/web-admin/.next
COPY --from=build /app/apps/web-admin/public /app/apps/web-admin/public
COPY --from=build /app/apps/web-admin/package.json /app/apps/web-admin/package.json
EXPOSE 3000
CMD ["npm", "run", "start"]
