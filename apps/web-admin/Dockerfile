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
RUN npm run build --workspace web-admin

FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/package-lock.json /app/package-lock.json
COPY --from=build /app/apps/web-admin/package.json /app/apps/web-admin/package.json
COPY --from=build /app/apps/web-admin/.next /app/apps/web-admin/.next
COPY --from=build /app/apps/web-admin/public /app/apps/web-admin/public
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace", "web-admin"]
