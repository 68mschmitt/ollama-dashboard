# Puppeteer E2E Testing

**For**: Testing agent (and other agents needing browser automation)  
**Purpose**: End-to-end testing patterns using Puppeteer MCP tools for browser automation

## Overview

Puppeteer MCP provides browser automation tools for end-to-end testing. These tools allow you to navigate pages, interact with elements, evaluate JavaScript, and capture screenshots.

**Key Capabilities:**
- Page navigation and interaction
- Element clicking, filling forms, hovering
- JavaScript evaluation in browser context
- Screenshot and snapshot capture
- Network request monitoring
- Console log inspection

## Basic Test Structure

```javascript
describe('Dashboard E2E Tests', () => {
    test('should load and display metrics', async () => {
        // Navigate to page
        await puppeteer_puppeteer_navigate({ 
            url: "http://localhost:3000" 
        });
        
        // Verify element exists
        const result = await puppeteer_puppeteer_evaluate({
            script: "return document.querySelector('#metrics-container') !== null"
        });
        expect(result).toBe(true);
        
        // Take screenshot for visual verification
        await puppeteer_puppeteer_screenshot({ 
            name: "metrics-loaded" 
        });
    });
});
```

## Navigation

### Navigate to URL

```javascript
// Basic navigation
await puppeteer_puppeteer_navigate({
    url: "http://localhost:3000"
});

// Navigate with custom timeout
await puppeteer_puppeteer_navigate({
    url: "http://localhost:3000/dashboard",
    timeout: 10000  // 10 seconds
});

// Navigate back
await puppeteer_puppeteer_navigate({
    type: "back"
});

// Navigate forward
await puppeteer_puppeteer_navigate({
    type: "forward"
});

// Reload page
await puppeteer_puppeteer_navigate({
    type: "reload"
});
```

## Element Interaction

### Taking Snapshots

Before interacting with elements, take a snapshot to get element UIDs:

```javascript
// Take snapshot to see available elements
await puppeteer_puppeteer_take_snapshot();

// Output shows elements with UIDs:
// <button uid="elem-123">Submit</button>
// <input uid="elem-456" type="text" />
```

### Clicking Elements

```javascript
// Click button
await puppeteer_puppeteer_click({
    uid: "elem-123"  // UID from snapshot
});

// Double click
await puppeteer_puppeteer_click({
    uid: "elem-123",
    dblClick: true
});
```

### Filling Forms

```javascript
// Fill text input
await puppeteer_puppeteer_fill({
    uid: "elem-456",
    value: "test input"
});

// Fill email input
await puppeteer_puppeteer_fill({
    uid: "email-input",
    value: "test@example.com"
});

// Select dropdown option
await puppeteer_puppeteer_fill({
    uid: "select-uid",
    value: "option-value"
});
```

### Hovering

```javascript
// Hover over element to trigger tooltips, menus, etc.
await puppeteer_puppeteer_hover({
    uid: "menu-item-uid"
});
```

### Pressing Keys

```javascript
// Press Enter key
await puppeteer_puppeteer_press_key({
    key: "Enter"
});

// Press keyboard shortcuts
await puppeteer_puppeteer_press_key({
    key: "Control+A"  // Select all
});

await puppeteer_puppeteer_press_key({
    key: "Control+C"  // Copy
});

// Press Tab to navigate
await puppeteer_puppeteer_press_key({
    key: "Tab"
});
```

## JavaScript Evaluation

### Evaluate Scripts in Browser

```javascript
// Check element existence
const exists = await puppeteer_puppeteer_evaluate_script({
    function: "() => { return document.querySelector('#metrics-container') !== null }"
});
expect(exists).toBe(true);

// Get element text
const text = await puppeteer_puppeteer_evaluate_script({
    function: "() => { return document.querySelector('h1').textContent }"
});
expect(text).toBe('Dashboard');

// Get page title
const title = await puppeteer_puppeteer_evaluate_script({
    function: "() => { return document.title }"
});
expect(title).toContain('Ollama');

// Check if element is visible
const visible = await puppeteer_puppeteer_evaluate_script({
    function: "() => { const el = document.querySelector('#modal'); return el && el.offsetParent !== null }"
});
expect(visible).toBe(true);

// Get form values
const formData = await puppeteer_puppeteer_evaluate_script({
    function: `() => {
        return {
            email: document.querySelector('#email').value,
            password: document.querySelector('#password').value
        }
    }`
});
expect(formData.email).toBe('test@example.com');
```

### Passing Arguments to Scripts

```javascript
// Evaluate script with element argument
const elementText = await puppeteer_puppeteer_evaluate_script({
    function: "(el) => { return el.innerText }",
    args: [{ uid: "elem-123" }]
});
```

## Screenshots and Visual Verification

### Taking Screenshots

```javascript
// Screenshot entire page
await puppeteer_puppeteer_take_screenshot({
    name: "full-page"
});

// Screenshot specific element
await puppeteer_puppeteer_take_screenshot({
    name: "button-screenshot",
    uid: "button-uid"
});

// Screenshot with custom path
await puppeteer_puppeteer_take_screenshot({
    name: "test-screenshot",
    filePath: "/path/to/screenshots/test.png"
});

// Full page screenshot (beyond viewport)
await puppeteer_puppeteer_take_screenshot({
    name: "full-page-scroll",
    fullPage: true
});
```

## Waiting for Elements

### Wait for Text to Appear

```javascript
// Wait for specific text to appear on page
await puppeteer_puppeteer_wait_for({
    text: "Loading complete",
    timeout: 5000  // 5 seconds
});

// Wait for success message
await puppeteer_puppeteer_wait_for({
    text: "Saved successfully"
});
```

## Complete E2E Test Examples

### Example 1: User Login Flow

```javascript
describe('E2E: User Login', () => {
    test('user can log in successfully', async () => {
        // Navigate to login page
        await puppeteer_puppeteer_navigate({
            url: "http://localhost:3000/login"
        });
        
        // Take snapshot to get UIDs
        await puppeteer_puppeteer_take_snapshot();
        
        // Fill login form (using UIDs from snapshot)
        await puppeteer_puppeteer_fill({
            uid: "email-input",
            value: "test@example.com"
        });
        
        await puppeteer_puppeteer_fill({
            uid: "password-input",
            value: "password123"
        });
        
        // Click submit button
        await puppeteer_puppeteer_click({
            uid: "submit-button"
        });
        
        // Wait for redirect and success message
        await puppeteer_puppeteer_wait_for({
            text: "Welcome back",
            timeout: 5000
        });
        
        // Verify we're on dashboard
        const url = await puppeteer_puppeteer_evaluate_script({
            function: "() => { return window.location.pathname }"
        });
        expect(url).toBe('/dashboard');
        
        // Take screenshot of logged-in state
        await puppeteer_puppeteer_take_screenshot({
            name: "logged-in-dashboard"
        });
    });
    
    test('shows error for invalid credentials', async () => {
        await puppeteer_puppeteer_navigate({
            url: "http://localhost:3000/login"
        });
        
        await puppeteer_puppeteer_take_snapshot();
        
        await puppeteer_puppeteer_fill({
            uid: "email-input",
            value: "wrong@example.com"
        });
        
        await puppeteer_puppeteer_fill({
            uid: "password-input",
            value: "wrongpassword"
        });
        
        await puppeteer_puppeteer_click({
            uid: "submit-button"
        });
        
        // Wait for error message
        await puppeteer_puppeteer_wait_for({
            text: "Invalid credentials"
        });
        
        // Verify still on login page
        const url = await puppeteer_puppeteer_evaluate_script({
            function: "() => { return window.location.pathname }"
        });
        expect(url).toBe('/login');
    });
});
```

### Example 2: Dashboard Metrics Display

```javascript
describe('E2E: Dashboard Metrics', () => {
    test('loads and displays metrics correctly', async () => {
        // Navigate to dashboard
        await puppeteer_puppeteer_navigate({
            url: "http://localhost:3000"
        });
        
        // Wait for metrics to load
        await puppeteer_puppeteer_wait_for({
            text: "Hardware Metrics",
            timeout: 10000
        });
        
        // Verify metrics container exists
        const hasMetrics = await puppeteer_puppeteer_evaluate_script({
            function: "() => { return document.querySelector('#metrics-container') !== null }"
        });
        expect(hasMetrics).toBe(true);
        
        // Check if CPU metric is displayed
        const cpuText = await puppeteer_puppeteer_evaluate_script({
            function: "() => { return document.querySelector('.cpu-metric').textContent }"
        });
        expect(cpuText).toContain('%');
        
        // Take screenshot of metrics
        await puppeteer_puppeteer_take_screenshot({
            name: "dashboard-metrics",
            uid: "metrics-container"
        });
    });
    
    test('refreshes metrics on button click', async () => {
        await puppeteer_puppeteer_navigate({
            url: "http://localhost:3000"
        });
        
        await puppeteer_puppeteer_wait_for({ text: "Hardware Metrics" });
        
        // Get initial CPU value
        const initialCPU = await puppeteer_puppeteer_evaluate_script({
            function: "() => { return document.querySelector('.cpu-metric').textContent }"
        });
        
        // Take snapshot to get refresh button UID
        await puppeteer_puppeteer_take_snapshot();
        
        // Click refresh
        await puppeteer_puppeteer_click({
            uid: "refresh-button"
        });
        
        // Wait a moment for refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify metrics updated (or at least attempted refresh)
        const loadingIndicator = await puppeteer_puppeteer_evaluate_script({
            function: "() => { return document.querySelector('.loading') !== null }"
        });
        
        // Loading should have appeared and disappeared
        expect(loadingIndicator).toBeDefined();
    });
});
```

### Example 3: Form Submission

```javascript
describe('E2E: Instance Creation', () => {
    test('creates new Ollama instance', async () => {
        // Navigate to instances page
        await puppeteer_puppeteer_navigate({
            url: "http://localhost:3000/instances"
        });
        
        // Take snapshot
        await puppeteer_puppeteer_take_snapshot();
        
        // Click "Add Instance" button
        await puppeteer_puppeteer_click({
            uid: "add-instance-button"
        });
        
        // Wait for form to appear
        await puppeteer_puppeteer_wait_for({
            text: "New Instance"
        });
        
        // Take snapshot of form
        await puppeteer_puppeteer_take_snapshot();
        
        // Fill form fields
        await puppeteer_puppeteer_fill({
            uid: "instance-name-input",
            value: "Test Instance"
        });
        
        await puppeteer_puppeteer_fill({
            uid: "instance-host-input",
            value: "http://localhost:11434"
        });
        
        // Submit form
        await puppeteer_puppeteer_click({
            uid: "submit-instance-button"
        });
        
        // Wait for success message
        await puppeteer_puppeteer_wait_for({
            text: "Instance created successfully",
            timeout: 5000
        });
        
        // Verify instance appears in list
        const hasInstance = await puppeteer_puppeteer_evaluate_script({
            function: "() => { return Array.from(document.querySelectorAll('.instance-item')).some(el => el.textContent.includes('Test Instance')) }"
        });
        expect(hasInstance).toBe(true);
        
        // Take screenshot of success state
        await puppeteer_puppeteer_take_screenshot({
            name: "instance-created"
        });
    });
});
```

## Multi-Page Testing

### Managing Multiple Pages

```javascript
// List all open pages
await puppeteer_list_pages();

// Select specific page
await puppeteer_select_page({
    pageIdx: 0  // Select first page
});

// Open new page
await puppeteer_new_page({
    url: "http://localhost:3000/other"
});

// Close page
await puppeteer_close_page({
    pageIdx: 1  // Close second page
});
```

## Network and Console Monitoring

### List Network Requests

```javascript
// Get all network requests
const requests = await puppeteer_list_network_requests();

// Filter by resource type
const requests = await puppeteer_list_network_requests({
    resourceTypes: ["xhr", "fetch"]
});

// Get specific request details
const request = await puppeteer_get_network_request({
    reqid: 123
});
```

### Monitor Console Messages

```javascript
// Get console logs
const messages = await puppeteer_list_console_messages({
    types: ["log", "error", "warn"]
});

// Get specific message
const message = await puppeteer_get_console_message({
    msgid: 456
});
```

## Best Practices

### 1. Always Take Snapshots Before Interactions

```javascript
// ✅ GOOD
await puppeteer_puppeteer_take_snapshot();
// Now you can see UIDs and interact with elements

await puppeteer_puppeteer_click({ uid: "button-123" });

// ❌ BAD - Don't guess UIDs
await puppeteer_puppeteer_click({ uid: "button-1" });  // May not exist
```

### 2. Use Waiting Strategies

```javascript
// ✅ GOOD - Wait for dynamic content
await puppeteer_puppeteer_wait_for({ text: "Loaded" });
await puppeteer_puppeteer_take_snapshot();

// ❌ BAD - Assuming content loaded instantly
await puppeteer_puppeteer_take_snapshot();  // May capture loading state
```

### 3. Verify State After Actions

```javascript
// ✅ GOOD - Verify action succeeded
await puppeteer_puppeteer_click({ uid: "save-button" });
await puppeteer_puppeteer_wait_for({ text: "Saved successfully" });

const saved = await puppeteer_puppeteer_evaluate_script({
    function: "() => { return document.querySelector('.success-message') !== null }"
});
expect(saved).toBe(true);

// ❌ BAD - No verification
await puppeteer_puppeteer_click({ uid: "save-button" });
// Did it save? Who knows!
```

### 4. Use Descriptive Screenshot Names

```javascript
// ✅ GOOD
await puppeteer_puppeteer_take_screenshot({
    name: "user-logged-in-dashboard-view"
});

// ❌ BAD
await puppeteer_puppeteer_take_screenshot({
    name: "test1"
});
```

### 5. Clean Up After Tests

```javascript
describe('E2E Tests', () => {
    afterEach(async () => {
        // Close any extra pages opened during test
        const pages = await puppeteer_list_pages();
        if (pages.length > 1) {
            for (let i = 1; i < pages.length; i++) {
                await puppeteer_close_page({ pageIdx: i });
            }
        }
    });
});
```

## When to Use Puppeteer E2E Tests

✅ **USE Puppeteer for:**
- Complete user workflows (login → browse → checkout)
- UI interaction testing (clicks, forms, navigation)
- Visual regression testing (screenshots before/after changes)
- JavaScript-heavy functionality validation
- Cross-browser testing scenarios
- Dynamic content loading verification

❌ **DON'T USE Puppeteer for:**
- API testing (use Supertest instead)
- Unit testing business logic (use Jest directly)
- Quick smoke tests (E2E is slow)
- Testing every edge case (reserve for critical paths)

## Troubleshooting

### Element Not Found

```javascript
// Take snapshot first to verify element exists
await puppeteer_puppeteer_take_snapshot();
// Check output for element UID
// If not present, check if page loaded completely
await puppeteer_puppeteer_wait_for({ text: "expected content" });
```

### Timeout Errors

```javascript
// Increase timeout for slow pages
await puppeteer_puppeteer_navigate({
    url: "http://localhost:3000",
    timeout: 30000  // 30 seconds
});

await puppeteer_puppeteer_wait_for({
    text: "Loaded",
    timeout: 10000  // 10 seconds
});
```

### Page Not Loading

```javascript
// Check if server is running
// Verify URL is correct
// Check network requests for errors
const requests = await puppeteer_list_network_requests();
// Look for failed requests (status 4xx, 5xx)
```

## Loading Instructions

**When to load this context:**
- Before writing E2E tests with Puppeteer
- When setting up browser automation tests
- When testing UI workflows

**How to load:**
```bash
read ../../context/testing/puppeteer-e2e-testing.md
```

## Summary

**Key Puppeteer Patterns:**
1. Navigate → Snapshot → Interact → Verify
2. Always use `wait_for` for dynamic content
3. Take screenshots for visual verification
4. Use descriptive names for screenshots and tests
5. Verify state after every action
6. Focus E2E tests on critical user workflows
7. Keep E2E tests separate from unit/integration tests

**Goal**: Automate end-to-end user workflows with confidence and visibility.
