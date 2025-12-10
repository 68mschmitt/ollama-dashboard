# Environment Configuration and Management

**For**: Backend agent  
**Purpose**: Environment variable patterns, configuration management, and deployment best practices

## Overview

Environment configuration allows applications to adapt to different environments (development, production, etc.) without code changes. This guide covers configuration patterns for Node.js applications.

## Environment Variables

### Basic Usage

```javascript
// Reading environment variables
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Using in application
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
});
```

### Type Conversion Helpers

```javascript
// Parse integer with validation
function getEnvInt(key, defaultValue) {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return parsed;
}

// Parse boolean
function getEnvBool(key, defaultValue = false) {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  return value.toLowerCase() === 'true' || value === '1';
}

// Parse JSON
function getEnvJSON(key, defaultValue = {}) {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Environment variable ${key} must be valid JSON`);
  }
}

// Usage
const PORT = getEnvInt('PORT', 3000);
const DEBUG = getEnvBool('DEBUG', false);
const CONFIG = getEnvJSON('APP_CONFIG', { timeout: 30000 });
```

### Required vs Optional Variables

```javascript
// Require specific variables
function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

// Development vs production requirements
function validateConfig() {
  if (process.env.NODE_ENV === 'production') {
    // Strict requirements for production
    requireEnv('DATABASE_URL');
    requireEnv('API_KEY');
    requireEnv('SECRET_KEY');
  }
  
  // Optional in development, required in production
  const dbUrl = process.env.NODE_ENV === 'production'
    ? requireEnv('DATABASE_URL')
    : process.env.DATABASE_URL || 'postgresql://localhost/dev';
}

// Run validation at startup
validateConfig();
```

## .env Files

### Development .env File

```bash
# .env (for local development only)
# DO NOT commit this file to git

# Server configuration
PORT=3000
NODE_ENV=development

# Ollama configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_TIMEOUT=30000

# Feature flags
ENABLE_STREAMING=true
ENABLE_TELEMETRY=false

# Logging
LOG_LEVEL=debug
LOG_FORMAT=pretty

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Loading .env Files (using dotenv)

```javascript
// Load at app startup (earliest possible)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Or with options
require('dotenv').config({
  path: process.env.ENV_FILE || '.env',
  encoding: 'utf8',
  debug: process.env.NODE_ENV === 'development'
});

// Load different files for different environments
const envFile = {
  development: '.env.development',
  test: '.env.test',
  staging: '.env.staging',
  production: '.env.production'
}[process.env.NODE_ENV || 'development'];

require('dotenv').config({ path: envFile });
```

### .env.example File

```bash
# .env.example
# Copy this file to .env and fill in your values
# This file CAN be committed to git

# Server configuration
PORT=3000
NODE_ENV=development

# Ollama configuration (REQUIRED)
OLLAMA_URL=http://localhost:11434
OLLAMA_TIMEOUT=30000

# Feature flags
ENABLE_STREAMING=false
ENABLE_TELEMETRY=false

# Secret keys (REQUIRED in production)
# Generate with: openssl rand -hex 32
SECRET_KEY=
API_KEY=
```

## Configuration Object Pattern

### Centralized Configuration

```javascript
// config/index.js
const config = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // Server
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0',
    trustProxy: process.env.TRUST_PROXY === 'true'
  },
  
  // Ollama API
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT || '30000'),
    retries: parseInt(process.env.OLLAMA_RETRIES || '3')
  },
  
  // Features
  features: {
    streaming: process.env.ENABLE_STREAMING === 'true',
    telemetry: process.env.ENABLE_TELEMETRY === 'true',
    cache: process.env.ENABLE_CACHE !== 'false' // Default true
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enabled: process.env.ENABLE_LOGGING !== 'false'
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  }
};

// Validation
function validateConfig() {
  if (config.isProduction) {
    if (!process.env.SECRET_KEY) {
      throw new Error('SECRET_KEY required in production');
    }
    
    if (config.cors.origin === '*') {
      console.warn('WARNING: CORS set to * in production');
    }
  }
}

validateConfig();

module.exports = config;
```

### Usage in Application

```javascript
// server.js
const config = require('./config');

// Use config object instead of process.env
app.listen(config.server.port, config.server.host, () => {
  console.log(`Server running on ${config.server.host}:${config.server.port}`);
  console.log(`Environment: ${config.env}`);
  console.log(`Ollama URL: ${config.ollama.url}`);
});

// Conditional features
if (config.features.streaming) {
  app.use('/api/stream', streamRouter);
}

if (config.logging.enabled) {
  app.use(loggingMiddleware);
}
```

## Environment-Specific Configuration

### Multi-Environment Setup

```javascript
// config/environments.js
const environments = {
  development: {
    server: {
      port: 3000,
      cors: { origin: '*' }
    },
    logging: {
      level: 'debug',
      format: 'pretty'
    }
  },
  
  test: {
    server: {
      port: 3001,
      cors: { origin: '*' }
    },
    logging: {
      level: 'error',
      enabled: false
    },
    database: {
      url: 'postgresql://localhost/test'
    }
  },
  
  staging: {
    server: {
      port: 8080,
      trustProxy: true
    },
    logging: {
      level: 'info',
      format: 'json'
    }
  },
  
  production: {
    server: {
      port: process.env.PORT,
      trustProxy: true
    },
    logging: {
      level: 'warn',
      format: 'json'
    },
    features: {
      telemetry: true
    }
  }
};

// Merge with environment variables
const currentEnv = process.env.NODE_ENV || 'development';
const config = {
  ...environments[currentEnv],
  // Override with environment variables
  server: {
    ...environments[currentEnv].server,
    port: process.env.PORT || environments[currentEnv].server.port
  }
};

module.exports = config;
```

## Secrets Management

### Development Secrets

```javascript
// config/secrets.js (for development only)
const secrets = {
  apiKey: process.env.API_KEY || 'dev-key-not-for-production',
  secretKey: process.env.SECRET_KEY || 'dev-secret-not-for-production',
  dbPassword: process.env.DB_PASSWORD || 'dev-password'
};

// Validate in production
if (process.env.NODE_ENV === 'production') {
  if (secrets.apiKey.includes('dev-')) {
    throw new Error('Production secrets not configured');
  }
}

module.exports = secrets;
```

### Production Secrets

```bash
# Production: Use environment variables from secure source
# - Docker secrets
# - Kubernetes secrets
# - AWS Secrets Manager
# - Azure Key Vault
# - HashiCorp Vault

# Example: Docker secrets
docker run -e SECRET_KEY=/run/secrets/secret_key myapp

# Example: Kubernetes secrets
kubectl create secret generic app-secrets \
  --from-literal=api-key=xxxxx \
  --from-literal=secret-key=yyyyy
```

### Secrets in Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Use secrets at runtime (not build time!)
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - OLLAMA_URL=http://ollama:11434
    secrets:
      - api_key
      - secret_key
    env_file:
      - .env.production  # For non-secret config

secrets:
  api_key:
    file: ./secrets/api_key.txt
  secret_key:
    file: ./secrets/secret_key.txt
```

## Configuration Best Practices

### Default Values

```javascript
// ✅ GOOD: Provide sensible defaults
const PORT = process.env.PORT || 3000;
const TIMEOUT = parseInt(process.env.TIMEOUT || '30000');

// ❌ BAD: No defaults, app breaks if not set
const PORT = process.env.PORT; // undefined if not set
```

### Type Safety

```javascript
// ✅ GOOD: Parse and validate types
const PORT = parseInt(process.env.PORT || '3000');
if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('Invalid PORT');
}

// ❌ BAD: Using string as number
const PORT = process.env.PORT || 3000; // Could be "3000" (string)
app.listen(PORT); // May cause issues
```

### Documentation

```javascript
// config/index.js
/**
 * Application Configuration
 * 
 * Environment Variables:
 * 
 * SERVER:
 * - PORT (number): Server port (default: 3000)
 * - HOST (string): Server host (default: 0.0.0.0)
 * 
 * OLLAMA:
 * - OLLAMA_URL (string): Ollama API URL (required, default: http://localhost:11434)
 * - OLLAMA_TIMEOUT (number): Request timeout in ms (default: 30000)
 * 
 * FEATURES:
 * - ENABLE_STREAMING (boolean): Enable streaming endpoints (default: false)
 * - ENABLE_TELEMETRY (boolean): Enable telemetry collection (default: false)
 */
```

## Common Pitfalls

### Committing Secrets

```bash
# ❌ BAD: .env file in git
git add .env
git commit -m "Add config"

# ✅ GOOD: .env in .gitignore
# .gitignore
.env
.env.local
.env.*.local
*.key
*.pem
secrets/
```

### Using process.env Everywhere

```javascript
// ❌ BAD: Scattered process.env usage
function connectDatabase() {
  const url = process.env.DATABASE_URL;
  // ...
}

function startServer() {
  const port = process.env.PORT;
  // ...
}

// ✅ GOOD: Centralized configuration
const config = require('./config');

function connectDatabase() {
  const url = config.database.url;
  // ...
}

function startServer() {
  const port = config.server.port;
  // ...
}
```

### Not Validating Configuration

```javascript
// ❌ BAD: No validation, fails at runtime
const config = {
  port: process.env.PORT
};

// ✅ GOOD: Validate at startup
const config = {
  port: parseInt(process.env.PORT || '3000')
};

if (isNaN(config.port)) {
  throw new Error('Invalid PORT configuration');
}

// Fail fast in production
if (process.env.NODE_ENV === 'production' && !process.env.SECRET_KEY) {
  throw new Error('SECRET_KEY required in production');
}
```

## Example: Complete Configuration Module

```javascript
// config/index.js
const path = require('path');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
  require('dotenv').config({ path: path.join(__dirname, '..', envFile) });
}

// Helper functions
function getEnvInt(key, defaultValue) {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`${key} must be a number`);
  }
  return parsed;
}

function getEnvBool(key, defaultValue = false) {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  return value;
}

// Configuration object
const config = {
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  server: {
    port: getEnvInt('PORT', 3000),
    host: process.env.HOST || '0.0.0.0'
  },
  
  ollama: {
    url: process.env.OLLAMA_URL || 'http://localhost:11434',
    timeout: getEnvInt('OLLAMA_TIMEOUT', 30000)
  },
  
  features: {
    streaming: getEnvBool('ENABLE_STREAMING', false),
    telemetry: getEnvBool('ENABLE_TELEMETRY', false)
  }
};

// Validation
if (config.isProduction) {
  requireEnv('SECRET_KEY');
}

module.exports = config;
```

## Loading Instructions

**When to load this context:**
- Setting up environment variables
- Implementing configuration management
- Deploying to different environments
- Managing secrets and API keys
- Validating configuration at startup
- Dockerizing applications

**How to load:**
```bash
read .opencode/context/backend/environment-configuration.md
```

**Also consider loading:**
- `nodejs-patterns.md` - For module patterns
- `express-best-practices.md` - For Express setup

## Summary

**Key Takeaways:**
- Use environment variables for configuration
- Provide sensible defaults for development
- Validate configuration at startup
- Never commit secrets to git
- Centralize configuration in a config module
- Use .env files for local development
- Document all environment variables
- Fail fast for missing required config in production

**Goal**: Build flexible, secure applications that adapt to different environments without code changes.
