# Changes Made for Toasterson Organization

## Repository Configuration Updates

All files have been updated to use the correct GitHub organization and repository:
- **Organization**: `Toasterson` 
- **Repository**: `website`
- **Maintainer**: Till Wegmüller <toasterson@gmail.com>

## Image Registry Configuration

Container images now use the website repository structure with lume tag:
- **Before**: `ghcr.io/Toasterson/lume-site:latest`
- **After**: `ghcr.io/toasterson/website:lume`

Helm charts now use the website repository structure:
- **Before**: `oci://ghcr.io/toasterson/helm-charts`
- **After**: `oci://ghcr.io/toasterson/website/helm`

## Files Modified

### Helm Chart (`website/helm/lume-site/`)
- `Chart.yaml`: Updated repository URLs and maintainer information
- `values.yaml`: Set default image repository to `ghcr.io/toasterson/website` with tag `lume`
- `templates/_helpers.tpl`: Added `lume-site.imageRepository` helper for lowercase conversion
- `templates/deployment.yaml`: Uses lowercase image repository helper

### Flux Configuration (`website/flux/`)
- `helmrepository.yaml`: OCI registry URL updated to `oci://ghcr.io/toasterson/website/helm`
- `helmrelease.yaml`: Image repository set to `ghcr.io/toasterson/website` with tag `lume`

### GitHub Actions Workflows (`website/.github/workflows/`)
- `docker.yml`: 
  - Image name set to `toasterson/website`
  - Updated tagging strategy to use `lume` suffix/tag
  - Added lowercase conversion step
- `helm.yml`:
  - Chart repository set to `toasterson/website/helm`
  - Added lowercase conversion for chart pushes
- `ci-cd.yml`:
  - Updated both image and chart repository paths
  - Updated tagging strategy for `lume` tags
  - Added lowercase conversion steps for all operations

### Configuration Files
- `Makefile`: 
  - Default organization set to `toasterson`
  - Image name changed to `website` with default tag `lume`
  - Helm chart repository path updated to `website/helm`
  - All docker and helm commands use `$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')` for lowercase conversion
- `skaffold.yaml`: Updated image repository references to use `ghcr.io/toasterson/website:lume`
- `DEPLOYMENT.md`: Updated all example commands and references

### Scripts
- `scripts/ensure-lowercase.sh`: New utility script for ensuring lowercase image names in CI/CD

## Lowercase Conversion Strategy

Multiple approaches implemented to ensure container registry compliance:

1. **Helm Templates**: `lume-site.imageRepository` helper function
2. **Makefile**: Shell command `tr '[:upper:]' '[:lower:]'` for all Docker operations
3. **GitHub Actions**: Dedicated steps to convert image names to lowercase
4. **Utility Script**: `ensure-lowercase.sh` for manual operations

## Key Benefits

- **Registry Compliance**: All image names are lowercase as required by container registries
- **Consistent Naming**: Unified approach across all deployment methods
- **Automation**: CI/CD pipelines handle lowercase conversion automatically
- **Flexibility**: Manual operations supported via Makefile and scripts

## Registry Path Structure

The new structure organizes artifacts under the website repository:
- **Container Images**: `ghcr.io/toasterson/website:lume`
- **Helm Charts**: `oci://ghcr.io/toasterson/website/helm`

This provides better organization and follows the repository-centric approach for artifact storage.

## Verification Commands

Test the setup with:
```bash
# Build and test locally
make docker-build
make helm-template

# Verify lowercase conversion
./scripts/ensure-lowercase.sh ghcr.io/Toasterson/website

# Test with new paths
docker build -t ghcr.io/toasterson/website:lume website/
```

All references now correctly point to the Toasterson/website repository structure with proper lowercase handling for container registry operations.