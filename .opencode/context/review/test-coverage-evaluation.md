# Test Coverage Evaluation

**For**: Reviewer agent  
**Purpose**: Guide for evaluating test coverage metrics, quality over quantity, critical path coverage, and edge case testing

## Overview

Test coverage is not just about hitting a percentage target. This guide helps evaluate whether tests are comprehensive, meaningful, and actually protect against regressions.

## Understanding Coverage Metrics

### Types of Coverage

**1. Line Coverage**:
- Percentage of code lines executed by tests
- Most common metric
- Doesn't guarantee all branches tested

```javascript
function divide(a, b) {
  if (b === 0) return null;  // Line covered
  return a / b;               // Line covered
}

// Test that achieves 100% line coverage
test('divide', () => {
  expect(divide(10, 2)).toBe(5); // Covers both lines
});

// But doesn't test the error case!
```

**2. Branch Coverage**:
- Percentage of decision branches executed
- Better than line coverage
- Tests both true and false paths

```javascript
function divide(a, b) {
  if (b === 0) return null;  // Branch 1: true, Branch 2: false
  return a / b;
}

// Tests achieving 100% branch coverage
test('divide by non-zero', () => {
  expect(divide(10, 2)).toBe(5); // Branch 2 (b !== 0)
});

test('divide by zero', () => {
  expect(divide(10, 0)).toBeNull(); // Branch 1 (b === 0)
});
```

**3. Function Coverage**:
- Percentage of functions called by tests
- Ensures all functions are exercised
- Doesn't mean functions are tested thoroughly

**4. Statement Coverage**:
- Percentage of statements executed
- Similar to line coverage
- More granular (multiple statements per line)

### Coverage Targets

**Minimum Thresholds**:
- **80%+ overall**: Good baseline for most projects
- **100% for critical paths**: Payment, auth, data modification
- **Lower for UI code**: 60-70% acceptable (hard to test every visual state)

**Check in package.json**:
```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      },
      "./server.js": {
        "branches": 90,
        "functions": 100,
        "lines": 90,
        "statements": 90
      }
    }
  }
}
```

## Quality Over Quantity

### Bad Tests (High Coverage, Low Value)

**Example 1: Testing Implementation Details**:
```javascript
// ✗ Bad test - tests private implementation
test('models list has correct internal structure', () => {
  const dashboard = new Dashboard();
  expect(dashboard._internalCache).toBeDefined();
  expect(dashboard._fetchCount).toBe(0);
});
```

**Why bad**: Breaks when refactoring internal structure.

**Example 2: Trivial Tests**:
```javascript
// ✗ Bad test - tests obvious behavior
test('addition works', () => {
  expect(1 + 1).toBe(2);
});

// ✗ Bad test - tests library, not our code
test('axios can make requests', async () => {
  const response = await axios.get('https://example.com');
  expect(response.status).toBe(200);
});
```

**Why bad**: Wastes time, doesn't test our logic.

**Example 3: Snapshot Tests for Everything**:
```javascript
// ✗ Bad test - snapshot captures too much
test('renders dashboard', () => {
  const html = renderDashboard();
  expect(html).toMatchSnapshot(); // Breaks on any HTML change
});
```

**Why bad**: Brittle, doesn't document expected behavior.

### Good Tests (Value-Driven)

**Example 1: Test Public API**:
```javascript
// ✓ Good test - tests public interface
test('fetches and displays models', async () => {
  const dashboard = new Dashboard();
  await dashboard.loadModels();
  
  const models = dashboard.getModels();
  expect(models.length).toBeGreaterThan(0);
  expect(models[0]).toHaveProperty('name');
});
```

**Why good**: Tests behavior users depend on.

**Example 2: Test Business Logic**:
```javascript
// ✓ Good test - tests our logic
test('calculates memory usage correctly', () => {
  const usage = calculateMemoryUsage(1073741824); // 1 GB in bytes
  expect(usage).toBe('1.00 GB');
});

test('handles edge case of 0 bytes', () => {
  const usage = calculateMemoryUsage(0);
  expect(usage).toBe('0 B');
});
```

**Why good**: Tests our calculations, including edge cases.

**Example 3: Test Integration Points**:
```javascript
// ✓ Good test - tests API integration
test('handles Ollama offline gracefully', async () => {
  // Mock axios to simulate offline
  jest.spyOn(axios, 'get').mockRejectedValue(new Error('ECONNREFUSED'));
  
  const response = await request(app).get('/api/models');
  
  expect(response.status).toBe(503);
  expect(response.body.error).toContain('unavailable');
});
```

**Why good**: Tests error handling of external dependencies.

## Critical Path Coverage

### What is a Critical Path?

Code that:
- Handles user data (create, update, delete)
- Performs authentication/authorization
- Processes payments
- Modifies important state
- Integrates with critical external services

### Critical Path Requirements

**Must Have 100% Branch Coverage**:
```javascript
// Critical: Model unload endpoint
app.delete('/api/models/:name', async (req, res) => {
  try {
    const { name } = req.params;
    
    // Critical validation
    if (!name) {
      return res.status(400).json({ error: 'Model name required' });
    }
    
    // Critical operation
    await ollamaClient.post('/api/unload', { name });
    
    res.json({ message: 'Model unloaded' });
  } catch (error) {
    // Critical error handling
    res.status(503).json({ error: 'Failed to unload model' });
  }
});
```

**Tests Required**:
```javascript
describe('DELETE /api/models/:name', () => {
  // ✓ Test success path
  test('unloads model successfully', async () => {
    mockOllama.post('/api/unload').reply(200, {});
    
    const response = await request(app).delete('/api/models/llama2');
    expect(response.status).toBe(200);
    expect(response.body.message).toContain('unloaded');
  });
  
  // ✓ Test validation
  test('returns 400 if name missing', async () => {
    const response = await request(app).delete('/api/models/');
    expect(response.status).toBe(400);
  });
  
  // ✓ Test error handling
  test('returns 503 if Ollama offline', async () => {
    mockOllama.post('/api/unload').replyWithError('ECONNREFUSED');
    
    const response = await request(app).delete('/api/models/llama2');
    expect(response.status).toBe(503);
  });
});
```

**All branches covered**: ✓ Success, ✓ Validation error, ✓ Network error

## Edge Cases and Boundary Conditions

### Common Edge Cases to Test

**1. Empty/Null/Undefined**:
```javascript
// Test all empty cases
test('handles empty model list', () => {
  const result = formatModels([]);
  expect(result).toEqual([]);
});

test('handles null input', () => {
  const result = formatModels(null);
  expect(result).toEqual([]);
});

test('handles undefined input', () => {
  const result = formatModels(undefined);
  expect(result).toEqual([]);
});
```

**2. Boundary Values**:
```javascript
// Test boundaries for memory formatting
test('formats 0 bytes', () => {
  expect(formatBytes(0)).toBe('0 B');
});

test('formats 1 byte', () => {
  expect(formatBytes(1)).toBe('1 B');
});

test('formats 1023 bytes (just below KB)', () => {
  expect(formatBytes(1023)).toBe('1023 B');
});

test('formats 1024 bytes (exactly 1 KB)', () => {
  expect(formatBytes(1024)).toBe('1.00 KB');
});

test('formats very large number (1 TB)', () => {
  expect(formatBytes(1099511627776)).toBe('1.00 TB');
});
```

**3. Special Characters**:
```javascript
// Test input sanitization
test('handles special characters in model name', () => {
  const name = sanitizeModelName('model<script>alert(1)</script>');
  expect(name).not.toContain('<script>');
});

test('handles SQL injection attempt', () => {
  const name = sanitizeModelName("model'; DROP TABLE models; --");
  expect(name).not.toContain(';');
});
```

**4. Maximum Lengths**:
```javascript
// Test string length limits
test('rejects model name over 100 characters', () => {
  const longName = 'a'.repeat(101);
  const result = validateModelName(longName);
  expect(result.valid).toBe(false);
  expect(result.error).toContain('too long');
});
```

**5. Concurrent Operations**:
```javascript
// Test race conditions
test('handles concurrent model loads', async () => {
  const promises = [
    loadModel('llama2'),
    loadModel('codellama'),
    loadModel('mistral')
  ];
  
  const results = await Promise.all(promises);
  expect(results).toHaveLength(3);
  results.forEach(r => expect(r.success).toBe(true));
});
```

## Integration Test Coverage

### API Endpoint Testing

**Minimum Requirements**:
- [ ] Success case (200/201)
- [ ] Validation errors (400)
- [ ] Not found errors (404)
- [ ] Server errors (500/503)
- [ ] Authentication errors (401) if auth required
- [ ] Authorization errors (403) if auth required

**Example Complete Endpoint Tests**:
```javascript
describe('POST /api/models', () => {
  test('creates model successfully', async () => {
    mockOllama.post('/api/create').reply(200, { status: 'success' });
    
    const response = await request(app)
      .post('/api/models')
      .send({ name: 'llama2' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
  
  test('validates required fields', async () => {
    const response = await request(app)
      .post('/api/models')
      .send({}); // Missing name
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('name');
  });
  
  test('validates model name format', async () => {
    const response = await request(app)
      .post('/api/models')
      .send({ name: 'invalid<>name' });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('invalid characters');
  });
  
  test('handles duplicate model name', async () => {
    mockOllama.post('/api/create').reply(409, { error: 'already exists' });
    
    const response = await request(app)
      .post('/api/models')
      .send({ name: 'llama2' });
    
    expect(response.status).toBe(409);
  });
  
  test('handles Ollama offline', async () => {
    mockOllama.post('/api/create').replyWithError('ECONNREFUSED');
    
    const response = await request(app)
      .post('/api/models')
      .send({ name: 'llama2' });
    
    expect(response.status).toBe(503);
  });
});
```

### External Service Testing

**Mock external dependencies**:
```javascript
// Use nock for HTTP mocking
const nock = require('nock');

beforeEach(() => {
  // Mock Ollama API
  nock('http://localhost:11434')
    .get('/api/tags')
    .reply(200, {
      models: [
        { name: 'llama2', size: 3825819519 },
        { name: 'codellama', size: 3791727903 }
      ]
    });
});

afterEach(() => {
  nock.cleanAll();
});

test('fetches models from Ollama', async () => {
  const response = await request(app).get('/api/models');
  expect(response.status).toBe(200);
  expect(response.body.models).toHaveLength(2);
});
```

## E2E Test Appropriateness

### When E2E Tests Are Appropriate

**Good Use Cases**:
- ✓ Critical user flows (login → dashboard → action)
- ✓ Multi-step processes (create → configure → deploy)
- ✓ Integration between frontend and backend
- ✓ Browser-specific behavior (file uploads, drag-drop)

**Example E2E Test**:
```javascript
// Using Puppeteer
test('loads dashboard and displays models', async () => {
  await page.goto('http://localhost:3000');
  
  // Wait for models to load
  await page.waitForSelector('.model-card');
  
  // Verify models displayed
  const modelCount = await page.$$eval('.model-card', els => els.length);
  expect(modelCount).toBeGreaterThan(0);
  
  // Check model details
  const firstModel = await page.$eval('.model-card:first-child .name', 
    el => el.textContent
  );
  expect(firstModel).toBeTruthy();
});
```

### When E2E Tests Are NOT Appropriate

**Poor Use Cases**:
- ✗ Testing individual functions (use unit tests)
- ✗ Testing edge cases (use unit tests for speed)
- ✗ Testing error handling (mock in integration tests)
- ✗ Testing styling (visual regression tests better)

**Why**: E2E tests are slow, brittle, and expensive. Reserve for high-value scenarios.

## Coverage Red Flags

### Signs of Inadequate Testing

**1. Coverage Gaps in Critical Paths**:
```
File       | % Stmts | % Branch | % Funcs | % Lines
-----------|---------|----------|---------|--------
server.js  |   95.2  |   68.3   |  100.0  |   95.0
```
↑ Low branch coverage (68%) is a red flag for critical file.

**2. No Error Path Tests**:
```javascript
// Only tests success case
test('fetches models', async () => {
  const models = await fetchModels();
  expect(models).toBeDefined();
});

// Missing:
// - What if API is down?
// - What if response is malformed?
// - What if timeout occurs?
```

**3. No Edge Case Tests**:
```javascript
// Only tests typical case
test('formats bytes', () => {
  expect(formatBytes(1048576)).toBe('1.00 MB');
});

// Missing:
// - Zero bytes
// - Very large numbers
// - Negative numbers (if invalid)
// - Non-numeric input
```

**4. Mocking Everything**:
```javascript
// Over-mocking defeats the purpose
test('API integration', async () => {
  jest.mock('axios');
  jest.mock('./utils');
  jest.mock('./config');
  jest.mock('./validation');
  
  // At this point, what are we even testing?
  const result = await apiCall();
  expect(result).toBeDefined();
});
```

**5. No Integration Tests**:
```
- Unit tests: 100 tests ✓
- Integration tests: 0 tests ✗
- E2E tests: 0 tests ✗
```
↑ All unit tests, no integration = untested interactions.

## Review Scoring Guide

### Adequate Coverage

Award "Adequate" if:
- ✓ Overall coverage ≥ 80% (lines and branches)
- ✓ Critical paths have 100% branch coverage
- ✓ All public APIs tested (success + error cases)
- ✓ Edge cases covered (null, empty, boundaries)
- ✓ Integration tests exist for API endpoints
- ✓ E2E tests exist for critical user flows
- ✓ Tests document expected behavior clearly

### Insufficient Coverage

Request additional tests if:
- ✗ Overall coverage < 80%
- ✗ Critical paths not fully tested
- ✗ Only success cases tested (no error paths)
- ✗ Edge cases missing (null, empty, boundaries)
- ✗ No integration tests
- ✗ Tests are trivial or test implementation details
- ✗ Over-reliance on mocks (not testing real integrations)

## Reviewing Test Code

### Test Code Quality Checklist

**Tests should be**:
- [ ] **Clear**: Test name describes what's being tested
- [ ] **Independent**: Each test can run alone
- [ ] **Repeatable**: Same result every time
- [ ] **Fast**: Unit tests < 100ms, integration tests < 1s
- [ ] **Focused**: One concept per test
- [ ] **Documented**: Complex setup/assertions explained

**Example of Good Test**:
```javascript
describe('Model Unload API', () => {
  test('returns 503 when Ollama is unreachable', async () => {
    // Arrange: Mock Ollama to be offline
    nock('http://localhost:11434')
      .post('/api/unload')
      .replyWithError({ code: 'ECONNREFUSED' });
    
    // Act: Attempt to unload model
    const response = await request(app)
      .delete('/api/models/llama2');
    
    // Assert: Should return service unavailable
    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: 'Ollama service unavailable'
    });
  });
});
```

**Clear structure**: Arrange, Act, Assert  
**Good name**: Describes exact scenario  
**Focused**: Tests one error condition  
**Complete**: Checks both status and message

## Loading Instructions

**When to load this context:**
- At the start of every code review session
- When evaluating test coverage reports
- When reviewing test implementations
- When assessing whether tests are comprehensive
- When determining if additional tests are needed

**How to load:**
```bash
read .opencode/context/review/test-coverage-evaluation.md
```

## Summary

**Key Takeaways:**
- Aim for 80%+ coverage, but quality matters more than quantity
- Critical paths need 100% branch coverage
- Test both success and error cases
- Cover edge cases (null, empty, boundaries, limits)
- Integration tests verify component interactions
- E2E tests for critical user flows only
- Tests should be clear, focused, and document expected behavior
- Low branch coverage is a red flag
- Over-mocking defeats testing purpose

**Goal**: Ensure test suites are comprehensive, meaningful, and provide real protection against regressions, not just achieving arbitrary coverage percentages.
