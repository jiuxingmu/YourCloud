# syntax=docker/dockerfile:1
# Build from repository root so `file:../../packages/sdk` in package.json resolves:
#   docker build -f clients/web/Dockerfile .

FROM node:20-alpine AS builder

WORKDIR /app/clients/web
COPY packages/sdk /app/packages/sdk
COPY clients/web/package.json clients/web/package-lock.json ./

RUN npm ci

COPY clients/web/ ./

ARG VITE_API_BASE_URL
ARG VITE_BASE_PATH=/
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
RUN npm run build

FROM nginx:1.27-alpine
COPY clients/web/nginx/default.conf /etc/nginx/conf.d/default.conf
RUN mkdir -p /usr/share/nginx/html/cloud
COPY --from=builder /app/clients/web/dist /usr/share/nginx/html/cloud
EXPOSE 80
