# Build stage with Deno
FROM denoland/deno:1.39.0 as builder

WORKDIR /app

# Copy dependency files
COPY deno.json deno.lock* ./
COPY package.json ./

# Cache dependencies
RUN deno cache --reload deno.json

# Copy source code
COPY . .

# Build the static site
RUN deno task build

# Production stage with Chainguard nginx
FROM cgr.dev/chainguard/nginx:latest

# Copy built site from builder stage
COPY --from=builder /app/_site /usr/share/nginx/html

# Copy nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

# Chainguard nginx runs as non-root by default
USER nginx