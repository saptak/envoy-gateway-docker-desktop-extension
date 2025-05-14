#!/bin/bash

set -e

echo "🚀 Starting Envoy Gateway Extension Staging Deployment on Docker Desktop Kubernetes"
echo "================================================================================"

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

# Check if we're connected to Docker Desktop Kubernetes
print_status "Verifying Docker Desktop Kubernetes connection..."
kubectl cluster-info | grep -q "127.0.0.1" || {
    print_error "Not connected to Docker Desktop Kubernetes. Please ensure Kubernetes is enabled in Docker Desktop."
    exit 1
}

print_success "Connected to Docker Desktop Kubernetes"

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

# Check if the cluster is ready
print_status "Waiting for cluster to be ready..."
kubectl wait --for=condition=Ready nodes --all --timeout=300s

# Install Envoy Gateway
print_status "Installing Envoy Gateway..."
# Check if already installed
if kubectl get namespace envoy-gateway-system 2>/dev/null; then
    print_warning "Envoy Gateway namespace already exists, checking installation..."
    if kubectl get deployment envoy-gateway -n envoy-gateway-system 2>/dev/null; then
        print_status "Envoy Gateway already installed, checking status..."
    else
        print_status "Installing Envoy Gateway..."
        kubectl apply -f https://github.com/envoyproxy/gateway/releases/download/v1.2.0/install.yaml
    fi
else
    kubectl apply -f https://github.com/envoyproxy/gateway/releases/download/v1.2.0/install.yaml
fi

# Wait for Envoy Gateway to be ready
print_status "Waiting for Envoy Gateway to be ready..."
kubectl wait --timeout=5m -n envoy-gateway-system deployment/envoy-gateway --for=condition=Available

# For Docker Desktop, we don't need MetalLB as services will get automatic LoadBalancer support
print_status "Checking LoadBalancer support..."
kubectl get nodes -o wide

print_success "Staging cluster setup complete on Docker Desktop Kubernetes!"
print_status "Cluster info:"
kubectl cluster-info

# Create namespace for our extension
print_status "Creating namespace for Envoy Gateway Extension..."
kubectl create namespace envoy-gateway-extension --dry-run=client -o yaml | kubectl apply -f -

print_success "✅ Docker Desktop Kubernetes cluster ready for Envoy Gateway Extension!"
print_status "Namespace 'envoy-gateway-extension' created"
print_status "Envoy Gateway installed and running"

# Show current status
print_status "Current cluster status:"
kubectl get pods -n envoy-gateway-system
kubectl get all -n envoy-gateway-extension || echo "No resources yet in envoy-gateway-extension namespace"
