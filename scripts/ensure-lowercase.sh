#!/bin/bash
set -euo pipefail

# Script to ensure lowercase image names for container registries
# Usage: ./ensure-lowercase.sh <image-name>

IMAGE_NAME="${1:-}"

if [ -z "$IMAGE_NAME" ]; then
    echo "Usage: $0 <image-name>"
    echo "Example: $0 ghcr.io/Toasterson/lume-site"
    exit 1
fi

# Convert to lowercase
LOWERCASE_IMAGE=$(echo "$IMAGE_NAME" | tr '[:upper:]' '[:lower:]')

# Output the lowercase image name
echo "$LOWERCASE_IMAGE"

# If running in GitHub Actions, set as output
if [ -n "${GITHUB_OUTPUT:-}" ]; then
    echo "lowercase-image=$LOWERCASE_IMAGE" >> "$GITHUB_OUTPUT"
fi

# If running in GitHub Actions, also set as environment variable
if [ -n "${GITHUB_ENV:-}" ]; then
    echo "LOWERCASE_IMAGE=$LOWERCASE_IMAGE" >> "$GITHUB_ENV"
fi