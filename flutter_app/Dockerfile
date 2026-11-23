# CA7 website: the Flutter web app, served by nginx.
# nginx also forwards /api, /admin and friends to the backend, so the site and the API share one address.
FROM debian:bookworm-slim AS build
ARG FLUTTER_VERSION=3.50.1
RUN apt-get update && apt-get install -y --no-install-recommends curl git xz-utils unzip ca-certificates libglu1-mesa && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER_VERSION}-stable.tar.xz | tar -xJ -C /opt \
 && git config --global --add safe.directory /opt/flutter
ENV PATH=/opt/flutter/bin:$PATH FLUTTER_ALLOW_ROOT=1
RUN flutter config --no-analytics >/dev/null && flutter precache --web
WORKDIR /app
COPY pubspec.yaml pubspec.lock ./
RUN --mount=type=cache,target=/root/.pub-cache flutter pub get
COPY . .
# CA7_API empty = same address as the site (nginx forwards /api). Set a full URL when the backend lives elsewhere.
ARG CA7_API=
ARG CA7_CHAT_HOSTS=ca7.io,ca7.nl,ca7.be
ARG CA7_CLOUD_HOST=cloud.ca7.io
# --no-wasm-dry-run: Flutter otherwise compiles everything a second time as a WebAssembly test (half the build time)
RUN --mount=type=cache,target=/root/.pub-cache flutter build web --release --no-web-resources-cdn --no-wasm-dry-run \
    --dart-define=CA7_API=${CA7_API} --dart-define=CA7_CHAT_HOSTS=${CA7_CHAT_HOSTS} --dart-define=CA7_CLOUD_HOST=${CA7_CLOUD_HOST}

# only the built website (./deploy.sh copies these files to the server without a new image)
FROM scratch AS webfiles
COPY --from=build /app/build/web /

FROM nginx:1.27-alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/build/web /usr/share/nginx/html
ENV BACKEND_URL=http://backend:3000
EXPOSE 80
