# # front-end/Dockerfile (npm + Node 20)
# FROM node:20-alpine AS builder
# WORKDIR /app/front-end

# RUN apk add --no-cache python3 make g++ bash

# # copy package manifests for caching
# COPY front-end/package*.json ./

# # install dependencies (dev deps are needed to build)
# RUN npm ci

# # copy source and studio (so ../studio imports work)
# COPY front-end/ ./
# COPY studio/ ../studio/

# # --- TEMP: check whether build-time env vars are present (DO NOT print secrets) ---
# RUN if [ -n "${NUXT_SUPABASE_URL:-}" ]; then echo "BUILD: NUXT_SUPABASE_URL=SET"; else echo "BUILD: NUXT_SUPABASE_URL=NOT_SET"; fi
# RUN if [ -n "${NUXT_SUPABASE_ANON_KEY:-}" ]; then echo "BUILD: NUXT_SUPABASE_ANON_KEY=SET"; else echo "BUILD: NUXT_SUPABASE_ANON_KEY=NOT_SET"; fi
# # -------------------------------------------------------------------------------

# # build
# RUN npm run build

# # ---------- runner ----------
# FROM node:20-alpine AS runner
# WORKDIR /app/front-end

# # install python runtime and pip (for running tests / user code)
# RUN apk add --no-cache python3 py3-pip

# # create non-root user
# RUN addgroup -S app && adduser -S app -G app

# # copy runtime artifacts (as before)
# COPY --from=builder /app/front-end/.output ./.output
# COPY --from=builder /app/front-end/node_modules ./node_modules
# COPY --from=builder /app/front-end/package.json ./package.json

# # if you have a Python requirements file (optional), copy and install:
# # COPY front-end/requirements.txt ./requirements.txt
# # RUN pip3 install --no-cache-dir -r requirements.txt

# ENV NODE_ENV=production
# ENV NUXT_HOST=0.0.0.0
# ENV NUXT_PORT=3000

# EXPOSE 3000
# USER app

# CMD ["node", ".output/server/index.mjs"]


# front-end/Dockerfile (npm + Node 20)
FROM node:20-alpine AS builder
WORKDIR /app/front-end

# ---------------------------------------------------
# Build-time arguments for ALL your environment vars
# ---------------------------------------------------
ARG NUXT_SITE_BASE_URL
ARG NUXT_SITE_DOMAIN
ARG NUXT_SUPABASE_URL
ARG NUXT_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG SUPABASE_URL
ARG NUXT_UMAMI_ID
ARG NUXT_UMAMI_HOST
ARG SEED_SYSTEM_EMAIL
ARG SEED_SYSTEM_NAME

# ---------------------------------------------------
# Export them as ENV so Nuxt sees them during build
# ---------------------------------------------------
ENV NUXT_SITE_BASE_URL=${NUXT_SITE_BASE_URL}
ENV NUXT_SITE_DOMAIN=${NUXT_SITE_DOMAIN}
ENV NUXT_SUPABASE_URL=${NUXT_SUPABASE_URL}
ENV NUXT_SUPABASE_ANON_KEY=${NUXT_SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV SUPABASE_URL=${SUPABASE_URL}
ENV NUXT_UMAMI_ID=${NUXT_UMAMI_ID}
ENV NUXT_UMAMI_HOST=${NUXT_UMAMI_HOST}
ENV SEED_SYSTEM_EMAIL=${SEED_SYSTEM_EMAIL}
ENV SEED_SYSTEM_NAME=${SEED_SYSTEM_NAME}

RUN apk add --no-cache python3 make g++ bash

COPY front-end/package*.json ./
RUN npm ci

COPY front-end/ ./
COPY studio/ ../studio/

# (Optional) debug these during build
# RUN echo "BUILD NUXT_SUPABASE_URL: ${NUXT_SUPABASE_URL}"
# RUN echo "BUILD SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}"

RUN npm run build

# ---------------------------------------------------
# Runner stage
# ---------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app/front-end

RUN apk add --no-cache python3 py3-pip
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/front-end/.output ./.output
COPY --from=builder /app/front-end/node_modules ./node_modules
COPY --from=builder /app/front-end/package.json ./package.json

# Runtime environment (same as build-time)
ENV NUXT_SITE_BASE_URL=${NUXT_SITE_BASE_URL}
ENV NUXT_SITE_DOMAIN=${NUXT_SITE_DOMAIN}
ENV NUXT_SUPABASE_URL=${NUXT_SUPABASE_URL}
ENV NUXT_SUPABASE_ANON_KEY=${NUXT_SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV SUPABASE_URL=${SUPABASE_URL}
ENV NUXT_UMAMI_ID=${NUXT_UMAMI_ID}
ENV NUXT_UMAMI_HOST=${NUXT_UMAMI_HOST}
ENV SEED_SYSTEM_EMAIL=${SEED_SYSTEM_EMAIL}
ENV SEED_SYSTEM_NAME=${SEED_SYSTEM_NAME}

ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

EXPOSE 3000
USER app

CMD ["node", ".output/server/index.mjs"]
