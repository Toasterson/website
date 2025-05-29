# Registry Configuration Summary

## Container Registry Paths

This repository is configured to use the following GitHub Container Registry paths:

### Container Images
- **Registry**: `ghcr.io/toasterson/website:lume`
- **Base Path**: `ghcr.io/toasterson/website`
- **Default Tag**: `lume`

### Helm Charts
- **Registry**: `oci://ghcr.io/toasterson/website/helm`
- **Chart Name**: `lume-site`

## Tagging Strategy

### Container Images
| Branch/Event | Tag Format | Example |
|-------------|------------|---------|
| Main branch | `lume` | `ghcr.io/toasterson/website:lume` |
| Feature branch | `{branch}-lume` | `ghcr.io/toasterson/website:feature-lume` |
| Pull request | `pr-{number}-lume` | `ghcr.io/toasterson/website:pr-123-lume` |
| Git tag | `{version}-lume` | `ghcr.io/toasterson/website:v1.0.0-lume` |
| SHA commit | `{branch}-lume-{sha}` | `ghcr.io/toasterson/website:main-lume-abc1234` |

### Helm Charts
| Event | Version Format | Example |
|-------|---------------|---------|
| Git tag | `{version}` | `lume-site-1.0.0.tgz` |
| Branch commit | `0.1.0-{sha}` | `lume-site-0.1.0-abc1234.tgz` |

## Configuration Files

### Helm Chart (`helm/lume-site/values.yaml`)
```yaml
image:
  repository: ghcr.io/toasterson/website
  tag: "lume"
```

### Flux GitOps (`flux/helmrepository.yaml`)
```yaml
spec:
  type: oci
  url: oci://ghcr.io/toasterson/website/helm
```

### GitHub Actions Environment Variables
```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: toasterson/website
  CHART_REPO: toasterson/website/helm
```

### Makefile Defaults
```makefile
DOCKER_REGISTRY ?= ghcr.io
DOCKER_ORG ?= toasterson
IMAGE_NAME ?= website
IMAGE_TAG ?= lume
```

## Lowercase Conversion

All registry operations automatically convert uppercase letters to lowercase to comply with container registry standards:

- **Input**: `ghcr.io/Toasterson/website:lume`
- **Output**: `ghcr.io/toasterson/website:lume`

This is handled by:
1. Helm template helpers
2. Makefile shell commands
3. GitHub Actions workflow steps
4. Utility scripts

## Verification

Run the verification script to check configuration:
```bash
./scripts/verify-config.sh
```

## Usage Examples

### Docker Commands
```bash
# Build
docker build -t ghcr.io/toasterson/website:lume .

# Run
docker run -p 8080:8080 ghcr.io/toasterson/website:lume

# Push
docker push ghcr.io/toasterson/website:lume
```

### Helm Commands
```bash
# Install from OCI registry
helm install lume-site oci://ghcr.io/toasterson/website/helm/lume-site --version 0.1.0

# Install from local chart
helm install lume-site ./helm/lume-site \
  --set image.repository=ghcr.io/toasterson/website \
  --set image.tag=lume
```

### Flux Deployment
```bash
# Apply Flux configuration
kubectl apply -f flux/

# Check status
flux get helmreleases -n lume-site
```

This configuration provides a clean, organized structure under the `toasterson/website` repository with proper artifact separation and automated lowercase handling for container registry compliance.