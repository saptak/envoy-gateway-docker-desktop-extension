#!/bin/bash

set -e

echo "🚀 Starting Envoy Gateway Extension Staging Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Kind is installed
if ! command -v kind &> /dev/null; then
    print_status "Installing Kind..."
    # On macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install kind
        else
            # Download binary directly
            curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-darwin-amd64
            chmod +x ./kind
            sudo mv ./kind /usr/local/bin/kind
        fi
    else
        # Download binary for other platforms
        curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
        chmod +x ./kind
        sudo mv ./kind /usr/local/bin/kind
    fi
    print_success "Kind installed successfully"
fi

# Check if Helm is installed
if ! command -v helm &> /dev/null; then
    print_status "Installing Helm..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install helm
        else
            curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
        fi
    else
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    fi
    print_success "Helm installed successfully"
fi

# Create Kind cluster config
print_status "Creating Kind cluster configuration..."
cat > kind-config.yaml << EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
name: envoy-gateway-staging
nodes:
- role: control-plane
  image: kindest/node:v1.29.0
  extraPortMappings:
  - containerPort: 8080
    hostPort: 8080
    protocol: TCP
  - containerPort: 443
    hostPort: 443
    protocol: TCP
  - containerPort: 80
    hostPort: 80
    protocol: TCP
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
EOF

# Create Kind cluster
print_status "Creating Kind cluster: envoy-gateway-staging..."
kind create cluster --config=kind-config.yaml --wait=5m || {
    print_warning "Cluster might already exist, checking..."
    kubectl cluster-info --context kind-envoy-gateway-staging
}

# Wait for cluster to be ready
print_status "Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

# Install Envoy Gateway
print_status "Installing Envoy Gateway..."
kubectl apply -f https://github.com/envoyproxy/gateway/releases/download/v1.2.0/install.yaml

# Wait for Envoy Gateway to be ready
print_status "Waiting for Envoy Gateway to be ready..."
kubectl wait --timeout=5m -n envoy-gateway-system deployment/envoy-gateway --for=condition=Available

# Install Load Balancer (MetalLB) for Kind
print_status "Installing MetalLB for Load Balancer support..."
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.14.5/config/manifests/metallb-native.yaml
kubectl wait --namespace metallb-system --for=condition=ready pod --selector=app=metallb --timeout=90s

# Configure MetalLB
print_status "Configuring MetalLB IP pool..."
docker network inspect -f '{{.IPAM.Config}}' kind || true
cat > metallb-config.yaml << EOF
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: envoy-gateway-pool
  namespace: metallb-system
spec:
  addresses:
  - 172.18.255.200-172.18.255.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: envoy-gateway-l2
  namespace: metallb-system
spec:
  ipAddressPools:
  - envoy-gateway-pool
EOF
kubectl apply -f metallb-config.yaml

print_success "Staging cluster setup complete!"
print_status "Cluster info:"
kubectl cluster-info --context kind-envoy-gateway-staging

# Export cluster info for tests
export KUBECONFIG=$(kind get kubeconfig --name envoy-gateway-staging --internal)
echo "KUBECONFIG exported for integration tests"
