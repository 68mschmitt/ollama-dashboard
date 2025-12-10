# Code Review Checklist

**For**: Reviewer agent  
**Purpose**: Comprehensive checklist for evaluating code quality, readability, naming, complexity, and documentation

## Overview

This checklist provides a systematic approach to reviewing code across all technology stacks. Use this as your primary reference when evaluating implementation quality during code reviews.

## General Code Quality Criteria

### 1. Naming Conventions

**Variables**:
- Use descriptive, meaningful names (not `x`, `temp`, `data`)
- Follow camelCase for JavaScript (e.g., `modelList`, `userName`)
- Boolean variables should be prefixed: `is`, `has`, `should`, `can` (e.g., `isLoading`, `hasError`)
- Constants should be UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`, `DEFAULT_TIMEOUT`)

**Good Examples**:
```javascript
// ✓ Clear, descriptive
const runningModelsList = await getRunningModels();
const isServerOnline = checkServerStatus();
const MAX_RETRY_ATTEMPTS = 3;

// ✗ Vague, unclear
const list = await getModels();
const flag = checkStatus();
const max = 3;
```

**Functions**:
- Use verb phrases (e.g., `fetchUserData`, `calculateTotal`, `validateInput`)
- Be specific about what the function does
- Avoid generic names like `process`, `handle`, `manage`

**Good Examples**:
```javascript
// ✓ Specific action verbs
async function fetchModelList() { ... }
async function validateModelName(name) { ... }
async function formatMemoryUsage(bytes) { ... }

// ✗ Generic verbs
async function handleModels() { ... }
async function processInput(data) { ... }
async function doStuff() { ... }
```

**Classes/Constructors**:
- Use PascalCase (e.g., `UserService`, `ModelManager`)
- Nouns that represent the abstraction

### 2. Code Readability

**Function Length**:
- Aim for functions < 50 lines
- Single responsibility principle
- Extract complex logic into helper functions

**Example - Needs Refactoring**:
```javascript
// ✗ Too long, multiple responsibilities
app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    const models = response.data.models || [];
    
    // Get running models
    const runningResponse = await axios.get(`${OLLAMA_BASE_URL}/api/ps`);
    const running = runningResponse.data.models || [];
    
    // Get detailed info for each model
    const detailed = [];
    for (const model of models) {
      const infoResponse = await axios.post(`${OLLAMA_BASE_URL}/api/show`, {
        name: model.name
      });
      detailed.push({
        ...model,
        details: infoResponse.data,
        isRunning: running.some(r => r.name === model.name)
      });
    }
    
    // Format response
    const formatted = detailed.map(m => ({
      name: m.name,
      size: formatBytes(m.size),
      modified: formatDate(m.modified_at),
      family: m.details.modelinfo?.family || 'unknown',
      running: m.isRunning
    }));
    
    res.json({ models: formatted });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(503).json({ error: 'Ollama service unavailable' });
  }
});
```

**Example - Refactored**:
```javascript
// ✓ Split into focused functions
app.get('/api/models', async (req, res) => {
  try {
    const models = await fetchAllModels();
    const formatted = formatModelsResponse(models);
    res.json({ models: formatted });
  } catch (error) {
    handleModelsError(error, res);
  }
});

async function fetchAllModels() {
  const [allModels, runningModels] = await Promise.all([
    fetchModelList(),
    fetchRunningModels()
  ]);
  
  return await enrichModelsWithDetails(allModels, runningModels);
}

async function enrichModelsWithDetails(models, runningModels) {
  return await Promise.all(
    models.map(model => enrichModelWithDetails(model, runningModels))
  );
}

function formatModelsResponse(models) {
  return models.map(formatModelForResponse);
}

function handleModelsError(error, res) {
  console.error('Error fetching models:', error);
  res.status(503).json({ error: 'Ollama service unavailable' });
}
```

**Nesting Depth**:
- Avoid nesting > 3 levels deep
- Use early returns to reduce nesting
- Extract nested logic into functions

**Example - Deep Nesting**:
```javascript
// ✗ Too deeply nested
function processData(data) {
  if (data) {
    if (data.models) {
      if (data.models.length > 0) {
        for (const model of data.models) {
          if (model.name) {
            if (model.size > 0) {
              // Finally do something
            }
          }
        }
      }
    }
  }
}
```

**Example - Flattened**:
```javascript
// ✓ Early returns, reduced nesting
function processData(data) {
  if (!data?.models?.length) return [];
  
  return data.models
    .filter(model => model.name && model.size > 0)
    .map(processModel);
}

function processModel(model) {
  // Process individual model
}
```

### 3. Code Comments

**When to Comment**:
- Complex algorithms or business logic
- Non-obvious decisions or workarounds
- API usage that isn't self-explanatory
- TODO/FIXME with context

**Good Comments**:
```javascript
// ✓ Explains WHY, not WHAT
// Cache model list to avoid repeated API calls during rapid requests.
// Ollama API can be slow with many models installed (500ms+ per call).
const cachedModels = new Map();

// ✓ Explains non-obvious behavior
// Ollama returns size in bytes, but sometimes includes negative values
// for models that are still downloading. Filter these out.
const validModels = models.filter(m => m.size > 0);

// ✓ Documents workaround
// FIXME: Ollama API doesn't expose model family directly.
// We infer it from the model name prefix until API is updated.
// See: https://github.com/ollama/ollama/issues/1234
const family = inferModelFamily(model.name);
```

**Bad Comments**:
```javascript
// ✗ States the obvious
// Get the model list
const models = await getModels();

// ✗ Redundant with code
// Loop through models
for (const model of models) {
  // Process model
  processModel(model);
}

// ✗ Outdated/misleading
// Returns user data (actually returns model data now)
async function fetchData() { ... }
```

**When NOT to Comment**:
- Self-explanatory code
- Code that can be made clearer with better naming
- Every line (over-commenting)

### 4. Code Duplication

**Detection**:
- Similar code blocks repeated in multiple places
- Copy-pasted functions with minor variations
- Repeated patterns that could be abstracted

**Example - Duplication**:
```javascript
// ✗ Duplicated error handling
app.get('/api/models', async (req, res) => {
  try {
    const data = await fetchModels();
    res.json(data);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

app.get('/api/running', async (req, res) => {
  try {
    const data = await fetchRunning();
    res.json(data);
  } catch (error) {
    console.error('Error fetching running:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});

app.get('/api/hardware', async (req, res) => {
  try {
    const data = await fetchHardware();
    res.json(data);
  } catch (error) {
    console.error('Error fetching hardware:', error);
    res.status(503).json({ error: 'Service unavailable' });
  }
});
```

**Example - Refactored**:
```javascript
// ✓ Extracted common error handling
function asyncHandler(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error(`Error in ${req.path}:`, error);
      res.status(503).json({ error: 'Service unavailable' });
    }
  };
}

app.get('/api/models', asyncHandler(async (req, res) => {
  const data = await fetchModels();
  res.json(data);
}));

app.get('/api/running', asyncHandler(async (req, res) => {
  const data = await fetchRunning();
  res.json(data);
}));

app.get('/api/hardware', asyncHandler(async (req, res) => {
  const data = await fetchHardware();
  res.json(data);
}));
```

### 5. Function Complexity

**Cyclomatic Complexity**:
- Aim for complexity < 10
- Each if/else, loop, case adds complexity
- Refactor complex functions

**Example - High Complexity**:
```javascript
// ✗ Cyclomatic complexity = 8
function getModelStatus(model) {
  if (!model) return 'unknown';
  if (model.running) {
    if (model.memory > MEMORY_THRESHOLD) {
      return 'running-high-memory';
    } else {
      return 'running-normal';
    }
  } else {
    if (model.size > SIZE_THRESHOLD) {
      return 'stopped-large';
    } else if (model.lastUsed > ONE_WEEK_AGO) {
      return 'stopped-recent';
    } else {
      return 'stopped-old';
    }
  }
}
```

**Example - Reduced Complexity**:
```javascript
// ✓ Cyclomatic complexity = 2-3 per function
function getModelStatus(model) {
  if (!model) return 'unknown';
  
  return model.running
    ? getRunningStatus(model)
    : getStoppedStatus(model);
}

function getRunningStatus(model) {
  return model.memory > MEMORY_THRESHOLD
    ? 'running-high-memory'
    : 'running-normal';
}

function getStoppedStatus(model) {
  if (model.size > SIZE_THRESHOLD) return 'stopped-large';
  if (model.lastUsed > ONE_WEEK_AGO) return 'stopped-recent';
  return 'stopped-old';
}
```

### 6. Error Handling

**Requirements**:
- All async operations wrapped in try/catch
- Errors logged with context
- Appropriate HTTP status codes returned
- User-friendly error messages (no stack traces to client)

**Good Error Handling**:
```javascript
// ✓ Comprehensive error handling
async function unloadModel(modelName) {
  // Input validation
  if (!modelName || typeof modelName !== 'string') {
    throw new Error('Invalid model name');
  }
  
  try {
    // API call with timeout
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/unload`,
      { name: modelName },
      { timeout: 5000 }
    );
    
    return response.data;
  } catch (error) {
    // Log with context
    console.error('Failed to unload model:', {
      modelName,
      error: error.message,
      code: error.code
    });
    
    // Re-throw with user-friendly message
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Ollama service is not running');
    }
    if (error.response?.status === 404) {
      throw new Error(`Model '${modelName}' not found`);
    }
    throw new Error('Failed to unload model');
  }
}
```

### 7. Magic Numbers and Hardcoded Values

**Move to Constants**:
```javascript
// ✗ Magic numbers scattered throughout
if (memory > 1073741824) { ... }
setTimeout(pollStatus, 5000);
if (retries < 3) { ... }

// ✓ Named constants
const MEMORY_WARNING_THRESHOLD = 1024 * 1024 * 1024; // 1 GB
const POLLING_INTERVAL_MS = 5000;
const MAX_RETRY_ATTEMPTS = 3;

if (memory > MEMORY_WARNING_THRESHOLD) { ... }
setTimeout(pollStatus, POLLING_INTERVAL_MS);
if (retries < MAX_RETRY_ATTEMPTS) { ... }
```

**Use Environment Variables**:
```javascript
// ✗ Hardcoded
const OLLAMA_URL = 'http://localhost:11434';

// ✓ Configurable
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
```

## Technology-Specific Checklists

### Node.js/Express Backend

**Must Have**:
- [ ] Async/await with try/catch (no unhandled promises)
- [ ] Proper HTTP status codes (200, 201, 400, 404, 500, 503)
- [ ] Input validation for all user inputs
- [ ] Environment variables for configuration
- [ ] Logging for errors and important events
- [ ] Resource cleanup (close connections, clear timers)

**Example Endpoint Review**:
```javascript
// Check for:
// 1. Try/catch present ✓
// 2. Input validation ✓
// 3. Proper status codes ✓
// 4. Error logging ✓
// 5. Response format consistent ✓

app.delete('/api/models/:name', async (req, res) => {
  try {
    // Input validation ✓
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ error: 'Model name required' });
    }
    
    // API call with error handling ✓
    await axios.post(`${OLLAMA_BASE_URL}/api/unload`, { name });
    
    // Success response ✓
    res.json({ message: `Model '${name}' unloaded successfully` });
  } catch (error) {
    // Error logging ✓
    console.error('Failed to unload model:', error);
    
    // Appropriate status code ✓
    res.status(503).json({ error: 'Failed to unload model' });
  }
});
```

### Frontend (Vanilla JS)

**Must Have**:
- [ ] Event listeners removed when no longer needed
- [ ] Error states displayed to user
- [ ] Loading states shown during async operations
- [ ] DOM queries cached when used multiple times
- [ ] No inline event handlers (use addEventListener)
- [ ] Accessible (ARIA labels, semantic HTML)

**Example Frontend Review**:
```javascript
// Check for:
// 1. Event listener cleanup ✓
// 2. Loading state ✓
// 3. Error handling ✓
// 4. Cached DOM queries ✓

class ModelManager {
  constructor() {
    this.container = document.getElementById('models'); // Cached ✓
    this.loadButton = document.getElementById('load-models');
    this.boundHandleLoad = this.handleLoad.bind(this);
  }
  
  init() {
    this.loadButton.addEventListener('click', this.boundHandleLoad);
  }
  
  destroy() {
    // Cleanup ✓
    this.loadButton.removeEventListener('click', this.boundHandleLoad);
  }
  
  async handleLoad() {
    // Loading state ✓
    this.loadButton.disabled = true;
    this.loadButton.textContent = 'Loading...';
    
    try {
      const response = await fetch('/api/models');
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      this.renderModels(data.models);
    } catch (error) {
      // Error handling ✓
      this.showError(error.message);
    } finally {
      // Reset state ✓
      this.loadButton.disabled = false;
      this.loadButton.textContent = 'Load Models';
    }
  }
}
```

## Common Pitfalls

### 1. Ignoring Edge Cases

**Missing Checks**:
- Empty arrays/objects
- Null/undefined values
- Zero values
- Very large numbers
- Special characters in strings

**Example**:
```javascript
// ✗ Assumes data.models exists and has items
const first = data.models[0];

// ✓ Defensive programming
const first = data?.models?.[0];
if (!first) {
  console.warn('No models found');
  return;
}
```

### 2. Poor Error Messages

**Bad**:
```javascript
throw new Error('Error'); // ✗ Useless
res.status(500).json({ error: 'Something went wrong' }); // ✗ Vague
```

**Good**:
```javascript
throw new Error('Failed to connect to Ollama API at http://localhost:11434'); // ✓
res.status(503).json({ 
  error: 'Ollama service unavailable',
  details: 'Please ensure Ollama is running'
}); // ✓
```

### 3. Inconsistent Code Style

**Check for**:
- Mixed indentation (spaces vs tabs)
- Inconsistent quote styles (' vs ")
- Inconsistent bracket placement
- Mixed naming conventions

**Use project standards** (check existing code or linter config).

### 4. Overly Complex Conditionals

**Simplify**:
```javascript
// ✗ Complex condition
if (user && user.role === 'admin' && user.permissions && user.permissions.includes('write')) {
  // ...
}

// ✓ Extract to function
if (hasWritePermission(user)) {
  // ...
}

function hasWritePermission(user) {
  return user?.role === 'admin' && 
         user?.permissions?.includes('write');
}
```

## Review Scoring Guide

### Pass Criteria

Award "Pass" if:
- All variable/function names are clear and descriptive
- No functions exceed 50 lines (or have good reason)
- Comments explain WHY, not WHAT
- No obvious code duplication (DRY principle followed)
- Complexity is manageable (no functions with > 10 branches)
- Error handling is comprehensive
- No magic numbers or hardcoded values

### Needs Work Criteria

Request changes if:
- Variable names are vague (e.g., `data`, `temp`, `x`)
- Functions are too long (> 50 lines) without clear reason
- Comments are missing for complex logic
- Code is duplicated in multiple places
- Functions are overly complex (> 10 cyclomatic complexity)
- Error handling is missing or incomplete
- Magic numbers are used instead of named constants

## Loading Instructions

**When to load this context:**
- At the start of every code review session
- When evaluating code quality
- When providing feedback on naming conventions
- When assessing function complexity
- When checking for code duplication

**How to load:**
```bash
read .opencode/context/review/code-review-checklist.md
```

## Summary

**Key Takeaways:**
- Clear naming is more important than brevity
- Functions should be < 50 lines with single responsibility
- Comments should explain WHY, not WHAT
- Avoid code duplication (DRY principle)
- Keep complexity low (< 10 branches per function)
- All async code needs error handling
- Extract magic numbers to named constants

**Goal**: Ensure all reviewed code is readable, maintainable, and follows established conventions, making it easy for any developer to understand and modify.
