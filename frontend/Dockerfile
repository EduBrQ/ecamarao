# Multi-stage build for the React + Vite SPA served by nginx
FROM node:22-alpine AS builder

WORKDIR /app

# Left empty on purpose: the app already falls back to same-origin relative
# paths in production builds (see src/services/backendApi.ts) and prefixes
# every call with /api itself, so nginx can proxy /api straight through.
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json vite.config.ts index.html eslint.config.js ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
