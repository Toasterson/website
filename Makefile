.PHONY: help build serve clean docker-build docker-run helm-install helm-uninstall helm-upgrade flux-install flux-check lint test deploy-local deploy-staging deploy-prod

# Variables
DOCKER_REGISTRY ?= ghcr.io
DOCKER_ORG ?= toasterson
IMAGE_NAME ?= website
IMAGE_TAG ?= lume
HELM_RELEASE ?= lume-site
NAMESPACE ?= lume-site
KUBECONFIG ?= ~/.kube/config

help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
build: ## Build the Lume static site
	@echo "Building Lume site..."
	cd website && deno task build

serve: ## Serve the site locally for development
	@echo "Starting development server..."
	cd website && deno task serve

clean: ## Clean build artifacts
	@echo "Cleaning build artifacts..."
	rm -rf website/_site
	rm -rf website/helm/packaged
	docker system prune -f

test: ## Run tests and linting
	@echo "Running tests..."
	cd website && deno fmt --check
	cd website && deno lint
	helm lint website/helm/lume-site

# Docker commands
docker-build: ## Build Docker image
	@echo "Building Docker image..."
	docker build -t $(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME):$(IMAGE_TAG) website/

docker-run: ## Run Docker container locally
	@echo "Running Docker container..."
	docker run -p 8080:8080 --rm $(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME):$(IMAGE_TAG)

docker-push: ## Push Docker image to registry
	@echo "Pushing Docker image..."
	docker push $(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME):$(IMAGE_TAG)

docker-buildx: ## Build multi-architecture Docker image
	@echo "Building multi-arch Docker image..."
	docker buildx build --platform linux/amd64,linux/arm64 \
		-t $(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME):$(IMAGE_TAG) \
		--push website/

# Helm commands
helm-package: ## Package Helm chart
	@echo "Packaging Helm chart..."
	mkdir -p website/helm/packaged
	helm package website/helm/lume-site --destination website/helm/packaged

helm-install: ## Install Helm chart
	@echo "Installing Helm chart..."
	helm install $(HELM_RELEASE) website/helm/lume-site \
		--namespace $(NAMESPACE) \
		--create-namespace \
		--set image.repository=$(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME) \
		--set image.tag=$(IMAGE_TAG)

helm-upgrade: ## Upgrade Helm release
	@echo "Upgrading Helm release..."
	helm upgrade $(HELM_RELEASE) website/helm/lume-site \
		--namespace $(NAMESPACE) \
		--set image.repository=$(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME) \
		--set image.tag=$(IMAGE_TAG)

helm-uninstall: ## Uninstall Helm release
	@echo "Uninstalling Helm release..."
	helm uninstall $(HELM_RELEASE) --namespace $(NAMESPACE)

helm-template: ## Show rendered Helm templates
	@echo "Rendering Helm templates..."
	helm template $(HELM_RELEASE) website/helm/lume-site \
		--namespace $(NAMESPACE) \
		--set image.repository=$(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME) \
		--set image.tag=$(IMAGE_TAG)

helm-push: ## Push Helm chart to OCI registry
	@echo "Pushing Helm chart to OCI registry..."
	helm push website/helm/packaged/lume-site-*.tgz oci://$(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/website/helm

# Flux commands
flux-install: ## Install Flux GitOps resources
	@echo "Installing Flux resources..."
	kubectl apply -f website/flux/

flux-check: ## Check Flux status
	@echo "Checking Flux status..."
	flux get all -n $(NAMESPACE)

flux-reconcile: ## Force reconcile Flux resources
	@echo "Reconciling Flux resources..."
	flux reconcile helmrelease $(HELM_RELEASE) -n $(NAMESPACE)

flux-uninstall: ## Remove Flux resources
	@echo "Removing Flux resources..."
	kubectl delete -f website/flux/

# Kubernetes commands
k8s-status: ## Show Kubernetes status
	@echo "Kubernetes status:"
	kubectl get pods,svc,ingress -n $(NAMESPACE)

k8s-logs: ## Show application logs
	@echo "Application logs:"
	kubectl logs -f deployment/$(HELM_RELEASE) -n $(NAMESPACE)

k8s-describe: ## Describe Kubernetes resources
	@echo "Describing resources:"
	kubectl describe deployment/$(HELM_RELEASE) -n $(NAMESPACE)

# Deployment commands
deploy-local: docker-build helm-install ## Deploy to local cluster
	@echo "Deployed to local cluster"

deploy-staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	helm upgrade --install $(HELM_RELEASE)-staging website/helm/lume-site \
		--namespace $(NAMESPACE)-staging \
		--create-namespace \
		--set image.repository=$(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME) \
		--set image.tag=develop-lume \
		--set ingress.hosts[0].host=staging.wegmueller.it

deploy-prod: ## Deploy to production environment
	@echo "Deploying to production..."
	helm upgrade --install $(HELM_RELEASE) website/helm/lume-site \
		--namespace $(NAMESPACE) \
		--create-namespace \
		--set image.repository=$(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME) \
		--set image.tag=$(IMAGE_TAG) \
		--set ingress.hosts[0].host=wegmueller.it

# Utility commands
lint: ## Lint all files
	@echo "Linting files..."
	cd website && deno fmt --check
	cd website && deno lint
	helm lint website/helm/lume-site
	yamllint website/flux/
	yamllint .github/workflows/

format: ## Format all files
	@echo "Formatting files..."
	cd website && deno fmt

setup: ## Setup development environment
	@echo "Setting up development environment..."
	@command -v deno >/dev/null 2>&1 || { echo "Please install Deno first"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "Please install Docker first"; exit 1; }
	@command -v helm >/dev/null 2>&1 || { echo "Please install Helm first"; exit 1; }
	@command -v kubectl >/dev/null 2>&1 || { echo "Please install kubectl first"; exit 1; }
	cd website && deno cache --reload deno.json
	@echo "Development environment ready!"

security-scan: ## Run security scans
	@echo "Running security scans..."
	docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
		-v $(PWD):/tmp/app \
		aquasec/trivy image $(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME):$(IMAGE_TAG)

benchmark: ## Run performance benchmarks
	@echo "Running benchmarks..."
	kubectl run --rm -i --tty load-test --image=busybox --restart=Never -- \
		wget -qO- http://$(HELM_RELEASE).$(NAMESPACE).svc.cluster.local/

# Kind (local Kubernetes) commands
kind-create: ## Create local Kind cluster
	@echo "Creating Kind cluster..."
	kind create cluster --name lume-test --config - <<EOF
	kind: Cluster
	apiVersion: kind.x-k8s.io/v1alpha4
	nodes:
	- role: control-plane
	  kubeadmConfigPatches:
	  - |
	    kind: InitConfiguration
	    nodeRegistration:
	      kubeletExtraArgs:
	        node-labels: "ingress-ready=true"
	  extraPortMappings:
	  - containerPort: 80
	    hostPort: 8080
	    protocol: TCP
	  - containerPort: 443
	    hostPort: 8443
	    protocol: TCP
	EOF

kind-delete: ## Delete local Kind cluster
	@echo "Deleting Kind cluster..."
	kind delete cluster --name lume-test

kind-load: docker-build ## Load Docker image into Kind cluster
	@echo "Loading image into Kind cluster..."
	kind load docker-image $(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME):$(IMAGE_TAG) --name lume-test

kind-deploy: kind-load ## Deploy to Kind cluster
	@echo "Deploying to Kind cluster..."
	helm install $(HELM_RELEASE) website/helm/lume-site \
		--namespace $(NAMESPACE) \
		--create-namespace \
		--set image.repository=$(DOCKER_REGISTRY)/$(shell echo $(DOCKER_ORG) | tr '[:upper:]' '[:lower:]')/$(IMAGE_NAME) \
		--set image.tag=$(IMAGE_TAG) \
		--set image.pullPolicy=Never

# Complete workflows
full-build: clean build docker-build helm-package ## Full build pipeline
	@echo "Full build completed!"

full-deploy: full-build deploy-local ## Full build and deploy pipeline
	@echo "Full deployment completed!"

ci: test lint security-scan ## Run CI checks
	@echo "CI checks completed!"