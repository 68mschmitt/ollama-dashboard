# Security Review Patterns

**For**: Reviewer agent  
**Purpose**: Security considerations for input validation, authentication, SQL injection, XSS, CSRF, and secrets management

## Overview

Security should be a primary concern in every code review. This guide covers common security vulnerabilities and how to detect and prevent them in Node.js/Express applications.

## Input Validation

### Principle: Never Trust User Input

All data from external sources must be validated:
- URL parameters
- Query strings
- Request body
- Headers
- File uploads

### Validation Requirements

**Backend (Express)**:
```javascript
// ✗ No validation
app.get('/api/models/:name', async (req, res) => {
  const { name } = req.params;
  // Direct use without validation - dangerous!
  const result = await fetchModel(name);
  res.json(result);
});

// ✓ Input validation
app.get('/api/models/:name', async (req, res) => {
  const { name } = req.params;
  
  // Validate format
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid model name' });
  }
  
  // Validate pattern (alphanumeric, dash, underscore, dot only)
  if (!/^[a-zA-Z0-9-_.]+$/.test(name)) {
    return res.status(400).json({ 
      error: 'Model name contains invalid characters' 
    });
  }
  
  // Validate length
  if (name.length > 100) {
    return res.status(400).json({ 
      error: 'Model name too long (max 100 characters)' 
    });
  }
  
  const result = await fetchModel(name);
  res.json(result);
});
```

**Using express-validator** (recommended):
```javascript
const { param, validationResult } = require('express-validator');

app.get('/api/models/:name',
  // Validation rules
  param('name')
    .isString()
    .matches(/^[a-zA-Z0-9-_.]+$/)
    .withMessage('Invalid characters in model name')
    .isLength({ max: 100 })
    .withMessage('Model name too long'),
  
  // Check for validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  
  // Handler
  async (req, res) => {
    const { name } = req.params;
    const result = await fetchModel(name);
    res.json(result);
  }
);
```

### Common Input Attack Vectors

**1. Path Traversal**:
```javascript
// ✗ Vulnerable to path traversal
app.get('/files/:filename', (req, res) => {
  const { filename } = req.params;
  // Attacker can use ../../../etc/passwd
  res.sendFile(`./uploads/${filename}`);
});

// ✓ Protected
const path = require('path');

app.get('/files/:filename', (req, res) => {
  const { filename } = req.params;
  
  // Validate no path traversal characters
  if (filename.includes('..') || filename.includes('/')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  // Use path.join to prevent traversal
  const safePath = path.join(__dirname, 'uploads', filename);
  
  // Verify the resolved path is still in uploads directory
  if (!safePath.startsWith(path.join(__dirname, 'uploads'))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  res.sendFile(safePath);
});
```

**2. Command Injection**:
```javascript
// ✗ Vulnerable to command injection
const { exec } = require('child_process');

app.post('/api/process', (req, res) => {
  const { filename } = req.body;
  // Attacker can inject: filename.txt; rm -rf /
  exec(`cat ${filename}`, (error, stdout) => {
    res.send(stdout);
  });
});

// ✓ Use safe alternatives
const { readFile } = require('fs/promises');
const path = require('path');

app.post('/api/process', async (req, res) => {
  const { filename } = req.body;
  
  // Validate filename
  if (!/^[a-zA-Z0-9-_.]+$/.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  
  try {
    const safePath = path.join(__dirname, 'files', filename);
    const content = await readFile(safePath, 'utf8');
    res.send(content);
  } catch (error) {
    res.status(404).json({ error: 'File not found' });
  }
});
```

**3. NoSQL Injection** (if using MongoDB):
```javascript
// ✗ Vulnerable to NoSQL injection
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Attacker can send: { username: { $gt: "" }, password: { $gt: "" } }
  const user = await User.findOne({ username, password });
  if (user) {
    res.json({ success: true });
  }
});

// ✓ Protected with proper validation
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Validate types
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Invalid credentials' });
  }
  
  // Use proper authentication (hashed passwords)
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ success: true });
});
```

## SQL Injection Prevention

**Principle**: Use parameterized queries, NEVER string concatenation.

### Vulnerable Code

```javascript
// ✗✗✗ CRITICAL VULNERABILITY - SQL Injection
app.get('/users', async (req, res) => {
  const { name } = req.query;
  // Attacker can inject: ' OR '1'='1' --
  const query = `SELECT * FROM users WHERE name = '${name}'`;
  const result = await db.query(query);
  res.json(result);
});
```

### Secure Code

```javascript
// ✓ Parameterized query
app.get('/users', async (req, res) => {
  const { name } = req.query;
  
  // Validate input
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid name parameter' });
  }
  
  // Use parameterized query (placeholder syntax varies by library)
  const query = 'SELECT * FROM users WHERE name = ?';
  const result = await db.query(query, [name]);
  res.json(result);
});
```

**Library-Specific Examples**:

```javascript
// PostgreSQL (pg library)
const result = await client.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// MySQL (mysql2 library)
const [rows] = await connection.execute(
  'SELECT * FROM users WHERE email = ?',
  [email]
);

// SQLite (better-sqlite3)
const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
const result = stmt.get(email);
```

## XSS (Cross-Site Scripting) Prevention

**Principle**: Never insert untrusted data directly into HTML.

### Backend Protection

```javascript
// ✗ Vulnerable to XSS
app.get('/profile', async (req, res) => {
  const { id } = req.query;
  const user = await getUser(id);
  // If user.name contains <script>alert('XSS')</script>, it will execute
  res.send(`<h1>Welcome, ${user.name}!</h1>`);
});

// ✓ Use templating engine with auto-escaping
const ejs = require('ejs');

app.get('/profile', async (req, res) => {
  const { id } = req.query;
  const user = await getUser(id);
  // EJS automatically escapes <%= %> tags
  const html = ejs.render('<h1>Welcome, <%= name %>!</h1>', { name: user.name });
  res.send(html);
});

// ✓ Better: Send JSON and let frontend handle rendering
app.get('/api/profile', async (req, res) => {
  const { id } = req.query;
  const user = await getUser(id);
  res.json(user); // Frontend will safely render this
});
```

### Frontend Protection

```javascript
// ✗ Vulnerable to XSS
function displayUserName(name) {
  document.getElementById('user').innerHTML = name; // Dangerous!
}

// ✓ Safe - textContent doesn't interpret HTML
function displayUserName(name) {
  document.getElementById('user').textContent = name;
}

// ✓ Safe - createElement doesn't interpret HTML
function displayUserName(name) {
  const element = document.createElement('span');
  element.textContent = name;
  document.getElementById('user').appendChild(element);
}
```

**When you MUST insert HTML**:
```javascript
// Use DOMPurify library to sanitize
import DOMPurify from 'dompurify';

function displayUserBio(bioHtml) {
  const clean = DOMPurify.sanitize(bioHtml);
  document.getElementById('bio').innerHTML = clean;
}
```

### Content Security Policy (CSP)

Add CSP headers to prevent XSS:
```javascript
const helmet = require('helmet');

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Avoid unsafe-inline if possible
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: []
  }
}));
```

## CSRF (Cross-Site Request Forgery) Prevention

**Principle**: Require CSRF tokens for state-changing operations.

### Backend Implementation

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());

// CSRF protection middleware
const csrfProtection = csrf({ cookie: true });

// GET endpoints provide token
app.get('/form', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// POST endpoints validate token
app.post('/api/models', csrfProtection, async (req, res) => {
  // Token validation happens automatically
  // If invalid, middleware returns 403
  
  const result = await createModel(req.body);
  res.json(result);
});
```

### Frontend Implementation

```javascript
// Fetch CSRF token on page load
let csrfToken = null;

async function initCsrfToken() {
  const response = await fetch('/form');
  const data = await response.json();
  csrfToken = data.csrfToken;
}

// Include token in all POST requests
async function createModel(modelData) {
  const response = await fetch('/api/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken // Include token
    },
    body: JSON.stringify(modelData)
  });
  
  return response.json();
}
```

### SameSite Cookie Attribute

Alternative/additional protection:
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    sameSite: 'strict', // Prevents CSRF
    httpOnly: true,     // Prevents XSS access to cookie
    secure: true        // HTTPS only (in production)
  }
}));
```

## Secrets Management

**Principle**: Never commit secrets. Use environment variables.

### ✗ Bad Examples

```javascript
// ✗✗✗ CRITICAL - Hardcoded secrets in code
const API_KEY = 'sk_live_1234567890abcdef';
const DB_PASSWORD = 'my_secret_password';
const JWT_SECRET = 'super_secret_key';

// ✗ Secrets in config files committed to git
// config.json
{
  "apiKey": "sk_live_1234567890abcdef",
  "dbPassword": "my_secret_password"
}
```

### ✓ Good Examples

```javascript
// ✓ Use environment variables
require('dotenv').config();

const API_KEY = process.env.API_KEY;
const DB_PASSWORD = process.env.DB_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

// Validate required secrets on startup
if (!API_KEY || !DB_PASSWORD || !JWT_SECRET) {
  console.error('Missing required environment variables');
  process.exit(1);
}
```

**`.env` file** (NOT committed to git):
```bash
API_KEY=sk_live_1234567890abcdef
DB_PASSWORD=my_secret_password
JWT_SECRET=super_secret_key
```

**`.env.example`** (committed to git):
```bash
API_KEY=your_api_key_here
DB_PASSWORD=your_db_password_here
JWT_SECRET=your_jwt_secret_here
```

**`.gitignore`**:
```
.env
.env.local
.env.*.local
```

### Secrets in Logs

```javascript
// ✗ Logging sensitive data
console.log('User login:', { username, password }); // Don't log passwords!
console.log('API request:', { url, headers }); // Don't log auth headers!

// ✓ Redact sensitive data
console.log('User login:', { username }); // Password omitted
console.log('API request:', { 
  url, 
  headers: { ...headers, authorization: '[REDACTED]' }
});
```

## Authentication/Authorization

### Authentication Best Practices

**Password Hashing**:
```javascript
const bcrypt = require('bcrypt');

// ✗ Storing plain text passwords
async function createUser(username, password) {
  await db.insert({ username, password }); // NEVER DO THIS
}

// ✓ Hash passwords before storing
async function createUser(username, password) {
  const SALT_ROUNDS = 10;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await db.insert({ username, passwordHash });
}

// ✓ Compare hashes, never compare plain text
async function verifyPassword(username, password) {
  const user = await db.findOne({ username });
  if (!user) return false;
  
  return await bcrypt.compare(password, user.passwordHash);
}
```

**JWT (JSON Web Tokens)**:
```javascript
const jwt = require('jsonwebtoken');

// ✗ Weak secret
const token = jwt.sign({ userId }, 'secret123');

// ✓ Strong secret from environment
const token = jwt.sign(
  { userId },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// ✓ Verify tokens on protected routes
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Protected data', user: req.user });
});
```

### Authorization Best Practices

```javascript
// ✓ Check user permissions before allowing actions
async function deleteModel(req, res) {
  const { modelId } = req.params;
  const { userId, role } = req.user; // From authenticateToken
  
  const model = await Model.findById(modelId);
  
  // Check ownership or admin role
  if (model.ownerId !== userId && role !== 'admin') {
    return res.status(403).json({ 
      error: 'Not authorized to delete this model' 
    });
  }
  
  await model.delete();
  res.json({ message: 'Model deleted' });
}
```

## Rate Limiting

**Prevent abuse and DoS attacks**:

```javascript
const rateLimit = require('express-rate-limit');

// Apply to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use(limiter);

// Stricter limit for sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later'
});

app.post('/api/login', authLimiter, async (req, res) => {
  // Login logic
});
```

## Dependency Vulnerabilities

**Regularly audit dependencies**:

```bash
# Check for known vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# View detailed report
npm audit --json
```

**Review output for**:
- Critical/High severity vulnerabilities
- Outdated dependencies with known exploits
- Vulnerable transitive dependencies

**Update dependencies**:
```bash
# Update to latest compatible versions
npm update

# Update to latest versions (including major)
npm install <package>@latest
```

## Common Security Pitfalls

### 1. Trusting Client-Side Validation

```javascript
// ✗ Only client-side validation
// HTML: <input type="email" required>
// Attacker can bypass this!

// ✓ Always validate on server
app.post('/api/users', (req, res) => {
  const { email } = req.body;
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }
  
  // Proceed...
});
```

### 2. Information Disclosure

```javascript
// ✗ Exposing error details to client
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    // Don't expose stack traces!
    res.status(500).json({ error: error.stack });
  }
});

// ✓ Generic error messages
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error); // Log internally
    res.status(500).json({ error: 'Internal server error' }); // Generic message
  }
});
```

### 3. Insufficient HTTPS

```javascript
// ✓ Redirect HTTP to HTTPS (in production)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// ✓ Set secure headers
const helmet = require('helmet');
app.use(helmet());
```

## Loading Instructions

**When to load this context:**
- At the start of every code review session
- When reviewing input handling code
- When reviewing authentication/authorization logic
- When evaluating API endpoints
- When checking for hardcoded secrets or credentials

**How to load:**
```bash
read .opencode/context/review/security-review-patterns.md
```

## Summary

**Key Takeaways:**
- Never trust user input - always validate
- Use parameterized queries to prevent SQL injection
- Escape output to prevent XSS
- Use CSRF tokens for state-changing operations
- Never commit secrets - use environment variables
- Hash passwords with bcrypt (never plain text)
- Apply rate limiting to prevent abuse
- Audit dependencies regularly for vulnerabilities

**Goal**: Ensure every implementation is secure by default, preventing common vulnerabilities and following security best practices for authentication, authorization, input validation, and secrets management.
