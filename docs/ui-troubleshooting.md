# Envoy Gateway Extension - UI Troubleshooting Guide

## Issue: Extension UI Not Displaying

### Symptoms
- Extension appears in Docker Desktop Extensions list
- Clicking the extension tab shows blank or no content
- No UI elements visible when extension is selected

### Diagnosis Steps

1. **Check Extension Status**
   ```bash
   docker extension ls
   ```
   Look for VM status - should show "Running" not "-"

2. **Test Backend Connection**
   - Simple UI includes automatic connection testing
   - Check activity log for connection status

3. **Verify Container is Running**
   ```bash
   docker context use desktop-linux
   docker ps | grep envoy
   ```

### Common Causes and Solutions

#### 1. Absolute Paths in React Build
**Cause**: React build creates absolute paths (`/static/js/...`) instead of relative paths
**Solution**: Add `"homepage": "./"` to React package.json

#### 2. Docker Desktop Extension Socket Communication
**Cause**: Backend not properly configured for Docker Desktop extension communication
**Solution**: Ensure backend listens on socket path and sets DD_EXTENSION=true

#### 3. Missing UI Files
**Cause**: UI files not properly copied in Docker build
**Solution**: Verify UI files exist in container:
```bash
docker run --rm envoy-gateway-extension:latest ls -la /ui
```

#### 4. Backend Service Not Starting
**Cause**: Backend crashes on startup or can't connect to Kubernetes
**Solution**: Check backend starts in demo mode without Kubernetes

### Testing with Simple UI

The extension includes a fallback simple UI for troubleshooting:
- Displays basic connection status
- Shows backend API connectivity
- Includes manual testing buttons
- Provides activity log for diagnosis

### Recovery Steps

1. **Uninstall Extension**
   ```bash
   docker extension uninstall envoy-gateway-extension
   ```

2. **Rebuild with Fixes**
   ```bash
   ./build-extension.sh
   ```

3. **Reinstall Extension**
   ```bash
   docker extension install envoy-gateway-extension:latest
   ```

### Current Status

- ✅ Extension installs successfully
- ✅ Simple UI implemented as fallback
- ✅ Backend configured for both development and extension modes
- ✅ React build generates relative paths

The simple UI should now display correctly in Docker Desktop. If it works, the issue was with the React build paths, and the full React UI can be enabled by updating the Dockerfile.