# REST API Design Patterns

**For**: Backend agent  
**Purpose**: RESTful API design principles, HTTP methods, status codes, and request/response patterns

## Overview

REST (Representational State Transfer) is an architectural style for designing networked applications. This guide covers REST API best practices for the Ollama Metrics Dashboard.

## Resource Naming

### URL Structure

```
# Collection resource (plural noun)
GET /api/models              # List all models
POST /api/models             # Create new model

# Individual resource (plural/id)
GET /api/models/llama2       # Get specific model
PUT /api/models/llama2       # Update model
DELETE /api/models/llama2    # Delete model

# Nested resources
GET /api/models/llama2/versions    # List model versions
GET /api/models/llama2/versions/1  # Get specific version
```

### Naming Conventions

```
✅ GOOD
/api/users
/api/posts
/api/comments
/api/running-models
/api/hardware-metrics

❌ BAD
/api/getUsers          # Don't use verbs
/api/user              # Use plural
/api/UserPosts         # Use lowercase with hyphens
/api/running_models    # Use hyphens not underscores
```

## HTTP Methods

### Standard CRUD Operations

```javascript
// GET - Retrieve resource(s) (safe, idempotent, cacheable)
app.get('/api/models', async (req, res) => {
  const models = await getModels();
  res.json({ data: models });
});

// GET - Retrieve single resource
app.get('/api/models/:name', async (req, res) => {
  const model = await getModel(req.params.name);
  if (!model) {
    return res.status(404).json({ error: 'Model not found' });
  }
  res.json({ data: model });
});

// POST - Create new resource (not idempotent)
app.post('/api/models', async (req, res) => {
  const model = await createModel(req.body);
  res.status(201)
    .location(`/api/models/${model.id}`)
    .json({ data: model });
});

// PUT - Replace entire resource (idempotent)
app.put('/api/models/:name', async (req, res) => {
  const model = await replaceModel(req.params.name, req.body);
  res.json({ data: model });
});

// PATCH - Partial update (idempotent)
app.patch('/api/models/:name', async (req, res) => {
  const model = await updateModel(req.params.name, req.body);
  res.json({ data: model });
});

// DELETE - Remove resource (idempotent)
app.delete('/api/models/:name', async (req, res) => {
  await deleteModel(req.params.name);
  res.status(204).send(); // No content
});
```

### Non-CRUD Actions

```javascript
// POST for actions (use verbs)
POST /api/models/llama2/pull     # Pull model from registry
POST /api/models/llama2/generate # Generate text
POST /api/sessions/123/restart   # Restart session

// Implementation
app.post('/api/models/:name/generate', async (req, res) => {
  const result = await generateText(req.params.name, req.body.prompt);
  res.json({ data: result });
});
```

## HTTP Status Codes

### Success Codes (2xx)

```javascript
// 200 OK - Successful GET, PUT, PATCH, DELETE
res.status(200).json({ data: result });

// 201 Created - Successful POST that creates resource
res.status(201)
  .location('/api/models/new-model')
  .json({ data: newModel });

// 202 Accepted - Request accepted but processing not complete
res.status(202).json({ 
  message: 'Processing started',
  jobId: '123' 
});

// 204 No Content - Successful DELETE
res.status(204).send();
```

### Client Error Codes (4xx)

```javascript
// 400 Bad Request - Invalid input
if (!req.body.name) {
  return res.status(400).json({
    error: 'Validation failed',
    message: 'name is required'
  });
}

// 401 Unauthorized - Authentication required
res.status(401).json({
  error: 'Authentication required'
});

// 403 Forbidden - Authenticated but not authorized
res.status(403).json({
  error: 'Insufficient permissions'
});

// 404 Not Found - Resource doesn't exist
res.status(404).json({
  error: 'Model not found'
});

// 409 Conflict - Resource conflict (e.g., duplicate)
res.status(409).json({
  error: 'Model already exists'
});

// 422 Unprocessable Entity - Validation error
res.status(422).json({
  error: 'Validation failed',
  details: {
    name: ['Must be alphanumeric'],
    size: ['Must be positive number']
  }
});

// 429 Too Many Requests - Rate limit exceeded
res.status(429)
  .set('Retry-After', '60')
  .json({ error: 'Rate limit exceeded' });
```

### Server Error Codes (5xx)

```javascript
// 500 Internal Server Error - Generic error
res.status(500).json({
  error: 'Internal server error',
  message: error.message
});

// 502 Bad Gateway - Upstream service error
res.status(502).json({
  error: 'Ollama service error',
  message: 'Invalid response from Ollama'
});

// 503 Service Unavailable - Service down
res.status(503).json({
  error: 'Ollama service unavailable',
  message: 'Cannot connect to Ollama'
});

// 504 Gateway Timeout - Upstream timeout
res.status(504).json({
  error: 'Request timeout',
  message: 'Ollama did not respond in time'
});
```

## Request/Response Formats

### Request Body Validation

```javascript
app.post('/api/generate', async (req, res) => {
  // Validate required fields
  const { model, prompt } = req.body;
  
  if (!model || !prompt) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'model and prompt are required',
      details: {
        model: !model ? 'Required' : undefined,
        prompt: !prompt ? 'Required' : undefined
      }
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
      message: 'prompt exceeds maximum length of 10000 characters'
    });
  }
  
  // Process valid request
  const result = await generate(model, prompt);
  res.json({ data: result });
});
```

### Consistent Response Format

```javascript
// Success response - wrap data
{
  "data": {
    "id": "123",
    "name": "llama2",
    "size": 4096
  },
  "meta": {
    "timestamp": "2024-12-10T12:00:00Z",
    "version": "1.0"
  }
}

// List response - include pagination
{
  "data": [
    { "id": "1", "name": "model1" },
    { "id": "2", "name": "model2" }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}

// Error response - consistent structure
{
  "error": "Validation failed",
  "message": "Human-readable error message",
  "details": {
    "field1": ["Error 1", "Error 2"],
    "field2": ["Error 3"]
  },
  "code": "VALIDATION_ERROR" // Optional error code
}
```

## Query Parameters

### Filtering, Sorting, Pagination

```javascript
// GET /api/models?status=active&sort=-created&page=2&limit=20

app.get('/api/models', async (req, res) => {
  const {
    status,                    // Filter by status
    sort = '-created',         // Sort field (- for descending)
    page = 1,                  // Page number
    limit = 20                 // Items per page
  } = req.query;
  
  // Validate pagination
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  
  const result = await getModels({
    filter: { status },
    sort,
    skip: (pageNum - 1) * limitNum,
    limit: limitNum
  });
  
  res.json({
    data: result.items,
    pagination: {
      total: result.total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(result.total / limitNum)
    }
  });
});
```

### Search and Field Selection

```javascript
// GET /api/models?q=llama&fields=name,size

app.get('/api/models', async (req, res) => {
  const { q, fields } = req.query;
  
  let models = await getModels();
  
  // Apply search
  if (q) {
    models = models.filter(m => 
      m.name.toLowerCase().includes(q.toLowerCase())
    );
  }
  
  // Apply field selection
  if (fields) {
    const selectedFields = fields.split(',');
    models = models.map(m => {
      const filtered = {};
      selectedFields.forEach(field => {
        if (m[field] !== undefined) {
          filtered[field] = m[field];
        }
      });
      return filtered;
    });
  }
  
  res.json({ data: models });
});
```

## Versioning

### URL Path Versioning

```javascript
// v1 API
app.use('/api/v1', v1Router);

// v2 API (breaking changes)
app.use('/api/v2', v2Router);

// Default to latest
app.use('/api', v2Router);
```

### Header Versioning

```javascript
app.use((req, res, next) => {
  const version = req.headers['api-version'] || '1';
  req.apiVersion = version;
  next();
});

app.get('/api/models', (req, res) => {
  if (req.apiVersion === '2') {
    return getModelsV2(req, res);
  }
  return getModelsV1(req, res);
});
```

## Headers

### Request Headers

```javascript
// Content negotiation
app.get('/api/models', (req, res) => {
  const acceptHeader = req.headers.accept;
  
  if (acceptHeader.includes('application/xml')) {
    return res.type('xml').send(toXML(models));
  }
  
  res.json({ data: models }); // Default to JSON
});

// Authentication
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  // Bearer token, Basic auth, API key, etc.
  next();
});
```

### Response Headers

```javascript
// CORS headers
app.use((req, res, next) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  next();
});

// Cache control
app.get('/api/models', (req, res) => {
  res.set({
    'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    'ETag': generateETag(models)
  });
  res.json({ data: models });
});

// Rate limiting
res.set({
  'X-RateLimit-Limit': '100',
  'X-RateLimit-Remaining': '99',
  'X-RateLimit-Reset': '1640000000'
});
```

## Error Handling Best Practices

### Consistent Error Structure

```javascript
class APIError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.operational = true;
  }
}

// Usage
throw new APIError('Model not found', 404, 'MODEL_NOT_FOUND');

throw new APIError(
  'Validation failed',
  422,
  'VALIDATION_ERROR',
  { name: ['Required'], size: ['Must be positive'] }
);
```

### Global Error Handler

```javascript
app.use((err, req, res, next) => {
  // Log error
  console.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Operational errors (expected)
  if (err.operational) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details
    });
  }
  
  // Programming errors (unexpected)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

## Common Pitfalls

### Returning Wrong Status Codes

```javascript
// ❌ BAD: 200 for not found
app.get('/api/models/:name', async (req, res) => {
  const model = await getModel(req.params.name);
  res.json({ data: model || null }); // Returns 200 even if null
});

// ✅ GOOD: 404 for not found
app.get('/api/models/:name', async (req, res) => {
  const model = await getModel(req.params.name);
  if (!model) {
    return res.status(404).json({ error: 'Model not found' });
  }
  res.json({ data: model });
});
```

### Inconsistent Response Format

```javascript
// ❌ BAD: Inconsistent structures
// Success: { data: {...} }
// Error: { message: "..." }  // Different structure!

// ✅ GOOD: Consistent structures
// Success: { data: {...} }
// Error: { error: "...", message: "..." }
```

### Not Using Proper HTTP Methods

```javascript
// ❌ BAD: Using GET for actions
GET /api/models/delete?name=llama2

// ✅ GOOD: Use appropriate method
DELETE /api/models/llama2
```

## Loading Instructions

**When to load this context:**
- Designing new API endpoints
- Implementing REST operations
- Choosing HTTP status codes
- Structuring request/response formats
- Implementing API versioning
- Handling API errors

**How to load:**
```bash
read .opencode/context/backend/api-design-patterns.md
```

**Also consider loading:**
- `express-best-practices.md` - For Express implementation
- `nodejs-patterns.md` - For async/error handling

## Summary

**Key Takeaways:**
- Use plural nouns for resource names
- Choose appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE)
- Return correct status codes (200, 201, 400, 404, 500, etc.)
- Maintain consistent response format
- Validate inputs and return detailed errors
- Use query parameters for filtering/pagination
- Version APIs for breaking changes

**Goal**: Design intuitive, consistent RESTful APIs that follow HTTP semantics and industry standards.
