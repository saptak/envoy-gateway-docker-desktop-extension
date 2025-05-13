# Quick Start Guide

Get up and running with the Envoy Gateway Docker Desktop Extension in under 10 minutes!

## Prerequisites ✅

Before you begin, ensure you have:
- Docker Desktop 4.8+ installed and running
- Kubernetes enabled in Docker Desktop (Settings → Kubernetes → Enable Kubernetes)
- At least 4GB RAM allocated to Docker

## Step 1: Install the Extension (2 minutes)

1. Open Docker Desktop
2. Click **Extensions** in the left sidebar
3. Search for "Envoy Gateway"
4. Click **Install** and wait for completion
5. Click on **Envoy Gateway** to open the extension

![Installation](assets/screenshots/quick-install.png)

## Step 2: Create Your First Gateway (3 minutes)

1. Click **Create Gateway** on the welcome screen
2. Select **Basic HTTP Gateway** template
3. Keep default settings:
   - Name: `my-first-gateway`
   - Port: `8080`
   - Namespace: `envoy-gateway-system`
4. Click **Deploy Gateway**
5. Wait for status to show **Running** ✅

![Gateway Creation](assets/screenshots/quick-gateway.png)

## Step 3: Add a Route (2 minutes)

1. Go to the **Routes** tab
2. Click **Add Route**
3. Configure basic route:
   - Name: `api-route`
   - Path: `/api/*`
   - Backend Service: `httpbin`
   - Port: `8080`
4. Click **Apply Route**

![Route Configuration](assets/screenshots/quick-route.png)

## Step 4: Test Your Setup (2 minutes)

1. Navigate to the **Testing** tab
2. Enter URL: `http://localhost:8080/api/get`
3. Click **Send Request**
4. You should see a successful response! 🎉

![Testing](assets/screenshots/quick-test.png)

## Step 5: Monitor Your Gateway (1 minute)

1. Check the **Monitoring** tab
2. View real-time metrics:
   - Request rate
   - Response times
   - Error rates

![Monitoring](assets/screenshots/quick-monitor.png)

## Quick Commands for Verification

```bash
# Check if your gateway is running
kubectl get gateway -n envoy-gateway-system

# Verify the route
kubectl get httproute -A

# Test directly with curl
curl http://localhost:8080/api/get
```

## What's Next?

Now that you have a basic setup running, explore these features:

### 🛠️ Advanced Configuration
- [Add custom headers and transformations](USER_GUIDE.md#advanced-configuration)
- [Configure rate limiting](USER_GUIDE.md#rate-limiting)
- [Set up authentication](USER_GUIDE.md#security-configuration)

### 🔒 Security Features
- [Enable HTTPS with TLS certificates](USER_GUIDE.md#tls-ssl-configuration)
- [Configure JWT authentication](USER_GUIDE.md#authentication-and-authorization)
- [Set up CORS policies](USER_GUIDE.md#security-configuration)

### 📊 Monitoring & Observability
- [Set up distributed tracing](USER_GUIDE.md#distributed-tracing)
- [Configure alerting](USER_GUIDE.md#monitoring-and-observability)
- [Export metrics to external systems](USER_GUIDE.md#monitoring-and-observability)

### 🚀 Production Readiness
- [Multi-environment management](USER_GUIDE.md#multi-environment-management)
- [Load testing and optimization](USER_GUIDE.md#load-testing)
- [Backup and restore configurations](USER_GUIDE.md#best-practices)

## Common First-Time Issues

### Gateway Stuck in Pending
- **Solution**: Ensure Kubernetes is enabled and running in Docker Desktop
- **Check**: `kubectl cluster-info`

### Routes Return 404
- **Solution**: Verify your backend service is running
- **Check**: Use the Route Tester in the extension

### Can't Access from Browser
- **Solution**: Ensure port 8080 isn't blocked by firewall
- **Check**: Try `curl http://localhost:8080` first

## Need Help?

- 📚 [Full User Guide](USER_GUIDE.md)
- ❓ [FAQ](FAQ.md)
- 🔧 [Troubleshooting](TROUBLESHOOTING.md)
- 💬 [Community Support](https://github.com/envoyproxy/gateway-docker-extension/discussions)

## Example Applications to Try

After completing this quick start, try these example applications:

### 1. Microservices Demo
Deploy a multi-service application with different routes for each service.

### 2. API Versioning
Set up routes for `/api/v1/` and `/api/v2/` pointing to different backend versions.

### 3. Frontend + API
Configure a gateway that serves a React frontend on `/` and API routes on `/api/*`.

### 4. Load Balancing
Create multiple backend instances and configure load balancing between them.

---

**🎉 Congratulations!** You've successfully set up your first Envoy Gateway using the Docker Desktop Extension. The gateway is now ready to handle traffic and can be extended with additional features as needed.

Happy gateway management! 🚀

---

*Estimated completion time: 8-10 minutes*  
*Last updated: [Current Date]*
