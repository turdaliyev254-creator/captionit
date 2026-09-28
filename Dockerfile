# Build context is the repository root (the renderer imports ../shared).
FROM node:24-bookworm-slim

# ffmpeg for audio extraction/probing; the rest are what Chrome Headless Shell (Remotion) needs on Linux.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg ca-certificates fonts-noto-color-emoji \
      libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 libasound2 libxrandr2 \
      libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libpango-1.0-0 libcairo2 libcups2 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    FFMPEG_PATH=/usr/bin/ffmpeg \
    FFPROBE_PATH=/usr/bin/ffprobe \
    REMOTION_GL=swangle \
    RENDER_CONCURRENCY=2 \
    DATA_DIR=/data

WORKDIR /app
COPY backend/package.json backend/package-lock.json backend/
RUN cd backend && npm ci --omit=dev --ignore-scripts \
    && node -e "require('@remotion/renderer').ensureBrowser().then(() => console.log('chrome ready'))"

COPY shared shared
COPY backend backend

WORKDIR /app/backend
EXPOSE 4000
CMD ["node", "src/server.js"]
