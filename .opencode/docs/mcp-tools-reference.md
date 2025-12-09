# MCP Tools Reference

This document provides a complete reference of all Model Context Protocol (MCP) tools available to AI agents in this project.

## Overview

MCP tools provide programmatic access to external services and capabilities. Instead of using CLI commands via bash, agents should use these tools directly for better reliability and structured data handling.

## Core Tools: Beads Issue Management

These tools are available to **ALL agents** for issue tracking and workflow coordination.

### mcp__beads__ready
List issues that are ready to work on (no blockers).

**Usage**:
```
Filter by domain: --label backend|frontend|testing|devops
Filter by status: --status pending|in_progress
Get JSON output: --json
```

**Example**:
```bash
# Backend agent checking for work
bd ready --label backend --json
```

### mcp__beads__create
Create new issues or handoff tasks.

**Required**:
- Title (string)

**Optional**:
- `--label` - Domain tags (backend, frontend, testing, devops, review, orchestrator-context)
- `--priority` - 0-4 (0=critical, 4=backlog)
- `--deps` - Dependencies (discovered-from:ID, parent:ID, relates-to:ID, blocks:ID)
- `--description` - Issue details
- `--notes` - JSON metadata (for orchestrator tracking)
- `--json` - Output JSON

**Examples**:
```bash
# Create test handoff
bd create "Test: dashboard-bpr - Verify environment config" \
  --label testing \
  --deps discovered-from:dashboard-bpr \
  --priority 2 \
  --json

# Create orchestrator tracking issue
bd create "Orchestrator: Workflow for dashboard-bpr" \
  --label orchestrator-context \
  --priority 2 \
  --deps parent:dashboard-bpr \
  --notes '{"workflow_id": "dashboard-bpr", "current_phase": "dev"}' \
  --json
```

### mcp__beads__update
Update existing issue fields.

**Parameters**:
- Issue ID (required)
- `--status` - pending|in_progress|blocked|completed
- `--priority` - 0-4
- `--notes` - JSON metadata
- `--json` - Output JSON

**Examples**:
```bash
# Claim issue
bd update dashboard-bpr --status in_progress --json

# Update orchestrator tracking
bd update dashboard-bpr-orch \
  --notes '{"current_phase": "testing", "iteration": 1}' \
  --json
```

### mcp__beads__close
Complete and close an issue.

**Parameters**:
- Issue ID (required)
- `--reason` - Completion message (recommended)
- `--json` - Output JSON

**Example**:
```bash
bd close dashboard-bpr --reason "Environment config implemented and tested" --json
```

### mcp__beads__comment
Add comments to issues (for agent documentation).

**Parameters**:
- Issue ID (required)
- Comment text (required)
- `--json` - Output JSON

**Example**:
```bash
bd comment dashboard-bpr "Implementation complete. Modified server.js lines 12-15." --json
```

### mcp__beads__show
Get detailed information about a specific issue.

**Parameters**:
- Issue ID (required)
- `--json` - Output JSON

**Example**:
```bash
bd show dashboard-bpr --json
```

### mcp__beads__list
List issues with filters.

**Parameters**:
- `--label` - Filter by labels
- `--status` - Filter by status
- `--priority` - Filter by priority
- `--json` - Output JSON

**Example**:
```bash
# List all orchestrator tracking issues
bd list --label orchestrator-context --status in_progress --json
```

---

## Domain-Specific Tools

### Backend Agent Tools

#### Context7: Documentation Lookup

Use Context7 to fetch best practices and API references for backend technologies.

**context7_resolve-library-id**
Find the Context7 library ID for a package/framework.

**Parameters**:
- `libraryName` (string) - Name to search for

**Example**:
```javascript
// Find Express.js documentation
context7_resolve-library-id({ libraryName: "express" })
// Returns: /expressjs/express
```

**context7_get-library-docs**
Fetch documentation for a specific library.

**Parameters**:
- `context7CompatibleLibraryID` (string) - Library ID from resolve-library-id
- `topic` (string, optional) - Specific topic to focus on
- `mode` (string, optional) - 'code' (default) or 'info'
- `page` (number, optional) - Page number for pagination

**Example**:
```javascript
// Get Express.js error handling best practices
context7_get-library-docs({
  context7CompatibleLibraryID: "/expressjs/express",
  topic: "error handling",
  mode: "code"
})

// Get Node.js async/await patterns
context7_get-library-docs({
  context7CompatibleLibraryID: "/websites/nodejs_api",
  topic: "async await",
  mode: "code"
})
```

**Recommended Libraries for Backend**:
- `/expressjs/express` - Express.js framework (100 snippets)
- `/websites/expressjs_en` - Express.js docs (1433 snippets)
- `/websites/nodejs_api` - Node.js API docs (5046 snippets)
- `/nodejs/node` - Node.js repository (8263 snippets)
- `/expressjs/cors` - CORS middleware
- `/express-rate-limit/express-rate-limit` - Rate limiting

#### Sequential Thinking

Use for complex problem-solving and implementation planning.

**sequential-thinking_sequentialthinking**

**Parameters**:
- `thought` (string) - Current thinking step
- `thoughtNumber` (number) - Current thought number
- `totalThoughts` (number) - Estimated total thoughts needed
- `nextThoughtNeeded` (boolean) - Whether more thinking is needed
- `isRevision` (boolean, optional) - Is this revising previous thinking
- `revisesThought` (number, optional) - Which thought is being reconsidered

**Usage**: Break down complex backend implementations into steps.

---

### Frontend Agent Tools

#### Puppeteer: UI Testing and Verification

Use Puppeteer to test UI interactions and visual appearance.

**puppeteer_puppeteer_navigate**
Navigate to a URL for testing.

**Parameters**:
- `url` (string) - URL to navigate to
- `launchOptions` (object, optional) - Browser launch options
- `allowDangerous` (boolean, optional) - Allow unsafe options (default: false)

**Example**:
```javascript
puppeteer_puppeteer_navigate({ url: "http://localhost:3000" })
```

**puppeteer_puppeteer_screenshot**
Take a screenshot for visual verification.

**Parameters**:
- `name` (string) - Screenshot filename
- `selector` (string, optional) - CSS selector to screenshot specific element
- `width` (number, optional) - Width in pixels (default: 800)
- `height` (number, optional) - Height in pixels (default: 600)
- `encoded` (boolean, optional) - Return as base64 (default: false)

**Example**:
```javascript
// Screenshot entire page
puppeteer_puppeteer_screenshot({ name: "dashboard-home" })

// Screenshot specific element
puppeteer_puppeteer_screenshot({ 
  name: "metrics-panel",
  selector: "#metrics-container"
})
```

**puppeteer_puppeteer_click**
Click an element.

**Parameters**:
- `selector` (string) - CSS selector of element to click

**Example**:
```javascript
puppeteer_puppeteer_click({ selector: "#refresh-button" })
```

**puppeteer_puppeteer_fill**
Fill an input field.

**Parameters**:
- `selector` (string) - CSS selector of input
- `value` (string) - Value to fill

**Example**:
```javascript
puppeteer_puppeteer_fill({ 
  selector: "#model-name-input",
  value: "llama3.2"
})
```

**puppeteer_puppeteer_hover**
Hover over an element.

**Parameters**:
- `selector` (string) - CSS selector of element

**Example**:
```javascript
puppeteer_puppeteer_hover({ selector: ".info-tooltip" })
```

**puppeteer_puppeteer_evaluate**
Execute JavaScript in the browser console.

**Parameters**:
- `script` (string) - JavaScript code to execute

**Example**:
```javascript
// Check if API data is loaded
puppeteer_puppeteer_evaluate({ 
  script: "return document.querySelector('#models-list').children.length > 0"
})
```

#### Context7: Frontend Best Practices

**Recommended Libraries for Frontend**:
- HTML/CSS/JavaScript vanilla patterns
- Responsive design techniques
- Browser compatibility

---

### Testing Agent Tools

Testing agents have access to **both Puppeteer** (for E2E tests) and **Context7** (for testing framework docs).

#### Context7: Testing Framework Documentation

**Recommended Libraries for Testing**:
- Jest testing framework
- Supertest (API testing)
- Testing best practices

**Example**:
```javascript
// Get Jest best practices
context7_get-library-docs({
  context7CompatibleLibraryID: "/facebook/jest",
  topic: "async testing",
  mode: "code"
})
```

#### Puppeteer: E2E Test Implementation

Use all Puppeteer tools to write automated end-to-end tests.

---

### DevOps Agent Tools

#### GitHub (if using GitHub)

**github_create_pull_request**
Create a pull request.

**Parameters**:
- `owner` (string) - Repository owner
- `repo` (string) - Repository name
- `title` (string) - PR title
- `head` (string) - Source branch
- `base` (string) - Target branch
- `body` (string, optional) - PR description
- `draft` (boolean, optional) - Create as draft

**github_list_pull_requests**
List pull requests.

**Parameters**:
- `owner` (string) - Repository owner
- `repo` (string) - Repository name
- `state` (string, optional) - 'open', 'closed', 'all'

#### Azure DevOps (if using Azure)

**azure-devops_repo_create_pull_request**
Create a pull request in Azure DevOps.

**Parameters**:
- `repositoryId` (string) - Repository ID
- `sourceRefName` (string) - Source branch (e.g., 'refs/heads/feature')
- `targetRefName` (string) - Target branch (e.g., 'refs/heads/main')
- `title` (string) - PR title
- `description` (string, optional) - PR description

**azure-devops_pipelines_get_builds**
Get build information.

**Parameters**:
- `project` (string) - Project name/ID
- `definitions` (array, optional) - Build definition IDs
- `top` (number, optional) - Max results

---

### Reviewer Agent Tools

The reviewer agent uses **Context7** extensively to verify code quality against best practices.

#### Context7: Best Practices Verification

**Workflow**:
1. Identify technologies used in changes (Express, Node, etc.)
2. Resolve library IDs for each technology
3. Fetch best practices for relevant topics
4. Compare implementation against documentation
5. Provide specific feedback with references

**Example Review Process**:
```javascript
// 1. Identify: Express API endpoint added
// 2. Resolve: /expressjs/express
// 3. Fetch best practices for:
//    - Error handling
//    - Input validation
//    - HTTP status codes
// 4. Compare implementation
// 5. Generate feedback

context7_get-library-docs({
  context7CompatibleLibraryID: "/expressjs/express",
  topic: "error handling middleware",
  mode: "code"
})

context7_get-library-docs({
  context7CompatibleLibraryID: "/expressjs/express",
  topic: "input validation",
  mode: "code"
})
```

**Recommended Libraries for Reviewer**:
- `/expressjs/express` - Express.js patterns
- `/websites/nodejs_api` - Node.js API usage
- `/express-validator/express-validator` - Input validation (2490 snippets)
- Security best practices
- Performance optimization patterns

#### Sequential Thinking: Complex Review Analysis

Use sequential thinking for thorough code reviews:
- Break down review into components
- Analyze each file/function independently
- Cross-reference with best practices
- Synthesize feedback

---

## Tool Usage Guidelines

### When to Use CLI vs MCP Tools

**Use bd CLI commands (via bash) for**:
- Quick one-off commands
- Interactive exploration
- Manual testing

**Use MCP tools (direct invocation) for**:
- Automated workflows
- Programmatic issue management
- Structured data processing
- Integration with other MCP tools

### Best Practices

1. **Always use --json flag** with bd commands for programmatic use
2. **Chain related operations** in single response when possible
3. **Handle errors gracefully** - check MCP tool responses
4. **Document with comments** - use bd comment to document agent work
5. **Link issues properly** - use discovered-from, parent, blocks dependencies

### Error Handling

All MCP tools return structured responses. Check for errors:

```javascript
// Example pseudo-code
const result = bd.create(...);
if (result.error) {
  // Handle error
  // Create blocker issue
  // Update orchestrator
} else {
  // Continue workflow
}
```

---

## Agent-Specific Tool Mapping

| Agent | Primary Tools | Secondary Tools |
|-------|---------------|-----------------|
| **Backend** | beads, context7, sequential-thinking | - |
| **Frontend** | beads, puppeteer, context7 | - |
| **Testing** | beads, puppeteer, context7 | - |
| **DevOps** | beads, github/azure-devops | context7 |
| **Orchestrator** | beads (all operations) | - |
| **Reviewer** | beads, context7, sequential-thinking | - |

---

## Quick Reference

### Common Workflows

**Start work on issue**:
```bash
bd show <issue-id> --json
bd update <issue-id> --status in_progress --json
```

**Create handoff**:
```bash
bd create "Phase: <issue-id> - Title" \
  --label <target-domain> \
  --deps discovered-from:<current-issue> \
  --json
```

**Document work**:
```bash
bd comment <issue-id> "Structured documentation..." --json
```

**Complete work**:
```bash
bd close <issue-id> --reason "Completion notes" --json
```

**Fetch best practices**:
```javascript
// 1. Resolve library
context7_resolve-library-id({ libraryName: "express" })

// 2. Get documentation
context7_get-library-docs({
  context7CompatibleLibraryID: "/expressjs/express",
  topic: "your topic",
  mode: "code"
})
```

---

## Additional Resources

- **Beads Documentation**: See AGENTS.md for bd CLI reference
- **Context7**: Use resolve-library-id first, then get-library-docs
- **Puppeteer**: Use for UI testing and visual verification
- **Sequential Thinking**: Break down complex problems

---

**Last Updated**: December 9, 2025
