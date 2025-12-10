# Supertest API Testing

**For**: Testing agent  
**Purpose**: HTTP API endpoint testing patterns using Supertest

## Overview

Supertest is a library for testing HTTP APIs in Node.js. It provides a high-level abstraction for testing HTTP endpoints without needing to start an actual server.

**Key Benefits:**
- No need to start server on specific port
- Automatic handling of server lifecycle
- Clean, readable API for HTTP testing
- Works seamlessly with Jest/Mocha/other test frameworks
- Supports async/await patterns

## Basic Setup

```javascript
const request = require('supertest');
const app = require('../server');  // Your Express/Node.js app

describe('API Endpoint Tests', () => {
    test('GET endpoint works', async () => {
        const response = await request(app).get('/api/endpoint');
        expect(response.status).toBe(200);
    });
});
```

**Important**: Import your app/server, but DON'T call `.listen()`. Supertest handles that internally.

## HTTP Methods

### GET Requests

```javascript
test('GET /api/health returns status', async () => {
    const response = await request(app).get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body.status).toBe('online');
});

// With query parameters
test('GET /api/search with query', async () => {
    const response = await request(app)
        .get('/api/search')
        .query({ q: 'test', limit: 10 });
    
    expect(response.status).toBe(200);
    expect(response.body.results).toBeDefined();
});
```

### POST Requests

```javascript
test('POST /api/resources creates resource', async () => {
    const newResource = {
        name: 'Test Resource',
        value: 42
    };
    
    const response = await request(app)
        .post('/api/resources')
        .send(newResource)
        .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(newResource.name);
});
```

### PUT/PATCH Requests

```javascript
test('PUT /api/resources/:id updates resource', async () => {
    const updates = { name: 'Updated Name' };
    
    const response = await request(app)
        .put('/api/resources/123')
        .send(updates)
        .set('Content-Type', 'application/json');
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe(updates.name);
});
```

### DELETE Requests

```javascript
test('DELETE /api/resources/:id removes resource', async () => {
    const response = await request(app).delete('/api/resources/123');
    
    expect(response.status).toBe(204);  // No content
});
```

## Testing Response Properties

### Status Codes

```javascript
// Success responses
expect(response.status).toBe(200);  // OK
expect(response.status).toBe(201);  // Created
expect(response.status).toBe(204);  // No Content

// Client error responses
expect(response.status).toBe(400);  // Bad Request
expect(response.status).toBe(401);  // Unauthorized
expect(response.status).toBe(404);  // Not Found

// Server error responses
expect(response.status).toBe(500);  // Internal Server Error
```

### Response Body

```javascript
test('response body has correct structure', async () => {
    const response = await request(app).get('/api/data');
    
    // Check property exists
    expect(response.body).toHaveProperty('data');
    
    // Check exact value
    expect(response.body.status).toBe('success');
    
    // Check type
    expect(typeof response.body.count).toBe('number');
    
    // Check array
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.items).toHaveLength(5);
    
    // Check nested properties
    expect(response.body.data.user.name).toBe('Test User');
});
```

### Response Headers

```javascript
test('response has correct headers', async () => {
    const response = await request(app).get('/api/data');
    
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.headers['x-custom-header']).toBe('value');
});
```

## Testing Error Scenarios

### 400 Bad Request

```javascript
test('returns 400 for invalid data', async () => {
    const invalidData = {
        name: '',  // Empty name not allowed
        value: 'not-a-number'  // Should be number
    };
    
    const response = await request(app)
        .post('/api/resources')
        .send(invalidData);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('validation');
});
```

### 404 Not Found

```javascript
test('returns 404 for non-existent resource', async () => {
    const response = await request(app).get('/api/resources/nonexistent-id');
    
    expect(response.status).toBe(404);
    expect(response.body.error).toContain('not found');
});
```

### 500 Internal Server Error

```javascript
test('handles server error gracefully', async () => {
    // Trigger error condition (e.g., invalid ID that causes exception)
    const response = await request(app).get('/api/resources/cause-error');
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBeTruthy();
});
```

## Authentication Testing

### With Headers

```javascript
test('requires authentication token', async () => {
    // Without token - should fail
    const noAuthResponse = await request(app).get('/api/protected');
    expect(noAuthResponse.status).toBe(401);
    
    // With token - should succeed
    const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer valid-token');
    
    expect(response.status).toBe(200);
});
```

### With Cookies

```javascript
test('uses session cookie', async () => {
    // Login to get cookie
    const loginResponse = await request(app)
        .post('/api/login')
        .send({ username: 'test', password: 'password' });
    
    const cookie = loginResponse.headers['set-cookie'];
    
    // Use cookie in subsequent request
    const response = await request(app)
        .get('/api/protected')
        .set('Cookie', cookie);
    
    expect(response.status).toBe(200);
});
```

## Testing Request Validation

```javascript
describe('POST /api/resources validation', () => {
    test('requires name field', async () => {
        const response = await request(app)
            .post('/api/resources')
            .send({ value: 42 });  // Missing name
        
        expect(response.status).toBe(400);
        expect(response.body.errors).toContainEqual(
            expect.objectContaining({ field: 'name' })
        );
    });
    
    test('validates name length', async () => {
        const response = await request(app)
            .post('/api/resources')
            .send({ name: 'ab', value: 42 });  // Name too short
        
        expect(response.status).toBe(400);
        expect(response.body.errors.some(e => 
            e.field === 'name' && e.message.includes('length')
        )).toBe(true);
    });
    
    test('validates value type', async () => {
        const response = await request(app)
            .post('/api/resources')
            .send({ name: 'Test', value: 'not-a-number' });
        
        expect(response.status).toBe(400);
        expect(response.body.errors.some(e => 
            e.field === 'value' && e.message.includes('number')
        )).toBe(true);
    });
});
```

## Complete Example: Health Check Endpoint

```javascript
const request = require('supertest');
const app = require('../server');

describe('GET /api/health', () => {
    test('returns online status', async () => {
        const response = await request(app).get('/api/health');
        
        // Check status code
        expect(response.status).toBe(200);
        
        // Check response structure
        expect(response.body).toHaveProperty('status');
        expect(response.body).toHaveProperty('timestamp');
        
        // Check values
        expect(response.body.status).toBe('online');
        expect(typeof response.body.timestamp).toBe('string');
        
        // Check headers
        expect(response.headers['content-type']).toMatch(/application\/json/);
    });
});
```

## Complete Example: CRUD Operations

```javascript
const request = require('supertest');
const app = require('../server');

describe('Instance Management API', () => {
    let createdInstanceId;
    
    describe('POST /api/instances', () => {
        test('creates new instance', async () => {
            const newInstance = {
                host: 'http://localhost:11434',
                name: 'Test Instance'
            };
            
            const response = await request(app)
                .post('/api/instances')
                .send(newInstance);
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.host).toBe(newInstance.host);
            
            createdInstanceId = response.body.id;
        });
        
        test('validates required fields', async () => {
            const response = await request(app)
                .post('/api/instances')
                .send({});  // Missing required fields
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('errors');
        });
    });
    
    describe('GET /api/instances', () => {
        test('returns all instances', async () => {
            const response = await request(app).get('/api/instances');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });
    
    describe('GET /api/instances/:id', () => {
        test('returns specific instance', async () => {
            const response = await request(app)
                .get(`/api/instances/${createdInstanceId}`);
            
            expect(response.status).toBe(200);
            expect(response.body.id).toBe(createdInstanceId);
        });
        
        test('returns 404 for non-existent instance', async () => {
            const response = await request(app)
                .get('/api/instances/non-existent-id');
            
            expect(response.status).toBe(404);
        });
    });
    
    describe('DELETE /api/instances/:id', () => {
        test('deletes instance', async () => {
            const response = await request(app)
                .delete(`/api/instances/${createdInstanceId}`);
            
            expect(response.status).toBe(204);
            
            // Verify deletion
            const getResponse = await request(app)
                .get(`/api/instances/${createdInstanceId}`);
            expect(getResponse.status).toBe(404);
        });
    });
});
```

## Best Practices

### 1. Use async/await

```javascript
// ✅ CORRECT
test('async test', async () => {
    const response = await request(app).get('/api/data');
    expect(response.status).toBe(200);
});

// ❌ WRONG - missing await
test('wrong test', () => {
    const response = request(app).get('/api/data');  // Promise!
    expect(response.status).toBe(200);  // Fails
});
```

### 2. Test Response Structure AND Values

```javascript
test('complete verification', async () => {
    const response = await request(app).get('/api/data');
    
    // Check status
    expect(response.status).toBe(200);
    
    // Check structure
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('meta');
    
    // Check values
    expect(response.body.data).toBeTruthy();
    expect(response.body.meta.count).toBeGreaterThan(0);
});
```

### 3. Group Related Tests

```javascript
describe('User API', () => {
    describe('POST /api/users', () => {
        test('creates user', async () => { /* ... */ });
        test('validates email', async () => { /* ... */ });
    });
    
    describe('GET /api/users/:id', () => {
        test('returns user', async () => { /* ... */ });
        test('returns 404', async () => { /* ... */ });
    });
});
```

### 4. Clean Up Between Tests

```javascript
describe('API Tests', () => {
    beforeEach(async () => {
        // Reset database or clear test data
        await clearTestData();
    });
    
    test('test 1', async () => { /* ... */ });
    test('test 2', async () => { /* ... */ });
});
```

## Common Patterns

### Testing Pagination

```javascript
test('supports pagination', async () => {
    const response = await request(app)
        .get('/api/resources')
        .query({ page: 2, limit: 10 });
    
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(10);
    expect(response.body.page).toBe(2);
    expect(response.body).toHaveProperty('totalPages');
});
```

### Testing Sorting

```javascript
test('sorts by field', async () => {
    const response = await request(app)
        .get('/api/resources')
        .query({ sortBy: 'name', order: 'asc' });
    
    expect(response.status).toBe(200);
    
    const names = response.body.items.map(item => item.name);
    const sortedNames = [...names].sort();
    expect(names).toEqual(sortedNames);
});
```

### Testing File Uploads

```javascript
test('uploads file', async () => {
    const response = await request(app)
        .post('/api/upload')
        .attach('file', 'path/to/test-file.txt')
        .field('description', 'Test file');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('fileId');
});
```

## Troubleshooting

### Issue: Tests timeout

```javascript
// Increase timeout for slow endpoints
test('slow endpoint', async () => {
    const response = await request(app).get('/api/slow-endpoint');
    expect(response.status).toBe(200);
}, 10000);  // 10 second timeout
```

### Issue: Server port already in use

```javascript
// ✅ Don't do this - Supertest handles it
// app.listen(3000);

// Just export the app
module.exports = app;
```

## Loading Instructions

**When to load this context:**
- Before writing API endpoint tests
- When testing HTTP APIs with Supertest
- When encountering test issues with API endpoints

**How to load:**
```bash
read ../../context/testing/supertest-api-testing.md
```

## Summary

**Key Takeaways:**
- Use `async/await` for all Supertest requests
- Don't start server manually - Supertest handles it
- Test status codes, body structure, AND values
- Group tests by endpoint/feature
- Clean up test data between tests
- Test both success and error scenarios

**Common Pattern:**
```javascript
const response = await request(app)
    .METHOD('/endpoint')
    .send(data)
    .set('Header', 'value')
    .query({ param: 'value' });

expect(response.status).toBe(expectedCode);
expect(response.body).toMatchObject(expectedShape);
```
