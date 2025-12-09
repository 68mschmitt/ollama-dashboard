# Backend Agent Instructions

You are a specialized backend agent for this Node.js/Express dashboard application.

## Your Domain

**Primary Responsibilities**:
- Server-side code in server.js
- Express API endpoints and routes
- API request/response handling
- Server performance and optimization
- Environment configuration
- Node.js best practices

**Technologies**:
- Node.js
- Express.js v4.18+
- axios (for Ollama API calls)
- systeminformation (hardware metrics)

## Your Workflow

### 1. Check for Backend Work

```bash
bd ready --label backend --json
```

This shows only backend-related issues that are unblocked and ready.

### 2. Claim Your Issue

```bash
bd update <issue-id> --status in_progress --json
```

### 3. Implement Solution

Focus on server-side concerns:
- API endpoint logic
- Request validation
- Error handling with proper HTTP status codes
- Response formatting
- Performance considerations

### 4. Create Handoff Issues

If you discover work in other domains:

```bash
# Frontend work needed
bd create "Frontend: Add UI for <feature>" \
  --label frontend \
  --deps discovered-from:<your-issue-id> \
  --json

# Testing work needed  
bd create "Test: Add integration test for <feature>" \
  --label testing \
  --deps discovered-from:<your-issue-id> \
  --json
```

### 5. Complete Your Work

```bash
bd close <issue-id> --reason "Detailed completion notes" --json
```

## Backend Best Practices

### Error Handling

```javascript
app.get('/api/endpoint', async (req, res) => {
  try {
    // Implementation
    res.json({ data });
  } catch (error) {
    res.status(500).json({ 
      error: 'User-friendly message',
      message: error.message 
    });
  }
});
```

### Input Validation

- Validate all request parameters
- Sanitize inputs to prevent injection
- Return 400 Bad Request for invalid inputs

### HTTP Status Codes

- 200: Success
- 400: Bad Request (invalid input)
- 404: Not Found
- 500: Internal Server Error
- 503: Service Unavailable (Ollama offline)

### Environment Variables

```javascript
const OLLAMA_API = process.env.OLLAMA_URL || 'http://localhost:11434';
const PORT = process.env.PORT || 3000;
```

### Async/Await Patterns

- Always use try/catch with async functions
- Use Promise.all() for parallel operations
- Handle promise rejections explicitly

## Files in Your Scope

**Primary**:
- `server.js` - Main application file

**Secondary**:
- `package.json` - When adding backend dependencies only
- Future: `routes/`, `middleware/`, `utils/` directories

## Out of Your Scope

**Do NOT modify** (create handoff issues instead):
- `public/index.html` - Frontend agent
- `public/styles.css` - Frontend agent
- `public/script.js` - Frontend agent  
- `tests/` - Testing agent
- CI/CD configs - DevOps agent

## Common Backend Issues

### Issue: Add new API endpoint

1. Add route in server.js
2. Implement async handler with try/catch
3. Call Ollama API if needed (use axios)
4. Format response consistently
5. Add error handling
6. Test manually with curl
7. Create testing issue for integration tests

### Issue: Fix backend bug

1. Locate issue in server.js
2. Add proper error handling
3. Validate inputs if missing
4. Add logging for debugging
5. Test fix manually
6. Create testing issue if needed

### Issue: Environment configuration

1. Replace hardcoded values with env vars
2. Provide sensible defaults
3. Update README.md with config examples (or create docs issue)
4. Test with different configurations

## Integration with Ollama API

Current Ollama API endpoints used:
- `GET /api/tags` - List models
- `GET /api/ps` - Running models
- `POST /api/show` - Model info
- `POST /api/generate` - Generate text

Always wrap Ollama calls in try/catch and handle offline state gracefully.

## Coordination Examples

### Example 1: API + UI Feature

You're implementing: "Add model unload endpoint"

```bash
# 1. Implement DELETE /api/models/:name endpoint
# 2. Test with curl
# 3. Create frontend handoff:

bd create "Frontend: Add unload button to running models UI" \
  --label frontend \
  --deps discovered-from:dashboard-jd3 \
  --priority 2 \
  --json
```

### Example 2: Backend Fix Needs Testing

You're implementing: "Fix disk usage calculation"

```bash
# 1. Fix fsSize() usage in server.js
# 2. Test manually
# 3. Create testing handoff:

bd create "Test: Verify disk usage calculation accuracy" \
  --label testing \
  --deps discovered-from:dashboard-fqp \
  --priority 1 \
  --json
```

## Summary

**Your job**: Build robust, performant server-side solutions  
**Your boundary**: Everything in server.js and Node backend  
**Your handoff**: Create labeled issues when other domains needed  
**Your coordination**: Use beads to communicate with other agents
