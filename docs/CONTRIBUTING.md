# Contributing to Envoy Gateway Docker Desktop Extension

## Welcome Contributors!

We welcome contributions from the community! This guide will help you get started with contributing to the Envoy Gateway Docker Desktop Extension.

## Table of Contents

- [Development Setup](#development-setup)
- [Contribution Workflow](#contribution-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community Guidelines](#community-guidelines)

## Development Setup

### Prerequisites

- Node.js 18+ and npm 8+
- Docker Desktop 4.8+
- Git
- TypeScript familiarity

### Quick Start

```bash
# 1. Fork and clone the repository
git clone https://github.com/[your-fork]/envoy-gateway-docker-desktop-extension.git
cd envoy-gateway-docker-desktop-extension

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Load extension in Docker Desktop
# Extensions -> Add Extension -> Install from Local Folder
```

### Development Environment

```bash
# Install development dependencies
npm install --save-dev

# Start with hot reload
npm run dev:watch

# Run tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Contribution Workflow

### 1. Issue Discussion

- Check existing issues before creating new ones
- Use issue templates for bugs and feature requests
- Wait for maintainer approval before starting work on large features

### 2. Branch Strategy

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

**Branch Naming Convention:**
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### 3. Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(dashboard): add real-time traffic monitoring
fix(config): resolve YAML parsing error
docs(api): update configuration examples
```

### 4. Pull Request Process

1. **Before Submitting:**
   - Ensure all tests pass (`npm test`)
   - Run linting (`npm run lint`)
   - Update documentation if needed
   - Add tests for new features

2. **PR Template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Unit tests added/updated
   - [ ] Integration tests added/updated
   - [ ] Manual testing performed

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] Tests pass locally
   ```

3. **Review Process:**
   - At least one maintainer review required
   - Address feedback promptly
   - Keep discussions respectful and constructive

## Coding Standards

### TypeScript Guidelines

```typescript
// Use explicit types
interface GatewayConfig {
  name: string;
  namespace: string;
  listeners: Listener[];
}

// Prefer const assertions
const GATEWAY_PORTS = [80, 443] as const;

// Use async/await over promises
async function deployGateway(config: GatewayConfig): Promise<void> {
  // implementation
}
```

### React Components

```tsx
// Use functional components with hooks
import React, { useState, useEffect } from 'react';

interface Props {
  gatewayName: string;
  onUpdate: (config: GatewayConfig) => void;
}

export const GatewayDashboard: React.FC<Props> = ({ gatewayName, onUpdate }) => {
  // Component logic
};
```

### File Organization

```
src/
├── components/          # Reusable UI components
├── pages/              # Main application pages
├── services/           # API and business logic
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── constants/          # Application constants
```

### Naming Conventions

- **Files:** `kebab-case.tsx`, `kebab-case.ts`
- **Components:** `PascalCase`
- **Functions:** `camelCase`
- **Constants:** `SCREAMING_SNAKE_CASE`
- **Types/Interfaces:** `PascalCase`

## Testing Guidelines

### Unit Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { GatewayStatusCard } from '../GatewayStatusCard';

describe('GatewayStatusCard', () => {
  it('should display gateway status', () => {
    render(<GatewayStatusCard status="Running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('should handle status updates', () => {
    const onStatusChange = jest.fn();
    render(<GatewayStatusCard onStatusChange={onStatusChange} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }));
    expect(onStatusChange).toHaveBeenCalledWith('Restarting');
  });
});
```

### Integration Tests

```typescript
import { DockerService } from '../services/DockerService';

describe('DockerService Integration', () => {
  beforeEach(async () => {
    await DockerService.cleanup();
  });

  it('should deploy Envoy Gateway successfully', async () => {
    const config = createTestGatewayConfig();
    const result = await DockerService.deployGateway(config);
    
    expect(result.status).toBe('success');
    expect(result.containerId).toBeDefined();
  });
});
```

### Test Coverage

- Maintain 80%+ test coverage
- Write tests for all public APIs
- Include edge case testing
- Use snapshot testing sparingly

## Documentation

### Code Documentation

```typescript
/**
 * Deploys an Envoy Gateway instance with the provided configuration.
 * 
 * @param config - Gateway configuration object
 * @param options - Deployment options
 * @returns Promise resolving to deployment result
 * 
 * @example
 * ```typescript
 * const config = { name: 'my-gateway', namespace: 'default' };
 * const result = await deployGateway(config);
 * ```
 */
export async function deployGateway(
  config: GatewayConfig,
  options?: DeploymentOptions
): Promise<DeploymentResult> {
  // Implementation
}
```

### README Updates

- Update feature list for new capabilities
- Add usage examples
- Keep screenshots current
- Document breaking changes

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Report inappropriate behavior

### Communication Channels

- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: General questions and ideas
- Slack: Real-time collaboration (invite-only)

### Getting Help

- Check existing documentation first
- Search closed issues and PRs
- Use appropriate issue templates
- Provide minimal reproducible examples

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Annual contributor highlights

## Questions?

Feel free to:
- Open a GitHub Discussion
- Comment on existing issues
- Join our community Slack

Thank you for contributing to make Envoy Gateway more accessible to developers!
