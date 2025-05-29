#!/bin/bash
set -euo pipefail

# Script to verify the new registry configuration
# Checks that all files are correctly configured for ghcr.io/toasterson/website:lume

echo "🔍 Verifying registry configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Expected values
EXPECTED_IMAGE_REPO="ghcr.io/toasterson/website"
EXPECTED_IMAGE_TAG="lume"
EXPECTED_CHART_REPO="oci://ghcr.io/toasterson/website/helm"

# Track errors
ERRORS=0

check_file() {
    local file="$1"
    local pattern="$2"
    local description="$3"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ File not found: $file${NC}"
        ((ERRORS++))
        return
    fi
    
    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✅ $description${NC}"
    else
        echo -e "${RED}❌ $description - Pattern not found in $file${NC}"
        echo -e "${YELLOW}   Expected: $pattern${NC}"
        ((ERRORS++))
    fi
}

echo ""
echo "📋 Checking Helm Chart configuration..."
check_file "helm/lume-site/values.yaml" "repository: ghcr.io/toasterson/website" "Helm values.yaml has correct image repository"
check_file "helm/lume-site/values.yaml" 'tag: "lume"' "Helm values.yaml has correct image tag"
check_file "helm/lume-site/Chart.yaml" "github.com/Toasterson/website" "Helm Chart.yaml has correct repository URL"

echo ""
echo "🚀 Checking Flux configuration..."
check_file "flux/helmrepository.yaml" "oci://ghcr.io/toasterson/website/helm" "Flux HelmRepository has correct OCI URL"
check_file "flux/helmrelease.yaml" "repository: ghcr.io/toasterson/website" "Flux HelmRelease has correct image repository"
check_file "flux/helmrelease.yaml" "tag: lume" "Flux HelmRelease has correct image tag"

echo ""
echo "⚙️ Checking GitHub Actions workflows..."
check_file ".github/workflows/docker.yml" "IMAGE_NAME: toasterson/website" "Docker workflow has correct image name"
check_file ".github/workflows/helm.yml" "CHART_REPO: toasterson/website/helm" "Helm workflow has correct chart repository"
check_file ".github/workflows/ci-cd.yml" "IMAGE_NAME: toasterson/website" "CI/CD workflow has correct image name"
check_file ".github/workflows/ci-cd.yml" "CHART_REPO: toasterson/website/helm" "CI/CD workflow has correct chart repository"

echo ""
echo "🔧 Checking development configuration..."
check_file "Makefile" "IMAGE_NAME ?= website" "Makefile has correct image name"
check_file "Makefile" "IMAGE_TAG ?= lume" "Makefile has correct default image tag"
check_file "skaffold.yaml" "ghcr.io/toasterson/website" "Skaffold has correct image repository"

echo ""
echo "📚 Checking documentation..."
check_file "DEPLOYMENT.md" "ghcr.io/toasterson/website:lume" "Documentation has correct image reference"
check_file "CHANGES.md" "ghcr.io/toasterson/website" "Changes documentation is updated"

# Test lowercase conversion
echo ""
echo "🔄 Testing lowercase conversion..."
if [ -f "scripts/ensure-lowercase.sh" ]; then
    chmod +x scripts/ensure-lowercase.sh
    RESULT=$(./scripts/ensure-lowercase.sh "ghcr.io/Toasterson/website")
    if [ "$RESULT" = "ghcr.io/toasterson/website" ]; then
        echo -e "${GREEN}✅ Lowercase conversion script works correctly${NC}"
    else
        echo -e "${RED}❌ Lowercase conversion failed. Got: $RESULT${NC}"
        ((ERRORS++))
    fi
else
    echo -e "${RED}❌ Lowercase conversion script not found${NC}"
    ((ERRORS++))
fi

# Summary
echo ""
echo "📊 Summary:"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Configuration is correct.${NC}"
    echo ""
    echo "Ready to deploy with:"
    echo "  • Container images: $EXPECTED_IMAGE_REPO:$EXPECTED_IMAGE_TAG"
    echo "  • Helm charts: $EXPECTED_CHART_REPO"
else
    echo -e "${RED}❌ Found $ERRORS error(s). Please fix the issues above.${NC}"
    exit 1
fi