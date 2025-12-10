# Test Strategy: General Principles

**For**: Testing agent  
**Purpose**: Tool-agnostic testing principles, coverage strategies, and test categorization

## Test Structure: Arrange-Act-Assert (AAA)

Every test should follow the AAA pattern for clarity and consistency:

```javascript
test('descriptive test name', () => {
    // Arrange - Setup test data and preconditions
    const input = { value: 1 };
    const expected = { value: 2 };
    
    // Act - Execute the function/operation under test
    const result = functionUnderTest(input);
    
    // Assert - Verify the outcome matches expectations
    expect(result).toEqual(expected);
});
```

### Why AAA Matters

**Benefits:**
- Clear separation of concerns
- Easy to understand test intent
- Maintainable and readable
- Highlights test logic flow

**Anti-pattern to avoid:**
```javascript
// ❌ BAD - Mixed concerns, unclear what's being tested
test('unclear test', () => {
    const result = doSomething(setup());
    expect(result).toBe(transform(expected()));
    const other = doOtherThing();
    expect(other).toBe(true);
});
```

## Test Categories

### Unit Tests

**Purpose**: Test individual functions/methods in isolation

**Characteristics:**
- Fast (milliseconds)
- No external dependencies (DB, API, file system)
- Pure logic testing
- High volume (many tests)

**Example:**
```javascript
describe('Unit: calculateTotal()', () => {
    test('sums array of numbers', () => {
        // Arrange
        const numbers = [1, 2, 3, 4, 5];
        
        // Act
        const result = calculateTotal(numbers);
        
        // Assert
        expect(result).toBe(15);
    });
    
    test('returns 0 for empty array', () => {
        expect(calculateTotal([])).toBe(0);
    });
    
    test('throws error for non-number values', () => {
        expect(() => calculateTotal([1, 'two', 3])).toThrow();
    });
});
```

**When to write:**
- Testing pure functions
- Business logic validation
- Data transformations
- Calculation functions
- Utility functions

### Integration Tests

**Purpose**: Test how components work together

**Characteristics:**
- Moderate speed (seconds)
- May use real dependencies (DB, API)
- Tests interactions between modules
- Medium volume (fewer than unit tests)

**Example:**
```javascript
describe('Integration: User Registration Flow', () => {
    test('creates user and sends welcome email', async () => {
        // Arrange
        const userData = {
            email: 'test@example.com',
            password: 'secure123'
        };
        
        // Act
        const result = await registerUser(userData);
        
        // Assert
        // Check database
        const dbUser = await db.users.findByEmail(userData.email);
        expect(dbUser).toBeDefined();
        
        // Check email was sent
        const sentEmails = await emailService.getSentEmails();
        expect(sentEmails.some(e => e.to === userData.email)).toBe(true);
        
        // Check response
        expect(result.success).toBe(true);
    });
});
```

**When to write:**
- Testing API endpoints
- Database operations
- Service interactions
- Authentication flows
- Data persistence

### End-to-End (E2E) Tests

**Purpose**: Test complete user workflows from start to finish

**Characteristics:**
- Slow (seconds to minutes)
- Uses real system (UI, backend, DB)
- Tests user scenarios
- Low volume (critical paths only)

**Example:**
```javascript
describe('E2E: Complete Purchase Flow', () => {
    test('user can browse, add to cart, and checkout', async () => {
        // Arrange - User is on homepage
        await browser.goto('http://localhost:3000');
        
        // Act - User browses and adds item
        await browser.click('#product-1');
        await browser.click('#add-to-cart');
        
        // Act - User checks out
        await browser.click('#cart-icon');
        await browser.click('#checkout');
        await browser.fill('#card-number', '4242424242424242');
        await browser.click('#submit-payment');
        
        // Assert - Order confirmation shown
        await browser.waitForText('Order Confirmed');
        const orderNumber = await browser.getText('#order-number');
        expect(orderNumber).toMatch(/ORD-\d+/);
    });
});
```

**When to write:**
- Critical user workflows
- UI interactions
- Multi-step processes
- Happy path scenarios
- Smoke tests

## Coverage Goals

### What to Aim For

**Overall Target: 80%+ coverage on business logic**

**By Category:**
- **Unit Tests**: 90%+ coverage (easy to achieve, fast to run)
- **Integration Tests**: 70-80% coverage (focus on critical paths)
- **E2E Tests**: Cover 5-10 critical user journeys (not measured by %)

### Coverage vs Quality

❌ **Wrong Mindset**: "Get to 100% coverage at any cost"
✅ **Right Mindset**: "Cover critical paths and edge cases thoroughly"

**Coverage metrics are a guide, not a goal.**

### What to Test

✅ **DO Test:**
- Business logic
- Error handling
- Edge cases
- User inputs and outputs
- API contracts
- Critical user workflows
- Data validation
- Security checks

❌ **DON'T Test:**
- Framework code (Express, React internals)
- Third-party libraries (axios, lodash)
- Getters/setters with no logic
- Configuration files
- Mock/stub implementations themselves

### Example: Smart Coverage

```javascript
// ✅ GOOD - Test business logic
function calculateDiscount(price, userType) {
    if (userType === 'premium') {
        return price * 0.20;  // Test this
    } else if (userType === 'regular') {
        return price * 0.10;  // Test this
    }
    return 0;  // Test this
}

// ❌ NO NEED - Simple getter
function getPrice() {
    return this.price;  // Don't waste time testing this
}

// ❌ NO NEED - Framework code
app.use(express.json());  // Express handles this, don't test
```

## Test Naming Conventions

### Pattern: "should [expected behavior] when [condition]"

```javascript
// ✅ GOOD - Clear and descriptive
test('should return 200 status when request is valid', async () => {});
test('should throw error when input is null', () => {});
test('should calculate discount when user is premium', () => {});

// ❌ BAD - Vague or unclear
test('test 1', () => {});
test('it works', () => {});
test('discount', () => {});
```

### Alternative Pattern: "[action] [expected outcome]"

```javascript
test('returns sorted array in ascending order', () => {});
test('throws ValidationError for empty email', () => {});
test('creates user with hashed password', async () => {});
```

## Test Organization

### Group by Feature/Module

```javascript
describe('User Management', () => {
    describe('Unit Tests', () => {
        describe('validateEmail()', () => {
            test('returns true for valid email', () => {});
            test('returns false for invalid email', () => {});
        });
        
        describe('hashPassword()', () => {
            test('returns hashed string', () => {});
            test('generates different hash for same password', () => {});
        });
    });
    
    describe('Integration Tests', () => {
        describe('POST /api/users', () => {
            test('creates user with valid data', async () => {});
            test('returns 400 for invalid data', async () => {});
        });
    });
});
```

### Separate Test Files by Type

```
src/
  user.js
tests/
  unit/
    user.test.js          # Unit tests for user module
  integration/
    user-api.test.js      # Integration tests for user API
  e2e/
    user-registration.test.js  # E2E user flows
```

## Edge Cases and Error Scenarios

### Always Test Edge Cases

**Common edge cases:**
- Empty inputs (null, undefined, "", [], {})
- Boundary values (0, -1, MAX_INT)
- Invalid types (string when expecting number)
- Missing required fields
- Duplicate entries
- Very large inputs
- Special characters

**Example:**
```javascript
describe('processInput()', () => {
    // Happy path
    test('processes valid input', () => {
        expect(processInput('valid')).toBeDefined();
    });
    
    // Edge cases
    test('handles null input', () => {
        expect(() => processInput(null)).toThrow();
    });
    
    test('handles empty string', () => {
        expect(() => processInput('')).toThrow();
    });
    
    test('handles very long input', () => {
        const longInput = 'a'.repeat(10000);
        expect(() => processInput(longInput)).toThrow('Input too long');
    });
    
    test('handles special characters', () => {
        expect(processInput('test<script>')).not.toContain('<script>');
    });
});
```

### Error Scenario Testing

```javascript
describe('Error Handling', () => {
    test('handles network timeout', async () => {
        // Mock timeout
        mockFetch.mockRejectedValue(new Error('Timeout'));
        
        await expect(fetchData()).rejects.toThrow('Timeout');
    });
    
    test('handles malformed response', async () => {
        mockFetch.mockResolvedValue({ data: 'not json' });
        
        await expect(parseResponse()).rejects.toThrow('Parse error');
    });
    
    test('logs error when operation fails', async () => {
        const consoleSpy = jest.spyOn(console, 'error');
        
        await failingOperation();
        
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('Operation failed')
        );
    });
});
```

## Test Data Management

### Use Realistic Test Data

```javascript
// ✅ GOOD - Realistic data
const testUser = {
    email: 'john.doe@example.com',
    name: 'John Doe',
    age: 30,
    created: '2024-01-01T00:00:00Z'
};

// ❌ BAD - Meaningless data
const testUser = {
    email: 'a@b.c',
    name: 'x',
    age: 1,
    created: 'now'
};
```

### Use Factories or Fixtures

```javascript
// Test data factory
function createTestUser(overrides = {}) {
    return {
        id: Math.random().toString(36),
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date().toISOString(),
        ...overrides
    };
}

test('creates premium user', () => {
    const premiumUser = createTestUser({ tier: 'premium' });
    expect(premiumUser.tier).toBe('premium');
});
```

### Clean Up Test Data

```javascript
describe('Database Tests', () => {
    beforeEach(async () => {
        await db.clear();  // Start fresh
    });
    
    afterEach(async () => {
        await db.clear();  // Clean up
    });
    
    test('creates record', async () => {
        const result = await db.create({ name: 'Test' });
        expect(result).toBeDefined();
    });
});
```

## When to Write Tests

### Test-Driven Development (TDD) Approach

```
1. Write test (fails - feature doesn't exist yet)
2. Implement minimum code to pass test
3. Refactor while keeping tests green
4. Repeat
```

**Benefits:**
- Forces thinking about API design upfront
- Ensures testable code
- Built-in documentation
- Prevents over-engineering

### Test-After Development

```
1. Implement feature
2. Write tests to cover implementation
3. Refactor with confidence
```

**When to use:**
- Exploring new solutions
- Prototyping
- Tight deadlines (but add tests before PR!)

## Test Maintenance

### Keep Tests Simple

```javascript
// ✅ GOOD - Simple and clear
test('adds two numbers', () => {
    expect(add(2, 3)).toBe(5);
});

// ❌ BAD - Overly complex
test('math operations', () => {
    const inputs = [[2,3], [4,5], [6,7]];
    const expected = [5, 9, 13];
    inputs.forEach((input, i) => {
        expect(add(...input)).toBe(expected[i]);
    });
});
```

### One Assert Per Test (Generally)

```javascript
// ✅ GOOD - Focused test
test('returns status code 200', async () => {
    const response = await request(app).get('/api/data');
    expect(response.status).toBe(200);
});

test('returns data object', async () => {
    const response = await request(app).get('/api/data');
    expect(response.body).toHaveProperty('data');
});

// ⚠️ ACCEPTABLE - Related assertions
test('returns valid response', async () => {
    const response = await request(app).get('/api/data');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');  // Related to same concept
});
```

### Update Tests When Requirements Change

Tests are documentation. When requirements change:
1. Update tests first (now they fail)
2. Update implementation
3. Tests pass again

## Test Performance

### Fast Tests Are Better

**Optimize for speed:**
- Use mocks for external dependencies
- Parallelize test execution
- Use in-memory databases for tests
- Avoid unnecessary `setTimeout` or `sleep`

```javascript
// ✅ FAST - Mocked
test('fetches user data', async () => {
    mockFetch.mockResolvedValue({ id: 1, name: 'Test' });
    const data = await fetchUser(1);
    expect(data.name).toBe('Test');
});

// ❌ SLOW - Real API call
test('fetches user data', async () => {
    const data = await fetchUser(1);  // Makes real HTTP request
    expect(data.name).toBeTruthy();
}, 5000);  // 5 second timeout!
```

## Coverage Analysis

### Reading Coverage Reports

**Key metrics:**
- **Line coverage**: % of lines executed
- **Branch coverage**: % of if/else paths taken
- **Function coverage**: % of functions called
- **Statement coverage**: % of statements executed

**Focus on branch coverage** - It reveals untested code paths.

```javascript
// Example with 50% branch coverage
function process(value) {
    if (value > 10) {    // Branch 1
        return 'high';
    }
    return 'low';        // Branch 2
}

// Only testing one branch:
test('returns high for 15', () => {
    expect(process(15)).toBe('high');  // Only tests Branch 1
});

// Need to add:
test('returns low for 5', () => {
    expect(process(5)).toBe('low');  // Tests Branch 2
});
```

## Loading Instructions

**When to load this context:**
- At the start of any testing session
- When planning test strategy for new features
- When deciding what level of testing to apply
- When coverage goals are unclear

**How to load:**
```bash
read ../../context/testing/test-strategy-general.md
```

## Summary

**Key Principles:**
1. **Structure**: Use Arrange-Act-Assert pattern
2. **Categories**: Unit (fast, many) → Integration (moderate) → E2E (slow, few)
3. **Coverage**: Aim for 80%+ on business logic, not 100% on everything
4. **Focus**: Test business logic and edge cases, not framework code
5. **Naming**: Clear, descriptive test names (should X when Y)
6. **Organization**: Group by feature, separate by test type
7. **Edge Cases**: Always test null, empty, boundary, and error scenarios
8. **Maintenance**: Keep tests simple, one concept per test
9. **Speed**: Optimize for fast tests, use mocks liberally
10. **Quality > Quantity**: Meaningful tests beat coverage metrics

**Goal**: Write tests that give confidence the code works and document expected behavior.
