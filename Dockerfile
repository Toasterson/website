# Production stage — just serve the pre-built site
# The site is built by CI (deno task build) and passed in as build context
FROM cgr.dev/chainguard/nginx:latest

# Copy pre-built site
COPY _site /usr/share/nginx/html

EXPOSE 8080

USER nginx
