# Envoy Gateway Docker Desktop Extension

## Local Development

This directory contains the source code for the Envoy Gateway Docker Desktop Extension.

### Prerequisites

- Node.js 18+
- Docker Desktop 4.8+
- npm 8+

### Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Install in Docker Desktop:
   ```bash
   npm run docker:install
   ```

### Project Structure

```
.
├── src/
│   ├── backend/          # Backend API server
│   ├── frontend/         # React frontend application
│   └── shared/           # Shared utilities and types
├── docs/                 # Documentation
├── tests/                # Test files
├── scripts/              # Build and deployment scripts
├── examples/             # Example configurations
└── package.json          # Project configuration
```

### Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=8080
LOG_LEVEL=debug
DOCKER_SOCKET=/var/run/docker.sock
```

### Testing

Run tests with:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Building for Production

```bash
npm run build
docker build -t envoy-gateway-extension .
```

For detailed documentation, see the [docs](./docs) directory.
