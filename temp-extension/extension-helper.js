// Modified version of ApiClient.ts with proper Docker Desktop extension detection
import { createDockerDesktopClient } from '@docker/extension-api-client';

// Create a new file to be added to the UI build
const detectDockerDesktopExtension = () => {
  try {
    // Check if we're running inside Docker Desktop extension environment
    if (window.location.hostname === 'localhost' && window.ddClient) {
      console.log('[API] Running in Docker Desktop Extension environment');
      return true;
    }
  } catch (error) {
    console.log('[API] Not running in Docker Desktop Extension environment');
  }
  return false;
};

// Add this script to the index.html header
const extensionScript = `
<script>
  window.isDockerDesktopExtension = ${detectDockerDesktopExtension()};
  window.apiBaseUrl = window.isDockerDesktopExtension ? '/services/example' : 'http://localhost:8080/api';
  console.log('API Base URL:', window.apiBaseUrl);
</script>
`;

// This script needs to be added to the index.html file in the UI build
console.log('Extension detection script:', extensionScript);
