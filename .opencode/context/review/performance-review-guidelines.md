# Performance Review Guidelines

**For**: Reviewer agent  
**Purpose**: Performance considerations for backend/frontend code, database queries, caching, and bundle size optimization

## Overview

Performance issues can significantly impact user experience. This guide helps identify performance anti-patterns and ensure implementations are optimized for speed and efficiency.

## Backend Performance

### 1. Async Operations

**Principle**: Use `Promise.all()` for parallel operations, avoid sequential awaits when not needed.

**❌ Sequential (Slow)**:
```javascript
// Takes 3 seconds if each request takes 1 second
async function getModelData() {
  const models = await fetchModels();        // 1 second
  const running = await fetchRunning();      // 1 second (waits for models)
  const hardware = await fetchHardware();    // 1 second (waits for running)
  
  return { models, running, hardware };
}
```

**✅ Parallel (Fast)**:
```javascript
// Takes 1 second (all requests run simultaneously)
async function getModelData() {
  const [models, running, hardware] = await Promise.all([
    fetchModels(),
    fetchRunning(),
    fetchHardware()
  ]);
  
  return { models, running, hardware };
}
```

**When to use each**:
- **Sequential**: When operation B depends on result of operation A
- **Parallel**: When operations are independent

**Example with Dependencies**:
```javascript
async function getUserProfile(userId) {
  // Must be sequential - need userId to fetch related data
  const user = await fetchUser(userId);
  const posts = await fetchUserPosts(user.id);
  
  // But can parallelize independent operations
  const [followers, following] = await Promise.all([
    fetchFollowers(user.id),
    fetchFollowing(user.id)
  ]);
  
  return { user, posts, followers, following };
}
```

### 2. Caching

**Principle**: Cache expensive operations, especially external API calls.

**Simple In-Memory Cache**:
```javascript
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute

async function getCachedModels() {
  const now = Date.now();
  const cached = cache.get('models');
  
  // Return cached if still valid
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Fetch fresh data
  const models = await fetchModels();
  cache.set('models', {
    data: models,
    timestamp: now
  });
  
  return models;
}

// Clear cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      cache.delete(key);
    }
  }
}, CACHE_TTL);
```

**When to Cache**:
- ✓ External API calls (especially slow ones)
- ✓ Database queries for rarely-changing data
- ✓ Expensive computations (heavy processing)
- ✗ User-specific data (unless per-user cache)
- ✗ Rapidly changing data
- ✗ Authentication/authorization checks

**Cache Invalidation**:
```javascript
// Invalidate on write operations
app.post('/api/models', async (req, res) => {
  const result = await createModel(req.body);
  
  // Clear cache after modification
  cache.delete('models');
  
  res.status(201).json(result);
});
```

### 3. Avoid Blocking Operations

**❌ Blocking (Synchronous I/O)**:
```javascript
const fs = require('fs');

// Blocks entire event loop - DON'T DO THIS
app.get('/api/data', (req, res) => {
  const data = fs.readFileSync('./data.json', 'utf8'); // BLOCKS
  res.json(JSON.parse(data));
});
```

**✅ Non-Blocking (Async I/O)**:
```javascript
const fs = require('fs/promises');

// Uses async I/O - event loop continues
app.get('/api/data', async (req, res) => {
  const data = await fs.readFile('./data.json', 'utf8');
  res.json(JSON.parse(data));
});
```

**Common Blocking Operations to Avoid**:
- `fs.readFileSync()` → Use `fs.promises.readFile()`
- `crypto.pbkdf2Sync()` → Use `crypto.pbkdf2()`
- `child_process.execSync()` → Use `child_process.exec()` with promises
- Heavy computation in single tick → Use `setImmediate()` or worker threads

### 4. Response Compression

**Enable gzip compression**:
```javascript
const compression = require('compression');

// Compress all responses
app.use(compression());

// Or conditionally compress
app.use(compression({
  filter: (req, res) => {
    // Don't compress small responses
    if (res.getHeader('Content-Length') < 1024) return false;
    
    // Use default compression filter
    return compression.filter(req, res);
  },
  level: 6 // Compression level (1-9, 6 is default)
}));
```

**Benefits**:
- Reduces response size by 60-80% for text
- Faster transfer over network
- Lower bandwidth costs

### 5. Connection Pooling

**For HTTP clients**:
```javascript
const axios = require('axios');
const http = require('http');
const https = require('https');

// Create persistent connection pools
const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50
});

const ollamaClient = axios.create({
  baseURL: process.env.OLLAMA_BASE_URL,
  httpAgent,
  httpsAgent,
  timeout: 5000
});

// Reuse client for all requests
app.get('/api/models', async (req, res) => {
  const response = await ollamaClient.get('/api/tags');
  res.json(response.data);
});
```

**Benefits**:
- Reuses TCP connections
- Avoids overhead of connection setup/teardown
- Faster requests (no SSL handshake every time)

### 6. Streaming Large Responses

**❌ Load entire response into memory**:
```javascript
app.get('/api/large-data', async (req, res) => {
  // Loads entire file into memory - bad for large files
  const data = await fs.readFile('./large-file.json', 'utf8');
  res.json(JSON.parse(data));
});
```

**✅ Stream response**:
```javascript
const { pipeline } = require('stream/promises');

app.get('/api/large-data', async (req, res) => {
  // Stream file directly to response
  const stream = fs.createReadStream('./large-file.json');
  res.setHeader('Content-Type', 'application/json');
  await pipeline(stream, res);
});
```

### 7. Avoid N+1 Queries

**❌ N+1 Query Problem** (if using database):
```javascript
// Fetches users, then makes 1 query per user for posts (N+1)
async function getUsersWithPosts() {
  const users = await User.findAll(); // 1 query
  
  for (const user of users) {
    user.posts = await Post.findAll({ userId: user.id }); // N queries
  }
  
  return users;
}
```

**✅ Batch Query**:
```javascript
// Fetches users and all posts in 2 queries total
async function getUsersWithPosts() {
  const users = await User.findAll(); // 1 query
  const userIds = users.map(u => u.id);
  
  const posts = await Post.findAll({ 
    userId: { $in: userIds } 
  }); // 1 query
  
  // Map posts to users
  const postsByUser = posts.reduce((acc, post) => {
    if (!acc[post.userId]) acc[post.userId] = [];
    acc[post.userId].push(post);
    return acc;
  }, {});
  
  users.forEach(user => {
    user.posts = postsByUser[user.id] || [];
  });
  
  return users;
}
```

### 8. Rate Limiting API Calls

**Prevent overwhelming external services**:
```javascript
const pLimit = require('p-limit');

// Limit concurrent API calls
const limit = pLimit(5); // Max 5 concurrent

async function fetchModelDetails(models) {
  // Without limit: All requests fire simultaneously (could overwhelm Ollama)
  // With limit: Only 5 concurrent, queues the rest
  
  return Promise.all(
    models.map(model => 
      limit(() => ollamaClient.post('/api/show', { name: model.name }))
    )
  );
}
```

## Frontend Performance

### 1. Minimize DOM Manipulation

**❌ Multiple Reflows**:
```javascript
// Causes 100 reflows (very slow)
for (let i = 0; i < 100; i++) {
  const div = document.createElement('div');
  div.textContent = `Item ${i}`;
  document.body.appendChild(div); // Reflow on each append
}
```

**✅ Batch DOM Updates**:
```javascript
// Causes 1 reflow (fast)
const fragment = document.createDocumentFragment();
for (let i = 0; i < 100; i++) {
  const div = document.createElement('div');
  div.textContent = `Item ${i}`;
  fragment.appendChild(div);
}
document.body.appendChild(fragment); // Single reflow
```

**✅ Alternative: Build HTML String**:
```javascript
// Also causes 1 reflow
const html = Array.from({ length: 100 }, (_, i) => 
  `<div>Item ${i}</div>`
).join('');
document.body.innerHTML = html;
```

### 2. Cache DOM Queries

**❌ Repeated Queries**:
```javascript
// Queries DOM 100 times (slow)
for (let i = 0; i < 100; i++) {
  document.getElementById('status').textContent = `Loading... ${i}%`;
}
```

**✅ Cache Reference**:
```javascript
// Queries DOM once (fast)
const statusEl = document.getElementById('status');
for (let i = 0; i < 100; i++) {
  statusEl.textContent = `Loading... ${i}%`;
}
```

### 3. Debounce/Throttle Event Handlers

**❌ Fire on Every Event**:
```javascript
// Search fires on every keystroke (excessive API calls)
searchInput.addEventListener('input', async (e) => {
  const results = await fetch(`/api/search?q=${e.target.value}`);
  displayResults(await results.json());
});
```

**✅ Debounce (Wait for Pause)**:
```javascript
// Only search after user stops typing for 300ms
let debounceTimer;

searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const results = await fetch(`/api/search?q=${e.target.value}`);
    displayResults(await results.json());
  }, 300);
});
```

**✅ Throttle (Limit Frequency)**:
```javascript
// Only fire once per 200ms (for scroll/resize events)
let throttleTimer = null;

window.addEventListener('scroll', () => {
  if (throttleTimer) return;
  
  throttleTimer = setTimeout(() => {
    handleScroll();
    throttleTimer = null;
  }, 200);
});
```

**When to use each**:
- **Debounce**: Search inputs, form validation (wait for pause)
- **Throttle**: Scroll, resize, mousemove (limit frequency)

### 4. Lazy Load Images

**❌ Load All Images Upfront**:
```html
<!-- All images load immediately (slow initial page load) -->
<img src="large-image-1.jpg" alt="Image 1">
<img src="large-image-2.jpg" alt="Image 2">
<img src="large-image-3.jpg" alt="Image 3">
```

**✅ Native Lazy Loading**:
```html
<!-- Images load as they enter viewport -->
<img src="large-image-1.jpg" alt="Image 1" loading="lazy">
<img src="large-image-2.jpg" alt="Image 2" loading="lazy">
<img src="large-image-3.jpg" alt="Image 3" loading="lazy">
```

**✅ Intersection Observer** (more control):
```javascript
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src; // Load actual image
      img.classList.remove('lazy');
      imageObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('img.lazy').forEach(img => {
  imageObserver.observe(img);
});
```

```html
<img data-src="large-image.jpg" alt="Image" class="lazy">
```

### 5. Optimize Event Delegation

**❌ Attach Listener to Each Item**:
```javascript
// 100 event listeners (memory overhead)
document.querySelectorAll('.item').forEach(item => {
  item.addEventListener('click', handleClick);
});
```

**✅ Event Delegation (Single Listener)**:
```javascript
// 1 event listener (efficient)
document.getElementById('list').addEventListener('click', (e) => {
  if (e.target.matches('.item')) {
    handleClick(e);
  }
});
```

### 6. Avoid Memory Leaks

**Common Causes**:
- Event listeners not removed
- Timers not cleared
- References to removed DOM elements

**❌ Memory Leak**:
```javascript
class Dashboard {
  init() {
    this.timer = setInterval(() => this.update(), 5000);
    document.addEventListener('click', this.handleClick); // Leak!
  }
  
  destroy() {
    // Timer cleared, but event listener not removed
    clearInterval(this.timer);
  }
}
```

**✅ Proper Cleanup**:
```javascript
class Dashboard {
  init() {
    this.timer = setInterval(() => this.update(), 5000);
    this.boundHandleClick = this.handleClick.bind(this);
    document.addEventListener('click', this.boundHandleClick);
  }
  
  destroy() {
    clearInterval(this.timer);
    document.removeEventListener('click', this.boundHandleClick);
    this.timer = null;
    this.boundHandleClick = null;
  }
}
```

### 7. Minimize Bundle Size

**Check for**:
- Unused dependencies
- Large libraries (consider alternatives)
- Duplicate code

**Example Issues**:
```javascript
// ✗ Importing entire lodash (70KB)
import _ from 'lodash';

// ✓ Import only what you need
import debounce from 'lodash/debounce';
```

```javascript
// ✗ Using moment.js for simple formatting (288KB)
import moment from 'moment';
const formatted = moment(date).format('YYYY-MM-DD');

// ✓ Use native Intl or date-fns (lighter alternatives)
const formatted = new Intl.DateTimeFormat('en-CA').format(date);
```

## Database Query Optimization

### 1. Add Indexes

**❌ Missing Index (Slow)**:
```sql
-- Full table scan (slow on large tables)
SELECT * FROM models WHERE name = 'llama2';
```

**✅ With Index (Fast)**:
```sql
-- Index scan (fast lookup)
CREATE INDEX idx_models_name ON models(name);
SELECT * FROM models WHERE name = 'llama2';
```

**When to Index**:
- Columns used in WHERE clauses
- Columns used in JOIN conditions
- Columns used in ORDER BY

**When NOT to Index**:
- Small tables (< 1000 rows)
- Columns with very few unique values
- Columns frequently updated (index maintenance overhead)

### 2. Select Only Needed Columns

**❌ Select All**:
```javascript
// Fetches all columns (wasteful if you only need name and size)
const models = await db.query('SELECT * FROM models');
```

**✅ Select Specific**:
```javascript
// Only fetch what you need (faster, less memory)
const models = await db.query('SELECT id, name, size FROM models');
```

### 3. Use Pagination

**❌ Fetch All Rows**:
```javascript
// Could return millions of rows (slow, memory exhaustion)
const allModels = await db.query('SELECT * FROM models');
res.json(allModels);
```

**✅ Paginate Results**:
```javascript
const page = parseInt(req.query.page) || 1;
const pageSize = 20;
const offset = (page - 1) * pageSize;

const models = await db.query(
  'SELECT * FROM models LIMIT ? OFFSET ?',
  [pageSize, offset]
);

res.json({
  models,
  page,
  pageSize,
  hasMore: models.length === pageSize
});
```

### 4. Use Connection Pooling

**❌ New Connection Per Request**:
```javascript
// Opens new connection on every request (slow)
app.get('/api/models', async (req, res) => {
  const db = await createConnection();
  const models = await db.query('SELECT * FROM models');
  await db.close();
  res.json(models);
});
```

**✅ Connection Pool**:
```javascript
// Reuses connections from pool (fast)
const pool = createPool({
  host: 'localhost',
  database: 'mydb',
  max: 10 // Max 10 concurrent connections
});

app.get('/api/models', async (req, res) => {
  const models = await pool.query('SELECT * FROM models');
  res.json(models);
});
```

## Performance Measurement

### Backend Timing

```javascript
// Measure endpoint performance
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);
    
    // Alert on slow requests
    if (duration > 1000) {
      console.warn(`SLOW REQUEST: ${req.path} took ${duration}ms`);
    }
  });
  
  next();
});
```

### Frontend Timing

```javascript
// Measure API call performance
async function fetchModels() {
  const start = performance.now();
  
  const response = await fetch('/api/models');
  const data = await response.json();
  
  const duration = performance.now() - start;
  console.log(`Fetched models in ${duration.toFixed(2)}ms`);
  
  return data;
}

// Measure render performance
function renderModels(models) {
  const start = performance.now();
  
  // Render logic
  const html = models.map(m => `<div>${m.name}</div>`).join('');
  document.getElementById('models').innerHTML = html;
  
  const duration = performance.now() - start;
  console.log(`Rendered ${models.length} models in ${duration.toFixed(2)}ms`);
}
```

## Performance Review Checklist

### Backend Review
- [ ] Parallel operations use `Promise.all()`, not sequential awaits
- [ ] Expensive operations are cached with appropriate TTL
- [ ] No blocking synchronous I/O (use async alternatives)
- [ ] Response compression enabled for text responses
- [ ] HTTP client uses connection pooling (keepAlive)
- [ ] Large responses use streaming, not loading into memory
- [ ] No N+1 query patterns (batch queries)
- [ ] External API calls are rate-limited

### Frontend Review
- [ ] DOM manipulation is batched (fragments or innerHTML)
- [ ] DOM queries are cached, not repeated
- [ ] Event handlers are debounced/throttled where appropriate
- [ ] Images use lazy loading
- [ ] Event delegation used instead of many listeners
- [ ] Event listeners and timers properly cleaned up
- [ ] Bundle size is reasonable (no unnecessary libraries)
- [ ] No memory leaks (listeners removed, timers cleared)

### Database Review
- [ ] Indexes exist on frequently queried columns
- [ ] Queries select only needed columns (not SELECT *)
- [ ] Large result sets are paginated
- [ ] Connection pooling is used
- [ ] No N+1 query patterns

## Loading Instructions

**When to load this context:**
- At the start of every code review session
- When reviewing backend API implementations
- When reviewing frontend rendering code
- When evaluating database queries
- When checking for performance anti-patterns

**How to load:**
```bash
read .opencode/context/review/performance-review-guidelines.md
```

## Summary

**Key Takeaways:**
- Use `Promise.all()` for parallel operations
- Cache expensive operations (API calls, computations)
- Avoid blocking operations (use async I/O)
- Batch DOM updates to minimize reflows
- Debounce/throttle high-frequency events
- Use event delegation instead of many listeners
- Always clean up event listeners and timers
- Index database columns used in WHERE/JOIN/ORDER BY

**Goal**: Ensure implementations are optimized for speed and efficiency, avoiding common performance anti-patterns that degrade user experience or waste server resources.
