# Build and CI/CD Patterns

**For**: DevOps agent  
**Purpose**: Comprehensive guide to build scripts, CI/CD pipelines, deployment strategies, and rollback procedures.

## Overview

This guide covers best practices for organizing build scripts, setting up CI/CD pipelines, deploying Node.js applications, and handling production rollbacks. These patterns ensure reliable, automated, and repeatable deployments.

## Build Scripts in package.json

### Script Organization

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "prebuild": "npm run lint && npm run test",
    "build": "echo 'No build step needed for this project'",
    "postbuild": "echo 'Build complete'",
    "prestart": "npm run build",
    "validate": "npm run lint && npm run format:check && npm run test",
    "clean": "rm -rf node_modules coverage .nyc_output",
    "reset": "npm run clean && npm install"
  }
}
```

### Script Naming Conventions

**Lifecycle Hooks**:
- `pre<script>`: Runs before the script
- `post<script>`: Runs after the script
- Example: `prestart`, `postinstall`, `pretest`

**Common Scripts**:
- `start`: Production server start
- `dev`: Development server with hot reload
- `test`: Run all tests
- `build`: Compile/bundle application
- `lint`: Check code style
- `validate`: Full validation (lint + test)
- `clean`: Remove generated files
- `deploy`: Deploy to production

### Running Scripts in Sequence

```json
{
  "scripts": {
    "validate": "npm run lint && npm run test && npm run build",
    "deploy": "npm run validate && npm run deploy:production"
  }
}
```

**With npm-run-all** (parallel and sequential):
```bash
npm install --save-dev npm-run-all
```

```json
{
  "scripts": {
    "lint:js": "eslint .",
    "lint:css": "stylelint '**/*.css'",
    "lint": "npm-run-all --parallel lint:*",
    "test:unit": "jest unit",
    "test:integration": "jest integration",
    "test": "npm-run-all test:unit test:integration",
    "validate": "npm-run-all --parallel lint test"
  }
}
```

## Environment-Specific Configuration

### Using dotenv for Local Development

**Install dotenv**:
```bash
npm install dotenv
```

**Load in server.js**:
```javascript
// Load environment variables from .env file
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
```

**.env (local development)**:
```bash
PORT=3000
OLLAMA_HOST=http://localhost:11434
NODE_ENV=development
LOG_LEVEL=debug
```

**.env.example (committed to git)**:
```bash
PORT=3000
OLLAMA_HOST=http://localhost:11434
NODE_ENV=development
LOG_LEVEL=info
```

**.gitignore**:
```
.env
.env.local
.env.*.local
```

### Environment-Specific Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "start:dev": "NODE_ENV=development nodemon server.js",
    "start:staging": "NODE_ENV=staging node server.js",
    "start:prod": "NODE_ENV=production node server.js",
    "test": "NODE_ENV=test jest"
  }
}
```

### Cross-Platform Environment Variables

**Problem**: `NODE_ENV=production` doesn't work on Windows

**Solution**: Use cross-env
```bash
npm install --save-dev cross-env
```

```json
{
  "scripts": {
    "start": "cross-env NODE_ENV=production node server.js",
    "dev": "cross-env NODE_ENV=development nodemon server.js"
  }
}
```

## CI/CD Pipeline Setup

### GitHub Actions Example

**.github/workflows/ci.yml**:
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
  
  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Archive production artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

### GitLab CI Example

**.gitlab-ci.yml**:
```yaml
image: node:20

stages:
  - test
  - build
  - deploy

cache:
  paths:
    - node_modules/

before_script:
  - npm ci

test:
  stage: test
  script:
    - npm run lint
    - npm test
  coverage: '/Statements\s*:\s*(\d+\.?\d*)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  script:
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week
  only:
    - main
    - develop

deploy_staging:
  stage: deploy
  script:
    - npm run deploy:staging
  only:
    - develop
  environment:
    name: staging
    url: https://staging.example.com

deploy_production:
  stage: deploy
  script:
    - npm run deploy:production
  only:
    - main
  when: manual
  environment:
    name: production
    url: https://example.com
```

### CircleCI Example

**.circleci/config.yml**:
```yaml
version: 2.1

orbs:
  node: circleci/node@5.1.0

jobs:
  test:
    executor:
      name: node/default
      tag: '20.0'
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Run tests
          command: npm test
      - store_test_results:
          path: ./test-results
      - store_artifacts:
          path: ./coverage

  build:
    executor:
      name: node/default
      tag: '20.0'
    steps:
      - checkout
      - node/install-packages:
          pkg-manager: npm
      - run:
          name: Build application
          command: npm run build
      - persist_to_workspace:
          root: .
          paths:
            - dist

workflows:
  test-and-build:
    jobs:
      - test
      - build:
          requires:
            - test
```

## Deployment Strategies

### Simple Deployment (Single Server)

**Using PM2**:
```bash
# Install PM2 globally on server
npm install -g pm2

# Start application
pm2 start server.js --name ollama-dashboard

# Save PM2 config
pm2 save

# Setup PM2 to restart on boot
pm2 startup
```

**ecosystem.config.js**:
```javascript
module.exports = {
  apps: [{
    name: 'ollama-dashboard',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

**Deploy script**:
```json
{
  "scripts": {
    "deploy": "pm2 startOrReload ecosystem.config.js --env production"
  }
}
```

### Zero-Downtime Deployment

**Blue-Green Deployment**:
```bash
#!/bin/bash
# deploy-blue-green.sh

# Build new version
npm ci
npm run build

# Start new instance on different port
PORT=3001 pm2 start server.js --name app-green

# Wait for health check
sleep 5
curl http://localhost:3001/health

# Switch load balancer to new instance
# (Configure nginx/HAProxy to switch)

# Stop old instance
pm2 stop app-blue
pm2 delete app-blue

# Rename green to blue for next deployment
pm2 restart app-green --name app-blue
```

### Rolling Deployment (Multiple Servers)

**Using PM2 cluster mode**:
```javascript
module.exports = {
  apps: [{
    name: 'ollama-dashboard',
    script: './server.js',
    instances: 4,  // 4 instances
    exec_mode: 'cluster',
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 5000
  }]
};
```

**Graceful reload**:
```bash
# Reload without downtime (one instance at a time)
pm2 reload ecosystem.config.js
```

### Containerized Deployment (Docker)

**Dockerfile**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OLLAMA_HOST=http://ollama:11434
    depends_on:
      - ollama
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  ollama_data:
```

**Deploy script**:
```json
{
  "scripts": {
    "docker:build": "docker build -t ollama-dashboard .",
    "docker:run": "docker-compose up -d",
    "docker:stop": "docker-compose down",
    "docker:logs": "docker-compose logs -f"
  }
}
```

## Health Checks and Monitoring

### Health Check Endpoint

**server.js**:
```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check Ollama connection
    const response = await axios.get(`${OLLAMA_HOST}/api/tags`);
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      ollama: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      ollama: 'disconnected',
      error: error.message
    });
  }
});

// Readiness check
app.get('/ready', (req, res) => {
  // Check if app is ready to receive traffic
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});
```

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs

# View metrics
pm2 monit

# View detailed info
pm2 show ollama-dashboard
```

### Setting Up Monitoring

**Using PM2 Plus** (paid service):
```bash
pm2 link <secret> <public>
pm2 install pm2-server-monit
```

**Custom Monitoring Script**:
```javascript
// monitor.js
const axios = require('axios');

async function checkHealth() {
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log(`[${new Date().toISOString()}] Health: ${response.data.status}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Health check failed:`, error.message);
    // Send alert (email, Slack, PagerDuty, etc.)
  }
}

// Check every 30 seconds
setInterval(checkHealth, 30000);
```

## Rollback Procedures

### Git-Based Rollback

```bash
# Tag current deployment
git tag -a v1.2.3 -m "Release 1.2.3"
git push origin v1.2.3

# If deployment fails, rollback to previous tag
git checkout v1.2.2
npm ci
pm2 reload ecosystem.config.js
```

### PM2-Based Rollback

**Keep previous version running**:
```bash
# Deploy new version to different name
pm2 start server.js --name app-v2

# Test new version
curl http://localhost:3001/health

# If good, switch
pm2 stop app-v1
pm2 restart app-v2 --name app-v1

# If bad, rollback
pm2 stop app-v2
pm2 delete app-v2
pm2 restart app-v1
```

### Docker Rollback

```bash
# Tag images with version
docker build -t ollama-dashboard:v1.2.3 .
docker tag ollama-dashboard:v1.2.3 ollama-dashboard:latest

# Push to registry
docker push ollama-dashboard:v1.2.3

# If deployment fails, rollback
docker pull ollama-dashboard:v1.2.2
docker tag ollama-dashboard:v1.2.2 ollama-dashboard:latest
docker-compose up -d
```

### Database Rollback

**Always backup before deployment**:
```bash
# Backup database
mongodump --db mydb --out /backup/$(date +%Y%m%d_%H%M%S)

# If rollback needed
mongorestore --db mydb /backup/20240312_143022
```

## Build Optimization

### Reducing node_modules Size

**Use production dependencies only**:
```bash
npm ci --production
```

**Analyze bundle size**:
```bash
npm install -g npm-check
npm-check -u
```

### Build Caching in CI

**GitHub Actions**:
```yaml
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**GitLab CI**:
```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/
```

### Parallel Testing

```json
{
  "scripts": {
    "test": "jest --maxWorkers=4",
    "test:ci": "jest --maxWorkers=2 --ci"
  }
}
```

## Common Pitfalls

### 1. Not Using `npm ci` in CI/CD

**Problem**: `npm install` can produce different results

**Solution**: Always use `npm ci` in automated pipelines

### 2. Missing Health Checks

**Problem**: Deployment succeeds but app is broken

**Solution**: Always implement and test health check endpoints

### 3. No Rollback Plan

**Problem**: Bad deployment with no easy way to revert

**Solution**: Always tag releases and keep previous version ready

### 4. Hardcoded Configuration

**Problem**: Same config for all environments

**Solution**: Use environment variables and .env files

### 5. Ignoring Build Failures

**Problem**: Deploying broken builds

**Solution**: Make CI/CD pipeline fail fast on any error

## Loading Instructions

**When to load this context:**
- Setting up new CI/CD pipelines
- Configuring build scripts in package.json
- Planning deployment strategies
- Implementing health checks
- Creating rollback procedures
- Troubleshooting build or deployment issues
- Optimizing build performance

**How to load:**
```bash
read .opencode/context/devops/build-and-ci-patterns.md
```

## Summary

**Key Takeaways:**
- Organize build scripts logically in package.json
- Use `npm ci` in CI/CD for reproducible builds
- Implement health check endpoints for monitoring
- Always have a rollback plan before deploying
- Use environment variables for configuration
- Test deployments in staging before production
- Cache dependencies to speed up builds
- Monitor deployments and have alerting in place

**Goal**: Create reliable, automated build and deployment pipelines that enable confident and rapid releases with easy rollback capabilities.
