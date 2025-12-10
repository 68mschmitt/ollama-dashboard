# Vanilla JavaScript Patterns

**For**: Frontend agent  
**Purpose**: Comprehensive ES6+ JavaScript patterns, DOM manipulation, event handling, and async operations

## Overview

This guide covers modern vanilla JavaScript patterns for the Ollama Metrics Dashboard. We focus on ES6+ features, DOM manipulation best practices, event handling, and async operations without any frameworks.

## ES6+ Language Features

### Arrow Functions

```javascript
// Traditional function
function add(a, b) {
    return a + b;
}

// Arrow function
const add = (a, b) => a + b;

// With block body
const processData = (data) => {
    const result = data.map(x => x * 2);
    return result;
};

// Lexical 'this' binding (useful for event handlers)
class Dashboard {
    constructor() {
        this.count = 0;
        // Arrow function preserves 'this'
        this.increment = () => {
            this.count++;
        };
    }
}
```

### Template Literals

```javascript
// String interpolation
const name = "Dashboard";
const version = "1.0";
const message = `${name} v${version}`;

// Multi-line strings
const html = `
    <div class="card">
        <h2>${title}</h2>
        <p>${description}</p>
    </div>
`;

// Tagged templates for HTML sanitization
function sanitize(strings, ...values) {
    return strings.reduce((result, str, i) => {
        const value = values[i] || '';
        const escaped = String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
        return result + str + escaped;
    }, '');
}

// Usage
const userInput = '<script>alert("xss")</script>';
const safe = sanitize`<div>${userInput}</div>`;
```

### Destructuring

```javascript
// Object destructuring
const { name, version } = package;
const { data, error = null } = response;

// Array destructuring
const [first, second, ...rest] = items;

// Function parameters
function processUser({ name, age, email }) {
    console.log(name, age, email);
}

// Nested destructuring
const { data: { models }, meta } = apiResponse;
```

### Spread and Rest Operators

```javascript
// Spread arrays
const combined = [...array1, ...array2];
const copy = [...original];

// Spread objects
const updated = { ...user, age: 30 };
const merged = { ...defaults, ...config };

// Rest parameters
function sum(...numbers) {
    return numbers.reduce((a, b) => a + b, 0);
}
```

### Default Parameters

```javascript
function fetchData(url, options = {}) {
    const { method = 'GET', timeout = 5000 } = options;
    // Use method and timeout...
}

// With destructuring
function createCard({ title = 'Untitled', content = '' } = {}) {
    return `<div><h3>${title}</h3><p>${content}</p></div>`;
}
```

## DOM Manipulation

### Selecting Elements

```javascript
// Single element
const header = document.getElementById('header');
const firstCard = document.querySelector('.card');

// Multiple elements (NodeList)
const cards = document.querySelectorAll('.card');
const buttons = document.getElementsByClassName('btn');

// Convert NodeList to Array
const cardsArray = Array.from(cards);
const cardsSpread = [...cards];

// Iterate over NodeList
cards.forEach(card => {
    card.classList.add('processed');
});
```

### Creating Elements

```javascript
// Create and configure element
function createMetricCard(metric) {
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.id = `metric-${metric.id}`;
    
    card.innerHTML = `
        <h3>${metric.name}</h3>
        <p class="value">${metric.value}</p>
        <span class="unit">${metric.unit}</span>
    `;
    
    return card;
}

// Append to DOM
const container = document.getElementById('metrics-container');
const card = createMetricCard(data);
container.appendChild(card);

// Insert at specific position
container.insertBefore(card, container.firstChild);

// Using insertAdjacentHTML (faster for multiple elements)
container.insertAdjacentHTML('beforeend', `
    <div class="metric-card">
        <h3>CPU</h3>
        <p>45%</p>
    </div>
`);
```

### Modifying Elements

```javascript
// Text content
element.textContent = 'New text'; // Safe, escapes HTML
element.innerText = 'New text'; // Respects CSS visibility

// HTML content (CAUTION: XSS risk if not sanitized)
element.innerHTML = '<strong>Bold</strong>';

// Attributes
element.setAttribute('data-id', '123');
element.getAttribute('data-id');
element.removeAttribute('disabled');

// Data attributes
element.dataset.userId = '123'; // Sets data-user-id
const userId = element.dataset.userId;

// Classes
element.classList.add('active');
element.classList.remove('hidden');
element.classList.toggle('expanded');
element.classList.contains('active'); // true/false

// Styles (prefer CSS classes)
element.style.color = 'red';
element.style.backgroundColor = '#333';
element.style.transform = 'translateX(10px)';
```

### Removing Elements

```javascript
// Remove element
element.remove();

// Remove child
parent.removeChild(child);

// Clear all children (fast)
container.innerHTML = '';

// Clear all children (safer, removes event listeners)
while (container.firstChild) {
    container.removeChild(container.firstChild);
}
```

## Event Handling

### Adding Event Listeners

```javascript
// Basic event listener
button.addEventListener('click', (event) => {
    console.log('Button clicked');
});

// With options
button.addEventListener('click', handler, {
    once: true,      // Remove after first trigger
    passive: true,   // Won't call preventDefault
    capture: false   // Bubble phase (default)
});

// Multiple events
['click', 'touchstart'].forEach(eventType => {
    button.addEventListener(eventType, handler);
});
```

### Event Delegation

```javascript
// ❌ BAD: Attaching handlers to many elements
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', handleCardClick);
});

// ✅ GOOD: Single handler on parent (event delegation)
document.getElementById('cards-container').addEventListener('click', (event) => {
    const card = event.target.closest('.card');
    if (card) {
        handleCardClick(card, event);
    }
});

// Event delegation for dynamic content
document.getElementById('model-list').addEventListener('click', (event) => {
    if (event.target.matches('.delete-btn')) {
        const modelName = event.target.dataset.model;
        deleteModel(modelName);
    }
});
```

### Preventing Default Behavior

```javascript
// Prevent form submission
form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleFormData(new FormData(form));
});

// Prevent link navigation
link.addEventListener('click', (event) => {
    event.preventDefault();
    handleCustomNavigation(link.href);
});
```

### Debouncing and Throttling

```javascript
// Debounce: Execute after delay, reset on new call
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Usage: Search input
const searchInput = document.getElementById('search');
const debouncedSearch = debounce((value) => {
    performSearch(value);
}, 300);

searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
});

// Throttle: Execute at most once per interval
function throttle(func, interval) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= interval) {
            lastCall = now;
            func(...args);
        }
    };
}

// Usage: Scroll event
const throttledScroll = throttle(() => {
    updateScrollPosition();
}, 100);

window.addEventListener('scroll', throttledScroll);
```

## Fetch API and Async Operations

### Basic Fetch Patterns

```javascript
// GET request
async function fetchModels() {
    try {
        const response = await fetch('/api/models');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch models:', error);
        showErrorMessage('Could not load models');
        throw error;
    }
}

// POST request with JSON body
async function generateText(model, prompt) {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model, prompt })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Generation failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Generation error:', error);
        throw error;
    }
}

// DELETE request
async function deleteModel(modelName) {
    try {
        const response = await fetch(`/api/models/${modelName}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete model');
        }
        
        return true;
    } catch (error) {
        console.error('Delete error:', error);
        return false;
    }
}
```

### Handling Multiple Requests

```javascript
// Parallel requests (all must succeed)
async function loadDashboardData() {
    try {
        const [models, metrics, status] = await Promise.all([
            fetch('/api/models').then(r => r.json()),
            fetch('/api/hardware').then(r => r.json()),
            fetch('/api/health').then(r => r.json())
        ]);
        
        return { models, metrics, status };
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        throw error;
    }
}

// Sequential requests (second depends on first)
async function loadModelDetails(modelName) {
    const model = await fetch(`/api/models/${modelName}`).then(r => r.json());
    const usage = await fetch(`/api/models/${modelName}/usage`).then(r => r.json());
    return { ...model, usage };
}

// Race condition (first to complete wins)
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}
```

### Request Cancellation

```javascript
// Using AbortController
let currentRequest = null;

async function searchModels(query) {
    // Cancel previous request
    if (currentRequest) {
        currentRequest.abort();
    }
    
    currentRequest = new AbortController();
    
    try {
        const response = await fetch(`/api/search?q=${query}`, {
            signal: currentRequest.signal
        });
        
        const results = await response.json();
        displayResults(results);
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Request cancelled');
        } else {
            console.error('Search error:', error);
        }
    }
}
```

## State Management

### LocalStorage Patterns

```javascript
// Save state
function saveState(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Failed to save state:', error);
    }
}

// Load state with fallback
function loadState(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Failed to load state:', error);
        return defaultValue;
    }
}

// Remove state
function clearState(key) {
    localStorage.removeItem(key);
}

// Example: Theme preference
function saveTheme(theme) {
    saveState('theme', theme);
    document.body.dataset.theme = theme;
}

function loadTheme() {
    const theme = loadState('theme', 'light');
    document.body.dataset.theme = theme;
    return theme;
}
```

### Simple State Store

```javascript
// Create a simple reactive state store
class Store {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = new Set();
    }
    
    getState() {
        return this.state;
    }
    
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.notify();
    }
    
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener); // Unsubscribe function
    }
    
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

// Usage
const dashboardStore = new Store({
    models: [],
    selectedModel: null,
    loading: false
});

// Subscribe to changes
const unsubscribe = dashboardStore.subscribe((state) => {
    updateUI(state);
});

// Update state
dashboardStore.setState({ loading: true });
fetchModels().then(models => {
    dashboardStore.setState({ models, loading: false });
});
```

## Error Handling Patterns

### Try-Catch Best Practices

```javascript
// Specific error handling
async function loadData() {
    try {
        const response = await fetch('/api/data');
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Data not found');
            } else if (response.status === 503) {
                throw new Error('Service unavailable');
            } else {
                throw new Error(`Request failed: ${response.status}`);
            }
        }
        
        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError') {
            // Network error
            console.error('Network error:', error);
            showErrorMessage('Network connection failed');
        } else {
            console.error('Error loading data:', error);
            showErrorMessage(error.message);
        }
        throw error;
    }
}
```

### Global Error Handler

```javascript
// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showErrorMessage('An unexpected error occurred');
    event.preventDefault();
});

// Catch runtime errors
window.addEventListener('error', (event) => {
    console.error('Runtime error:', event.error);
    showErrorMessage('An error occurred. Please refresh the page.');
});
```

## Common Pitfalls

### This Binding

```javascript
// ❌ BAD: 'this' is undefined
class Dashboard {
    constructor() {
        this.count = 0;
    }
    
    increment() {
        this.count++;
    }
}

const dash = new Dashboard();
button.addEventListener('click', dash.increment); // 'this' is button, not dash

// ✅ GOOD: Arrow function preserves 'this'
class Dashboard {
    constructor() {
        this.count = 0;
        this.increment = () => {
            this.count++;
        };
    }
}

// ✅ GOOD: Explicit binding
button.addEventListener('click', dash.increment.bind(dash));

// ✅ GOOD: Wrapper function
button.addEventListener('click', () => dash.increment());
```

### Async/Await Without Try-Catch

```javascript
// ❌ BAD: Unhandled rejection
async function loadData() {
    const data = await fetch('/api/data').then(r => r.json());
    updateUI(data);
}

// ✅ GOOD: Proper error handling
async function loadData() {
    try {
        const data = await fetch('/api/data').then(r => r.json());
        updateUI(data);
    } catch (error) {
        handleError(error);
    }
}
```

### Memory Leaks from Event Listeners

```javascript
// ❌ BAD: Creating new listener each time
function updateCard(cardId) {
    const card = document.getElementById(cardId);
    card.addEventListener('click', () => handleClick(cardId));
}

// ✅ GOOD: Remove old listener or use delegation
function updateCard(cardId) {
    const card = document.getElementById(cardId);
    card.removeEventListener('click', handleClick);
    card.addEventListener('click', handleClick);
}

// ✅ BETTER: Use event delegation (no cleanup needed)
document.getElementById('cards').addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) handleClick(card.id);
});
```

### Modifying NodeList During Iteration

```javascript
// ❌ BAD: Length changes during iteration
const items = document.querySelectorAll('.item');
items.forEach(item => {
    item.remove(); // Changes DOM during iteration
});

// ✅ GOOD: Convert to array first
const items = Array.from(document.querySelectorAll('.item'));
items.forEach(item => item.remove());

// ✅ GOOD: Iterate backwards
const items = document.querySelectorAll('.item');
for (let i = items.length - 1; i >= 0; i--) {
    items[i].remove();
}
```

## Loading Instructions

**When to load this context:**
- Starting any JavaScript implementation work
- Working with DOM manipulation
- Implementing event handlers
- Using async/await and fetch API
- Managing client-side state
- Debugging JavaScript issues

**How to load:**
```bash
read .opencode/context/frontend/vanilla-js-patterns.md
```

**Also consider loading:**
- `responsive-design-patterns.md` - For CSS and layout work
- `ui-component-patterns.md` - For building UI components
- `accessibility-guidelines.md` - For accessible implementations

## Summary

**Key Takeaways:**
- Use ES6+ features (arrow functions, destructuring, template literals)
- Cache DOM queries for better performance
- Use event delegation for dynamic content
- Always use try-catch with async/await
- Sanitize user input before rendering HTML
- Prefer arrow functions for preserving 'this' binding
- Use AbortController for request cancellation
- Store state in localStorage with JSON serialization

**Goal**: Write clean, modern vanilla JavaScript code that is maintainable, performant, and follows best practices.
