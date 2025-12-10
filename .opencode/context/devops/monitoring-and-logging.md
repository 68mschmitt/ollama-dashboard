# Monitoring and Logging Best Practices

**For**: DevOps agent  
**Purpose**: Comprehensive guide to logging, monitoring, error tracking, and observability for Node.js applications.

## Overview

Effective monitoring and logging are essential for maintaining healthy production applications. This guide covers logging best practices, structured logging, monitoring setup, error tracking, performance monitoring, and alerting strategies.

## Logging Best Practices

### Log Levels

```javascript
const LOG_LEVELS = {
  error: 0,   // System errors, exceptions
  warn: 1,    // Warning conditions
  info: 2,    // General informational messages
  http: 3,    // HTTP request/response logs
  verbose: 4, // Verbose debugging
  debug: 5,   // Detailed debug information
  silly: 6    // Everything (rarely used)
};
```

### When to Use Each Level

**ERROR**: Unrecoverable errors requiring immediate attention
```javascript
try {
  await connectToDatabase();
} catch (error) {
  logger.error('Failed to connect to database', { error: error.message, stack: error.stack });
}
```

**WARN**: Degraded functionality or potential issues
```javascript
if (cacheUnavailable) {
  logger.warn('Cache service unavailable, falling back to database');
}
```

**INFO**: Important business events
```javascript
logger.info('User logged in', { userId: user.id, username: user.name });
logger.info('Order placed', { orderId: order.id, total: order.total });
```

**HTTP**: HTTP request/response logging
```javascript
logger.http(`${req.method} ${req.url} - ${res.statusCode} ${responseTime}ms`);
```

**DEBUG**: Detailed diagnostic information for development
```javascript
logger.debug('Processing item', { item: item, stage: 'validation' });
```

## Structured Logging with Winston

### Installation

```bash
npm install winston
```

### Basic Setup

**logger.js**:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ollama-dashboard' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // Write error logs to file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to combined file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// If not in production, log to console with pretty format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      })
    )
  }));
}

module.exports = logger;
```

### Using the Logger

**server.js**:
```javascript
const logger = require('./logger');

// Log application start
logger.info('Starting Ollama Dashboard', {
  port: PORT,
  nodeEnv: process.env.NODE_ENV,
  ollamaHost: OLLAMA_HOST
});

// Log HTTP requests
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip
    });
  });
  
  next();
});

// Log errors
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(500).json({ error: 'Internal server error' });
});
```

### Structured Log Format (JSON)

```json
{
  "timestamp": "2024-03-12 14:30:45",
  "level": "error",
  "message": "Failed to connect to Ollama",
  "service": "ollama-dashboard",
  "error": "ECONNREFUSED",
  "host": "http://localhost:11434",
  "stack": "Error: connect ECONNREFUSED...",
  "userId": "user-123",
  "requestId": "req-abc-def"
}
```

**Benefits**:
- Easy to parse and search
- Queryable in log aggregation tools
- Consistent format across services
- Machine-readable

## HTTP Request Logging with Morgan

### Installation

```bash
npm install morgan
```

### Basic Setup

```javascript
const morgan = require('morgan');
const logger = require('./logger');

// Stream to Winston logger
const stream = {
  write: (message) => logger.http(message.trim())
};

// Use morgan middleware
app.use(morgan('combined', { stream }));

// Or custom format
app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream }));
```

### Custom Morgan Format

```javascript
morgan.token('user-id', (req) => req.user?.id || 'anonymous');

app.use(morgan(':method :url :status :user-id - :response-time ms', { stream }));
```

## Error Tracking

### Unhandled Exceptions and Rejections

```javascript
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  
  // Graceful shutdown
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason,
    promise: promise
  });
});

// Handle SIGTERM (graceful shutdown)
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});
```

### Error Monitoring with Sentry

**Installation**:
```bash
npm install @sentry/node
```

**Setup**:
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

// Request handler (first middleware)
app.use(Sentry.Handlers.requestHandler());

// Routes
app.get('/api/models', async (req, res) => {
  // ...
});

// Error handler (last middleware)
app.use(Sentry.Handlers.errorHandler());

// Custom error handler
app.use((err, req, res, next) => {
  Sentry.captureException(err);
  logger.error('Error caught', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});
```

## Performance Monitoring

### Response Time Tracking

```javascript
const responseTime = require('response-time');

app.use(responseTime((req, res, time) => {
  logger.http(`${req.method} ${req.url} - ${res.statusCode} ${time.toFixed(2)}ms`);
  
  // Alert on slow requests
  if (time > 1000) {
    logger.warn('Slow request detected', {
      method: req.method,
      url: req.url,
      duration: `${time.toFixed(2)}ms`
    });
  }
}));
```

### Memory Usage Monitoring

```javascript
function logMemoryUsage() {
  const usage = process.memoryUsage();
  
  logger.info('Memory usage', {
    rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`
  });
  
  // Alert on high memory usage
  if (usage.heapUsed / usage.heapTotal > 0.9) {
    logger.warn('High memory usage detected', {
      heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
      heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
      percentage: `${((usage.heapUsed / usage.heapTotal) * 100).toFixed(2)}%`
    });
  }
}

// Log memory usage every 5 minutes
setInterval(logMemoryUsage, 5 * 60 * 1000);
```

### Event Loop Lag Monitoring

```bash
npm install event-loop-lag
```

```javascript
const lag = require('event-loop-lag')(1000); // Check every 1 second

setInterval(() => {
  const currentLag = lag();
  
  if (currentLag > 100) { // 100ms lag threshold
    logger.warn('Event loop lag detected', {
      lag: `${currentLag.toFixed(2)}ms`
    });
  }
}, 5000);
```

## Application Monitoring with PM2

### PM2 Monitoring Commands

```bash
# Real-time monitoring dashboard
pm2 monit

# CPU and memory usage
pm2 status

# View logs
pm2 logs ollama-dashboard

# Log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### PM2 Metrics

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ollama-dashboard',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',  // Restart if memory exceeds 500MB
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

## Log Aggregation and Analysis

### Centralized Logging with ELK Stack

**Filebeat configuration** (ships logs to Elasticsearch):
```yaml
# filebeat.yml
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/ollama-dashboard/*.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["localhost:9200"]
  index: "ollama-dashboard-%{+yyyy.MM.dd}"

setup.kibana:
  host: "localhost:5601"
```

### Log Rotation

**Using logrotate** (Linux):
```bash
# /etc/logrotate.d/ollama-dashboard
/var/log/ollama-dashboard/*.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
  create 640 node node
  sharedscripts
  postrotate
    pm2 reloadLogs
  endscript
}
```

## Alerting Strategies

### Alert Thresholds

**Error Rate**:
- Threshold: >5% error rate over 5 minutes
- Action: Page on-call engineer

**Response Time**:
- Threshold: >1 second average over 5 minutes
- Action: Notify team channel

**Memory Usage**:
- Threshold: >80% heap usage
- Action: Investigate memory leak

**Disk Space**:
- Threshold: <10% free space
- Action: Clean up logs or expand storage

### Implementing Alerts

**Simple email alerts**:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function sendAlert(subject, message) {
  transporter.sendMail({
    from: 'alerts@example.com',
    to: 'oncall@example.com',
    subject: subject,
    text: message
  });
}

// Use in error handler
logger.on('error', (error) => {
  sendAlert('Application Error', `Error: ${error.message}\n\nStack: ${error.stack}`);
});
```

**Slack webhook alerts**:
```javascript
const axios = require('axios');

async function sendSlackAlert(message) {
  try {
    await axios.post(process.env.SLACK_WEBHOOK_URL, {
      text: message,
      username: 'Ollama Dashboard',
      icon_emoji: ':rotating_light:'
    });
  } catch (error) {
    logger.error('Failed to send Slack alert', { error: error.message });
  }
}

// Alert on critical errors
if (errorRate > 0.05) {
  sendSlackAlert(`🚨 Error rate exceeded threshold: ${(errorRate * 100).toFixed(2)}%`);
}
```

## Health Check Endpoints

### Basic Health Check

```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### Comprehensive Health Check

```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  // Check Ollama connection
  try {
    await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 5000 });
    health.checks.ollama = { status: 'healthy' };
  } catch (error) {
    health.checks.ollama = { status: 'unhealthy', error: error.message };
    health.status = 'degraded';
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  health.checks.memory = {
    status: memPercent < 90 ? 'healthy' : 'warning',
    heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    percentage: `${memPercent.toFixed(2)}%`
  };

  // Determine overall status
  const unhealthyChecks = Object.values(health.checks).filter(c => c.status === 'unhealthy');
  if (unhealthyChecks.length > 0) {
    health.status = 'unhealthy';
    return res.status(503).json(health);
  }

  res.status(200).json(health);
});
```

## Common Pitfalls

### 1. Logging Too Much

**Problem**: Excessive logging degrades performance and fills disk

**Solution**:
```javascript
// Use appropriate log levels
if (process.env.NODE_ENV === 'production') {
  logger.level = 'info'; // Don't log debug in production
}
```

### 2. Logging Sensitive Information

**Problem**: Passwords, tokens, PII in logs

**Solution**:
```javascript
function sanitizeLogs(data) {
  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'ssn'];
  
  sensitiveKeys.forEach(key => {
    if (sanitized[key]) {
      sanitized[key] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

logger.info('User login', sanitizeLogs({ username: 'john', password: 'secret123' }));
// Logs: { username: 'john', password: '***REDACTED***' }
```

### 3. No Log Rotation

**Problem**: Logs fill disk space

**Solution**: Use log rotation (logrotate, winston transports with maxsize/maxFiles)

### 4. Ignoring Async Errors

**Problem**: Unhandled promise rejections

**Solution**: Always handle promise rejections
```javascript
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});
```

### 5. No Request Correlation

**Problem**: Can't trace requests across services

**Solution**: Add request IDs
```javascript
const { v4: uuidv4 } = require('uuid');

app.use((req, res, next) => {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

logger.info('Request received', { requestId: req.id, method: req.method, url: req.url });
```

## Loading Instructions

**When to load this context:**
- Setting up logging infrastructure
- Implementing error tracking
- Configuring monitoring and alerting
- Troubleshooting production issues
- Improving observability
- Setting up health check endpoints
- Implementing log aggregation

**How to load:**
```bash
read .opencode/context/devops/monitoring-and-logging.md
```

## Summary

**Key Takeaways:**
- Use structured logging (JSON format) for easy parsing
- Implement appropriate log levels (error, warn, info, debug)
- Set up log rotation to prevent disk space issues
- Monitor key metrics: response time, memory, error rate
- Implement comprehensive health check endpoints
- Set up alerting for critical thresholds
- Use request IDs for tracing across services
- Never log sensitive information (passwords, tokens)

**Goal**: Build a comprehensive observability system that enables rapid troubleshooting, proactive monitoring, and early detection of production issues.
