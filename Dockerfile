# syntax=docker/dockerfile:1

# ---- build: compile the app and pre-compress it ------------------------------------------------
FROM node:24-alpine AS build
WORKDIR /app

# Dependencies first, so this layer is reused until the lockfile changes.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

# Empty means the app calls /api, /auth and /users on its own origin, which nginx proxies to the
# gateway. Set it only to bake in a different gateway address.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build \
 && find dist -type f \( -name '*.js' -o -name '*.css' -o -name '*.svg' -o -name '*.html' \) \
      -exec gzip -9 -k {} +

# ---- runtime: nginx serving the files and proxying the API, as a non-root user -----------------
# The official slim image is about 8 MB smaller than the "unprivileged" variant. Running as the
# `nginx` user needs the pid file and temp paths moved to /tmp (see docker/nginx.conf) and the
# config directory made writable for the template step.
FROM nginx:stable-alpine-slim AS runtime

RUN rm -f /etc/nginx/conf.d/default.conf \
 && chown -R nginx:nginx /etc/nginx/conf.d /var/cache/nginx

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY docker/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Where /api, /auth and /users are proxied. The default is the gateway on the backend's network.
ENV API_UPSTREAM=http://gateway:8080
# Makes the image fill ${NGINX_LOCAL_RESOLVERS} from /etc/resolv.conf, which the config needs to look
# the gateway up at request time.
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
