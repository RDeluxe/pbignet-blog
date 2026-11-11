# Image de production du blog : le build Astro, puis nginx qui sert dist/.
# Le build est celui de la prod (pas de BUILD_TARGET : sans /ds/, avec la balise Umami).

FROM node:22-alpine AS build
ARG SITE_URL=https://blog.pierrickbignet.com
ENV SITE_URL=$SITE_URL
RUN npm install -g pnpm@10.28.2
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# nginx alpine, épinglé par digest (nginx:1.29-alpine)
FROM nginx@sha256:5616878291a2eed594aee8db4dade5878cf7edcb475e59193904b198d9b830de
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY redirects/redirects.map /etc/nginx/redirects.map
COPY --from=build /app/dist /usr/share/nginx/html
# nginx tourne sans droits : uid 101 (l'utilisateur nginx de l'image), port 8080
USER 101:101
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
