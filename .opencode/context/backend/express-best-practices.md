# Express.js Best Practices

**For**: Backend agent  
**Purpose**: Comprehensive Express.js patterns, middleware, routing, and implementation best practices

## Overview

Express.js is a minimal and flexible Node.js web application framework. This guide covers best practices specific to Express 4.x+ as used in the Ollama Metrics Dashboard project.

## Application Setup

### Basic Structure

```javascript
const express = require('express');
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/api/endpoint', handler);

// Error handling (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Middleware Order Matters

Middleware is executed in the order it's defined:

```javascript
// 1. Logging (first - log everything)
app.use(loggingMiddleware);

// 2. Body parsing
app.use(express.json());

// 3. CORS (if needed)
app.use(cors());

// 4. Static files
app.use(express.static('public'));

// 5. Routes
app.use('/api', apiRouter);

// 6. 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 7. Error handler (MUST be last)
app.use(errorHandler);
```

## Route Handlers

### Async/Await Pattern

Always use try/catch with async route handlers:

```javascript
app.get('/api/data', async (req, res) => {
  try {
    const data = await fetchData();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch data',
      message: error.message 
    });
  }
});
```

### Route Parameters

```javascript
// Path parameters
app.get('/api/models/:name', async (req, res) => {
  const { name } = req.params;
  // Use name...
});

// Query parameters
app.get('/api/search', async (req, res) => {
  const { query, limit = 10 } = req.query;
  // Use query and limit...
});

// Request body
app.post('/api/generate', async (req, res) => {
  const { model, prompt } = req.body;
  // Use model and prompt...
});
```

### HTTP Methods

Use appropriate methods for REST operations:

```javascript
// GET - Retrieve data (safe, idempotent)
app.get('/api/models', getModels);

// POST - Create or trigger action (not idempotent)
app.post('/api/generate', generateText);

// PUT - Update/replace entire resource (idempotent)
app.put('/api/models/:id', updateModel);

// PATCH - Partial update (idempotent)
app.patch('/api/models/:id', patchModel);

// DELETE - Remove resource (idempotent)
app.delete('/api/models/:name', deleteModel);
```

## Error Handling

### Centralized Error Handler

Create a dedicated error handling middleware:

```javascript
// Error handler middleware (must be defined LAST)
function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Operational errors (expected)
  if (err.operational) {
    return res.status(err.statusCode || 500).json({
      error: err.message
    });
  }
  
  // Programming errors (unexpected)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}

app.use(errorHandler);
```

### Custom Error Classes

```javascript
class APIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.operational = true;
  }
}

// Usage in routes
app.get('/api/data', async (req, res, next) => {
  try {
    if (!req.query.id) {
      throw new APIError('ID required', 400);
    }
    // ... fetch data
  } catch (error) {
    next(error); // Pass to error handler
  }
});
```

### External API Error Handling

Wrap external API calls with specific error handling:

```javascript
app.get('/api/ollama/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_API}/api/tags`);
    res.json(response.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Ollama service unavailable',
        message: 'Cannot connect to Ollama at ' + OLLAMA_API
      });
    }
    
    if (error.response) {
      // Ollama returned an error
      return res.status(error.response.status).json({
        error: 'Ollama API error',
        message: error.response.data?.error || error.message
      });
    }
    
    // Other errors
    res.status(500).json({
      error: 'Failed to fetch models',
      message: error.message
    });
  }
});
```

## Request Validation

### Input Validation Pattern

```javascript
app.post('/api/generate', async (req, res) => {
  // Validate required fields
  const { model, prompt } = req.body;
  
  if (!model || !prompt) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'model and prompt are required'
    });
  }
  
  // Validate types
  if (typeof prompt !== 'string') {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'prompt must be a string'
    });
  }
  
  // Validate constraints
  if (prompt.length > 10000) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'prompt must be less than 10000 characters'
    });
  }
  
  try {
    // Process valid request
    const result = await generate(model, prompt);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: 'Generation failed',
      message: error.message
    });
  }
});
```

### Sanitization

```javascript
// Sanitize path parameters
app.get('/api/models/:name', async (req, res) => {
  // Remove dangerous characters
  const modelName = req.params.name
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 100);
  
  if (!modelName) {
    return res.status(400).json({
      error: 'Invalid model name'
    });
  }
  
  // Use sanitized value
});
```

## Response Patterns

### Consistent JSON Structure

```javascript
// Success response
res.json({
  data: { /* payload */ },
  meta: {
    timestamp: new Date().toISOString(),
    version: '1.0'
  }
});

// Error response
res.status(400).json({
  error: 'Error type',
  message: 'Human-readable message',
  details: { /* optional validation errors */ }
});

// List response with pagination
res.json({
  data: items,
  pagination: {
    total: 100,
    page: 1,
    limit: 20,
    pages: 5
  }
});
```

### Setting Response Headers

```javascript
app.get('/api/data', async (req, res) => {
  res.set({
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-API-Version': '1.0'
  });
  
  res.json({ data });
});
```

## Middleware Patterns

### Creating Custom Middleware

```javascript
// Logging middleware
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  
  next(); // MUST call next()
}

app.use(requestLogger);
```

### Conditional Middleware

```javascript
// Only apply to specific routes
app.use('/api/admin', requireAuth, adminRouter);

// Apply based on condition
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // HTTP request logger
}
```

### Async Middleware

```javascript
// Wrap async middleware to catch errors
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
app.get('/api/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json({ data });
}));
```

## Static File Serving

### Basic Static Files

```javascript
// Serve everything in 'public' directory
app.use(express.static('public'));

// With options
app.use(express.static('public', {
  maxAge: '1d', // Cache for 1 day
  index: 'index.html',
  dotfiles: 'deny' // Don't serve hidden files
}));
```

### Virtual Path Prefix

```javascript
// Serve 'public' directory at '/static'
app.use('/static', express.static('public'));

// Now: /static/styles.css maps to public/styles.css
```

## Router Organization

### Using Express Router

```javascript
// routes/api.js
const express = require('express');
const router = express.Router();

router.get('/models', getModels);
router.post('/generate', generate);

module.exports = router;

// server.js
const apiRouter = require('./routes/api');
app.use('/api', apiRouter);
```

### Nested Routers

```javascript
// routes/models.js
const router = express.Router();

router.get('/', listModels);
router.get('/:name', getModel);
router.delete('/:name', deleteModel);

module.exports = router;

// server.js
const modelsRouter = require('./routes/models');
app.use('/api/models', modelsRouter);

// Results in:
// GET /api/models
// GET /api/models/:name
// DELETE /api/models/:name
```

## Performance Considerations

### Response Compression

```javascript
const compression = require('compression');

app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024 // Only compress if > 1KB
}));
```

### Request Size Limits

```javascript
app.use(express.json({ 
  limit: '10mb' // Limit JSON payload size
}));

app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));
```

### Caching Headers

```javascript
// Cache static assets
app.use('/static', express.static('public', {
  maxAge: '7d',
  etag: true,
  lastModified: true
}));

// Don't cache API responses
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
});
```

## Common Pitfalls

### Forgetting to Call next()

```javascript
// ❌ BAD: Middleware never continues
app.use((req, res, next) => {
  console.log('Request received');
  // Forgot next()!
});

// ✅ GOOD
app.use((req, res, next) => {
  console.log('Request received');
  next(); // Continue to next middleware
});
```

### Error Handler Position

```javascript
// ❌ BAD: Error handler not last
app.use(errorHandler);
app.use('/api', router); // Won't catch errors from router

// ✅ GOOD: Error handler last
app.use('/api', router);
app.use(errorHandler); // Catches all errors
```

### Not Handling Async Errors

```javascript
// ❌ BAD: Unhandled promise rejection
app.get('/data', async (req, res) => {
  const data = await fetchData(); // If this throws, it's unhandled
  res.json({ data });
});

// ✅ GOOD: Wrapped in try/catch
app.get('/data', async (req, res) => {
  try {
    const data = await fetchData();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ BETTER: Use async handler wrapper
app.get('/data', asyncHandler(async (req, res) => {
  const data = await fetchData();
  res.json({ data });
}));
```

### Sending Multiple Responses

```javascript
// ❌ BAD: Trying to send response twice
app.get('/data', async (req, res) => {
  res.json({ message: 'Loading...' });
  const data = await fetchData();
  res.json({ data }); // ERROR: Headers already sent
});

// ✅ GOOD: Only one response
app.get('/data', async (req, res) => {
  try {
    const data = await fetchData();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Testing Routes

### Manual Testing with curl

```bash
# GET request
curl http://localhost:3000/api/models

# POST request with JSON
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{"model": "llama2", "prompt": "Hello"}'

# With query parameters
curl "http://localhost:3000/api/search?query=test&limit=10"

# DELETE request
curl -X DELETE http://localhost:3000/api/models/llama2
```

### Testing Error Handling

```bash
# Test 400 Bad Request
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{}' # Missing required fields

# Test 404 Not Found
curl http://localhost:3000/api/nonexistent

# Test 503 Service Unavailable (stop Ollama first)
curl http://localhost:3000/api/ollama/models
```

## Loading Instructions

**When to load this context:**
- Starting work on any Express.js server-side feature
- Adding new API endpoints
- Implementing middleware
- Debugging routing issues
- Improving error handling
- Setting up static file serving

**How to load:**
```bash
read .opencode/context/backend/express-best-practices.md
```

**Also consider loading:**
- `nodejs-patterns.md` - For general Node.js patterns
- `api-design-patterns.md` - For REST API design
- `environment-configuration.md` - For environment setup

## Summary

**Key Takeaways:**
- Always use try/catch with async route handlers
- Define error handling middleware LAST
- Validate and sanitize all inputs
- Use appropriate HTTP methods and status codes
- Organize routes with Express Router
- Call next() in middleware or send a response (not both)
- Test routes manually with curl

**Goal**: Build robust, maintainable Express.js APIs with proper error handling and best practices.
