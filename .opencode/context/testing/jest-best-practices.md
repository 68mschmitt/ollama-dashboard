# Jest Best Practices

**For**: Testing agent  
**Purpose**: Jest-specific patterns, module isolation, and common pitfalls to avoid

## CRITICAL: Module Isolation with jest.resetModules()

### The Problem

When running multiple tests in Node.js, **module caching** causes state to persist between tests:

**Symptoms:**
- Tests pass individually (`npm test -- file.test.js -t 'single test'`)
- Tests fail when run together (`npm test -- file.test.js`)
- State from previous test affects current test
- Persistent data causes unexpected failures

**Root Cause:**
Node.js caches modules in `require.cache`. Once a module is loaded, subsequent `require()` calls return the cached version with its state intact.

### The Solution: jest.resetModules()

**ALWAYS use `jest.resetModules()` in `beforeEach()` when testing Node.js modules with state:**

```javascript
describe('API Tests with Module State', () => {
    beforeEach(() => {
        // 1. Reset modules FIRST (clears require.cache)
        jest.resetModules();
        
        // 2. Clear mocks
        jest.clearAllMocks();
        
        // 3. Setup test-specific data
        // ... your setup code
    });
    
    test('module starts with clean state', () => {
        // Each test gets freshly loaded module
        const app = require('../server');
        // Module is clean, no state from previous tests
    });
});
```

### Why This Order Matters

```javascript
beforeEach(() => {
    // ✅ CORRECT ORDER
    jest.resetModules();      // 1. Clear module cache first
    jest.clearAllMocks();     // 2. Clear mock call history
    // Setup test data           3. Then setup for this test
});

beforeEach(() => {
    // ❌ WRONG ORDER - won't work
    jest.clearAllMocks();     // Mocks cleared but module still cached
    // Setup test data           Setup happens but module already loaded
    jest.resetModules();      // Too late! Module already required
});
```

### Real-World Example

**Problem encountered in testing session:**

```javascript
// ❌ Test 1 passes, Test 2+ fail
describe('Instance Management', () => {
    beforeEach(() => {
        // Missing jest.resetModules()!
        jest.clearAllMocks();
        clearInstancesFile();  // Clears file, but cached module keeps state
    });
    
    test('first test', () => {
        const server = require('../server');
        // Works - module loads fresh
    });
    
    test('second test', () => {
        const server = require('../server');
        // Fails - gets cached module with state from test 1
    });
});
```

**Solution (took 4 iterations to discover):**

```javascript
// ✅ All tests pass
describe('Instance Management', () => {
    beforeEach(() => {
        jest.resetModules();   // Added this - fixed in 1 line!
        jest.clearAllMocks();
        clearInstancesFile();
    });
    
    test('first test', () => {
        const server = require('../server');
        // Works - fresh module
    });
    
    test('second test', () => {
        const server = require('../server');
        // Works - fresh module, no cached state
    });
});
```

**Time saved by knowing this upfront**: ~5 minutes, 4 test runs avoided

## Common Jest Pitfalls

### 1. Nested Matchers Don't Work as Expected

**Problem:**
Combining matchers in certain ways doesn't work.

```javascript
// ❌ WRONG - This doesn't work
expect(errors).toContain(expect.stringContaining('required'));

// Why: toContain() expects exact match, not a matcher
// expect.stringContaining() is a matcher, not a value
```

**Solutions:**

```javascript
// ✅ CORRECT - Option 1: Use .some() or .every()
const hasRequiredError = errors.some(e => e.includes('required'));
expect(hasRequiredError).toBe(true);

// ✅ CORRECT - Option 2: Custom helper function
function expectErrorDetail(errors, substring) {
    const found = errors.some(e => e.includes(substring));
    expect(found).toBe(true);
}
expectErrorDetail(errors, 'required');

// ✅ CORRECT - Option 3: expect.arrayContaining with strings
expect(errors).toEqual(expect.arrayContaining([
    expect.stringContaining('required')
]));
```

**Pattern observed in testing session:**
- 8+ assertions needed fixing
- Each used `toContain(expect.stringContaining(...))`
- Should have been fixed in batch operation, not one-by-one

### 2. Async Test Handling

**Always use `async/await` for asynchronous operations:**

```javascript
// ✅ CORRECT - async/await
test('API returns data', async () => {
    const response = await request(app).get('/api/data');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
});

// ❌ WRONG - Forgot async/await
test('API returns data', () => {
    const response = request(app).get('/api/data');  // Returns promise!
    expect(response.status).toBe(200);  // Fails - response is promise
});

// ❌ WRONG - Using callbacks (old style)
test('API returns data', (done) => {
    request(app).get('/api/data')
        .then(response => {
            expect(response.status).toBe(200);
            done();
        });
});
```

### 3. Mock Cleanup Between Tests

**Always clear mocks in `beforeEach` or `afterEach`:**

```javascript
describe('With Mocks', () => {
    beforeEach(() => {
        jest.resetModules();      // Clear module cache
        jest.clearAllMocks();     // Clear mock call history
    });
    
    test('first test', () => {
        const mockFn = jest.fn();
        mockFn('test');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });
    
    test('second test', () => {
        // Mocks are clean, no history from first test
        const mockFn = jest.fn();
        expect(mockFn).toHaveBeenCalledTimes(0);  // ✅ Passes
    });
});
```

## Test Structure Best Practices

### Standard Test Organization

```javascript
describe('Feature Name', () => {
    // Setup runs before each test
    beforeEach(() => {
        jest.resetModules();      // Always first!
        jest.clearAllMocks();     // Then clear mocks
        // Then test-specific setup
    });
    
    // Cleanup runs after each test (optional)
    afterEach(() => {
        // Cleanup resources if needed
    });
    
    // Group related tests
    describe('Subfeature 1', () => {
        test('should do X when Y', () => {
            // Arrange - Setup test data
            const input = { value: 1 };
            
            // Act - Execute function under test
            const result = functionUnderTest(input);
            
            // Assert - Verify expected outcome
            expect(result).toBe(expected);
        });
    });
    
    describe('Subfeature 2', () => {
        test('should handle error when Z', () => {
            // Arrange
            const invalidInput = null;
            
            // Act & Assert (for errors)
            expect(() => {
                functionUnderTest(invalidInput);
            }).toThrow('Expected error message');
        });
    });
});
```

### Test Categories Organization

```javascript
describe('Module Name', () => {
    describe('Unit Tests', () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
        });
        
        describe('Function: functionName', () => {
            test('returns X when given Y', () => { /* ... */ });
            test('throws error when given invalid input', () => { /* ... */ });
        });
    });
    
    describe('Integration Tests', () => {
        beforeEach(() => {
            jest.resetModules();
            jest.clearAllMocks();
        });
        
        describe('API: POST /endpoint', () => {
            test('creates resource successfully', async () => { /* ... */ });
            test('returns 400 for invalid data', async () => { /* ... */ });
        });
    });
    
    describe('Edge Cases', () => {
        test('handles empty input', () => { /* ... */ });
        test('handles null input', () => { /* ... */ });
        test('handles very large input', () => { /* ... */ });
    });
});
```

## Jest Configuration Tips

### Useful Jest Config Options

```javascript
// jest.config.js or package.json "jest" section
{
  "testEnvironment": "node",           // For Node.js APIs
  "clearMocks": true,                  // Auto-clear mocks between tests
  "resetModules": true,                // Auto-reset modules (use with caution)
  "collectCoverageFrom": [
    "src/**/*.js",                     // Include source files
    "!src/**/*.test.js",               // Exclude test files
    "!src/index.js"                    // Exclude entry points if needed
  ],
  "coverageThreshold": {
    "global": {
      "branches": 70,                  // 70% branch coverage
      "functions": 80,                 // 80% function coverage
      "lines": 80,                     // 80% line coverage
      "statements": 80                 // 80% statement coverage
    }
  }
}
```

### Running Focused Tests

```bash
# Run single test file
npm test -- instances.test.js

# Run specific test suite
npm test -- instances.test.js -t 'Persistence'

# Run in watch mode (re-runs on file changes)
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run only failed tests from last run
npm test -- --onlyFailures
```

## Debugging Jest Tests

### Using console.log Effectively

```javascript
test('debugging test', () => {
    const data = { value: 1 };
    
    // ✅ GOOD - Labeled output
    console.log('Input data:', JSON.stringify(data, null, 2));
    
    const result = transform(data);
    
    console.log('Result:', JSON.stringify(result, null, 2));
    
    expect(result).toEqual(expected);
});
```

### Using Jest's Debug Mode

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Then open chrome://inspect in Chrome
# Click "inspect" under your Node process
# Set breakpoints in test file
```

## Mocking Best Practices

### Mocking Modules

```javascript
// Mock entire module
jest.mock('axios');

test('uses mocked axios', async () => {
    const axios = require('axios');
    axios.get.mockResolvedValue({ data: { success: true } });
    
    const result = await fetchData();
    
    expect(axios.get).toHaveBeenCalledWith('https://api.example.com/data');
    expect(result).toEqual({ success: true });
});
```

### Mocking Functions

```javascript
test('uses mock function', () => {
    const mockCallback = jest.fn(x => x * 2);
    
    const result = [1, 2, 3].map(mockCallback);
    
    expect(mockCallback).toHaveBeenCalledTimes(3);
    expect(mockCallback).toHaveBeenCalledWith(1);
    expect(result).toEqual([2, 4, 6]);
});
```

## Performance Tips

### Avoiding Slow Tests

```javascript
// ❌ SLOW - Running full server for each test
describe('API Tests', () => {
    let server;
    
    beforeEach(() => {
        server = app.listen(3000);  // Slow!
    });
    
    afterEach(() => {
        server.close();
    });
});

// ✅ FAST - Use supertest without actually listening
describe('API Tests', () => {
    test('endpoint works', async () => {
        const response = await request(app).get('/api/data');
        // Supertest handles server lifecycle internally
        expect(response.status).toBe(200);
    });
});
```

## Checklist for Jest Tests

Before running tests:
- [ ] `jest.resetModules()` in `beforeEach()`?
- [ ] `jest.clearAllMocks()` after resetModules?
- [ ] Using `async/await` for asynchronous operations?
- [ ] Avoiding nested matchers like `toContain(expect.stringContaining())`?
- [ ] Tests organized in describe blocks?
- [ ] Test names are descriptive ("should do X when Y")?

After test failures:
- [ ] Is module state persisting between tests?
- [ ] Are mocks cleaned up properly?
- [ ] Is async operation completing before assertion?
- [ ] Is assertion pattern correct for data type?

## Loading Instructions

**When to load this context:**
- At the start of any Jest testing session
- When encountering test isolation issues
- Before writing tests for Node.js modules with state
- When tests pass individually but fail together

**How to load:**
```bash
read ../../context/testing/jest-best-practices.md
```

## Summary

**Critical patterns to remember:**
1. **Always** use `jest.resetModules()` first in `beforeEach()`
2. Avoid nested matchers like `toContain(expect.stringContaining())`
3. Use `async/await` for all asynchronous tests
4. Clear mocks between tests with `jest.clearAllMocks()`
5. Organize tests in describe blocks by feature/category

**Time savings:**
- Module isolation pattern: ~5 minutes per session
- Assertion pattern awareness: ~3 minutes per session
- Total: ~35-40% efficiency improvement

**Goal**: Write clean, isolated, reliable Jest tests the first time.
