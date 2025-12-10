# Node.js Patterns and Best Practices

**For**: Backend agent  
**Purpose**: Modern Node.js patterns for async/await, error handling, modules, and event-driven architecture

## Overview

Node.js provides an asynchronous, event-driven environment for building server-side applications. This guide covers essential patterns for writing robust Node.js code.

## Async/Await Patterns

### Basic Async/Await

```javascript
// Modern async/await (preferred)
async function fetchUserData(userId) {
  try {
    const user = await database.findUser(userId);
    const posts = await database.findPosts(user.id);
    return { user, posts };
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
}

// Old Promise syntax (avoid)
function fetchUserDataOld(userId) {
  return database.findUser(userId)
    .then(user => database.findPosts(user.id))
    .then(posts => ({ user, posts }))
    .catch(error => {
      console.error('Failed:', error);
      throw error;
    });
}
```

### Parallel Operations with Promise.all()

```javascript
// Sequential (slow - 3 seconds total)
async function fetchDataSequential() {
  const users = await fetchUsers();     // 1 second
  const posts = await fetchPosts();     // 1 second
  const comments = await fetchComments(); // 1 second
  return { users, posts, comments };
}

// Parallel (fast - 1 second total)
async function fetchDataParallel() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),     // All run simultaneously
    fetchPosts(),
    fetchComments()
  ]);
  return { users, posts, comments };
}
```

### Promise.allSettled() for Independent Operations

```javascript
// Use when you want all results, even if some fail
async function fetchMultipleSources() {
  const results = await Promise.allSettled([
    fetch('https://api1.example.com/data'),
    fetch('https://api2.example.com/data'),
    fetch('https://api3.example.com/data')
  ]);
  
  const successful = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
  
  const failed = results
    .filter(r => r.status === 'rejected')
    .map(r => r.reason);
  
  return { successful, failed };
}
```

### Async Iteration

```javascript
// Process array items asynchronously
async function processItems(items) {
  for (const item of items) {
    await processItem(item); // Sequential
  }
}

// Process in parallel with concurrency limit
async function processItemsParallel(items, concurrency = 5) {
  const chunks = [];
  for (let i = 0; i < items.length; i += concurrency) {
    chunks.push(items.slice(i, i + concurrency));
  }
  
  for (const chunk of chunks) {
    await Promise.all(chunk.map(item => processItem(item)));
  }
}
```

## Error Handling

### Try/Catch Best Practices

```javascript
// ✅ GOOD: Specific error handling
async function fetchData(id) {
  try {
    const data = await database.find(id);
    return data;
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return null; // Expected error
    }
    console.error('Database error:', error);
    throw error; // Unexpected error
  }
}

// ❌ BAD: Swallowing all errors
async function fetchDataBad(id) {
  try {
    return await database.find(id);
  } catch (error) {
    return null; // Hides all errors!
  }
}
```

### Error Wrapping

```javascript
class DatabaseError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

async function getUserData(userId) {
  try {
    return await database.findUser(userId);
  } catch (error) {
    throw new DatabaseError(
      `Failed to fetch user ${userId}`,
      error
    );
  }
}
```

### Unhandled Rejection Handling

```javascript
// Catch unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, you might want to:
  // 1. Log to error tracking service
  // 2. Gracefully shut down
  process.exit(1);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
```

## Module Patterns

### CommonJS (Node.js default)

```javascript
// math.js - Exporting
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

module.exports = { add, subtract };

// Or export individual items
exports.add = add;
exports.subtract = subtract;

// app.js - Importing
const math = require('./math');
console.log(math.add(2, 3));

// Or destructure
const { add, subtract } = require('./math');
```

### ES Modules (modern, requires "type": "module" in package.json)

```javascript
// math.mjs - Exporting
export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export default { add, subtract };

// app.mjs - Importing
import { add, subtract } from './math.mjs';
import math from './math.mjs';
```

### Module Organization

```javascript
// config/database.js
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'myapp'
};

module.exports = config;

// services/userService.js
const db = require('../config/database');

async function createUser(userData) {
  // ...
}

module.exports = { createUser };

// server.js
const userService = require('./services/userService');
```

## Event-Driven Patterns

### EventEmitter Basics

```javascript
const EventEmitter = require('events');

class DataProcessor extends EventEmitter {
  async process(data) {
    this.emit('start', data);
    
    try {
      const result = await this.doProcessing(data);
      this.emit('complete', result);
      return result;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async doProcessing(data) {
    // Processing logic
  }
}

// Usage
const processor = new DataProcessor();

processor.on('start', (data) => {
  console.log('Processing started:', data);
});

processor.on('complete', (result) => {
  console.log('Processing complete:', result);
});

processor.on('error', (error) => {
  console.error('Processing failed:', error);
});

await processor.process({ id: 1 });
```

### Once vs On

```javascript
const emitter = new EventEmitter();

// Listen to every event
emitter.on('data', (data) => {
  console.log('Data received:', data);
});

// Listen to first event only
emitter.once('ready', () => {
  console.log('Ready! (only once)');
});

emitter.emit('data', 'first');  // Logs: Data received: first
emitter.emit('data', 'second'); // Logs: Data received: second
emitter.emit('ready');          // Logs: Ready! (only once)
emitter.emit('ready');          // No log (already fired once)
```

## Stream Patterns

### Readable Streams

```javascript
const fs = require('fs');

// Create readable stream
const readStream = fs.createReadStream('large-file.txt', {
  encoding: 'utf8',
  highWaterMark: 64 * 1024 // 64KB chunks
});

readStream.on('data', (chunk) => {
  console.log('Received chunk:', chunk.length);
});

readStream.on('end', () => {
  console.log('File read complete');
});

readStream.on('error', (error) => {
  console.error('Read error:', error);
});
```

### Writable Streams

```javascript
const writeStream = fs.createWriteStream('output.txt');

writeStream.write('Hello\n');
writeStream.write('World\n');
writeStream.end('Goodbye\n');

writeStream.on('finish', () => {
  console.log('Write complete');
});
```

### Piping Streams

```javascript
const fs = require('fs');
const zlib = require('zlib');

// Compress file with pipe
fs.createReadStream('input.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('input.txt.gz'))
  .on('finish', () => console.log('Compression complete'));

// HTTP response streaming
app.get('/large-file', (req, res) => {
  const readStream = fs.createReadStream('large-file.pdf');
  readStream.pipe(res);
});
```

## Memory Management

### Avoiding Memory Leaks

```javascript
// ❌ BAD: Memory leak from event listeners
function setupProcessor() {
  const processor = new EventEmitter();
  
  setInterval(() => {
    processor.on('data', handleData); // Adds listener every second!
  }, 1000);
}

// ✅ GOOD: Clean up listeners
function setupProcessorCorrect() {
  const processor = new EventEmitter();
  
  function handleData(data) {
    console.log('Data:', data);
  }
  
  processor.on('data', handleData);
  
  // Clean up when done
  return () => {
    processor.removeListener('data', handleData);
  };
}
```

### Buffer Management

```javascript
// ✅ GOOD: Use streams for large files
function processLargeFile(filepath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filepath);
    let lineCount = 0;
    
    stream.on('data', (chunk) => {
      lineCount += chunk.toString().split('\n').length;
    });
    
    stream.on('end', () => resolve(lineCount));
    stream.on('error', reject);
  });
}

// ❌ BAD: Loading entire file into memory
async function processLargeFileBad(filepath) {
  const content = await fs.promises.readFile(filepath, 'utf8');
  return content.split('\n').length;
}
```

## File System Operations

### Async File Operations

```javascript
const fs = require('fs').promises;

// Read file
async function readConfig() {
  try {
    const data = await fs.readFile('config.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // File doesn't exist
    }
    throw error;
  }
}

// Write file
async function saveConfig(config) {
  const data = JSON.stringify(config, null, 2);
  await fs.writeFile('config.json', data, 'utf8');
}

// Check if file exists
async function fileExists(filepath) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

// Create directory if not exists
async function ensureDir(dirpath) {
  await fs.mkdir(dirpath, { recursive: true });
}
```

### Path Operations

```javascript
const path = require('path');

// Join paths (handles OS differences)
const configPath = path.join(__dirname, 'config', 'app.json');

// Get filename
const filename = path.basename('/path/to/file.txt'); // 'file.txt'

// Get directory
const dirname = path.dirname('/path/to/file.txt'); // '/path/to'

// Get extension
const ext = path.extname('file.txt'); // '.txt'

// Normalize path
const normalized = path.normalize('/path//to/../file.txt'); // '/path/file.txt'
```

## HTTP Client Patterns (using axios)

### Basic Requests

```javascript
const axios = require('axios');

// GET request
async function fetchData() {
  try {
    const response = await axios.get('https://api.example.com/data');
    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.error('Server error:', error.response.status);
    } else if (error.request) {
      // Request made but no response
      console.error('No response received');
    } else {
      // Error setting up request
      console.error('Request setup error:', error.message);
    }
    throw error;
  }
}

// POST request with data
async function createUser(userData) {
  const response = await axios.post(
    'https://api.example.com/users',
    userData,
    {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000 // 5 seconds
    }
  );
  return response.data;
}
```

### Request Configuration

```javascript
// Create configured instance
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'User-Agent': 'MyApp/1.0'
  }
});

// Add interceptor for auth
api.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getToken()}`;
  return config;
});

// Add response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      refreshToken();
    }
    return Promise.reject(error);
  }
);

// Usage
const data = await api.get('/users');
```

## Environment and Configuration

### Reading Environment Variables

```javascript
// Simple env vars
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Typed env vars
function getEnvInt(key, defaultValue) {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`${key} must be a number`);
  }
  return parsed;
}

const MAX_RETRIES = getEnvInt('MAX_RETRIES', 3);

// Boolean env vars
function getEnvBool(key, defaultValue) {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

const DEBUG = getEnvBool('DEBUG', false);
```

### Configuration Management

```javascript
// config.js
const config = {
  port: process.env.PORT || 3000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'myapp'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  },
  api: {
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
    retries: parseInt(process.env.API_RETRIES || '3')
  }
};

// Validate required vars
function validateConfig() {
  if (!process.env.DB_HOST) {
    throw new Error('DB_HOST is required');
  }
  // ... more validation
}

if (process.env.NODE_ENV === 'production') {
  validateConfig();
}

module.exports = config;
```

## Common Pitfalls

### Blocking the Event Loop

```javascript
// ❌ BAD: Blocking operation
function processData(data) {
  let result = 0;
  for (let i = 0; i < 1000000000; i++) {
    result += i; // Blocks for seconds
  }
  return result;
}

// ✅ GOOD: Break into chunks
async function processDataAsync(data) {
  let result = 0;
  const chunkSize = 1000000;
  
  for (let i = 0; i < 1000000000; i += chunkSize) {
    for (let j = 0; j < chunkSize && i + j < 1000000000; j++) {
      result += i + j;
    }
    await new Promise(resolve => setImmediate(resolve)); // Yield
  }
  
  return result;
}
```

### Not Handling Errors in Callbacks

```javascript
// ❌ BAD: Unhandled errors
setTimeout(() => {
  throw new Error('This will crash the app!');
}, 1000);

// ✅ GOOD: Handle errors
setTimeout(() => {
  try {
    // Do work that might throw
  } catch (error) {
    console.error('Error in timeout:', error);
  }
}, 1000);
```

### Callback Hell (use async/await instead)

```javascript
// ❌ BAD: Callback hell
function getData(callback) {
  fetchUser((err, user) => {
    if (err) return callback(err);
    fetchPosts(user.id, (err, posts) => {
      if (err) return callback(err);
      fetchComments(posts[0].id, (err, comments) => {
        if (err) return callback(err);
        callback(null, { user, posts, comments });
      });
    });
  });
}

// ✅ GOOD: Async/await
async function getData() {
  const user = await fetchUser();
  const posts = await fetchPosts(user.id);
  const comments = await fetchComments(posts[0].id);
  return { user, posts, comments };
}
```

## Loading Instructions

**When to load this context:**
- Working with async/await operations
- Implementing error handling strategies
- Managing Node.js modules
- Working with streams or files
- Using HTTP clients (axios)
- Configuring environment variables
- Debugging async issues or memory leaks

**How to load:**
```bash
read .opencode/context/backend/nodejs-patterns.md
```

**Also consider loading:**
- `express-best-practices.md` - For Express.js specific patterns
- `api-design-patterns.md` - For REST API design
- `environment-configuration.md` - For detailed config management

## Summary

**Key Takeaways:**
- Always use async/await with try/catch for error handling
- Use Promise.all() for parallel operations
- Handle unhandled rejections globally
- Avoid blocking the event loop
- Use streams for large files
- Clean up event listeners to prevent memory leaks
- Validate environment variables at startup

**Goal**: Write performant, non-blocking Node.js code with robust error handling and modern async patterns.
