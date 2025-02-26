FROM --platform=linux/amd64 node:22-alpine AS base

FROM base AS build

WORKDIR /app

COPY package*.json ./

COPY temp-alarm-firebase-adminsdk.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm run build

FROM base AS release

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=build /app/package*.json ./

COPY --from=build /app/temp-alarm-firebase-adminsdk.json ./

COPY --from=build /app/dist ./dist

COPY --from=build /app/node_modules ./node_modules

ENV TZ=Asia/Bangkok

HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -q --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "dist/main"]