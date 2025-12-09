# AI Agent Instructions for Ollama Metrics Dashboard

This document provides guidelines for AI agents working on this project.

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**
```bash
bd ready --json
```

**Create new issues:**
```bash
bd create "Issue title" -t bug|feature|task -p 0-4 --json
bd create "Issue title" -p 1 --deps discovered-from:bd-123 --json
bd create "Subtask" --parent <epic-id> --json  # Hierarchical subtask (gets ID like epic-id.1)
```

**Claim and update:**
```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**
```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`
6. **Commit together**: Always commit the `.beads/issues.jsonl` file together with the code changes so issue state stays in sync with code state

### Auto-Sync

bd automatically syncs with git:
- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### GitHub Copilot Integration

If using GitHub Copilot, also create `.github/copilot-instructions.md` for automatic instruction loading.
Run `bd onboard` to get the content, or see step 2 of the onboard instructions.

### MCP Server (Recommended)

If using Claude or MCP-compatible clients, install the beads MCP server:

```bash
pip install beads-mcp
```

Add to MCP config (e.g., `~/.config/claude/config.json`):
```json
{
  "beads": {
    "command": "beads-mcp",
    "args": []
  }
}
```

Then use `mcp__beads__*` functions instead of CLI commands.

### Managing AI-Generated Planning Documents

AI assistants often create planning and design documents during development:
- PLAN.md, IMPLEMENTATION.md, ARCHITECTURE.md
- DESIGN.md, CODEBASE_SUMMARY.md, INTEGRATION_PLAN.md
- TESTING_GUIDE.md, TECHNICAL_DESIGN.md, and similar files

**Best Practice: Use a dedicated directory for these ephemeral files**

**Recommended approach:**
- Create a `history/` directory in the project root
- Store ALL AI-generated planning/design docs in `history/`
- Keep the repository root clean and focused on permanent project files
- Only access `history/` when explicitly asked to review past planning

**Example .gitignore entry (optional):**
```
# AI planning documents (ephemeral)
history/
```

**Benefits:**
- ✅ Clean repository root
- ✅ Clear separation between ephemeral and permanent documentation
- ✅ Easy to exclude from version control if desired
- ✅ Preserves planning history for archeological research
- ✅ Reduces noise when browsing the project

### CLI Help

Run `bd <command> --help` to see all available flags for any command.
For example: `bd create --help` shows `--parent`, `--deps`, `--assignee`, etc.

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Store AI planning docs in `history/` directory
- ✅ Run `bd <cmd> --help` to discover available flags
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems
- ❌ Do NOT clutter repo root with planning documents

## Multi-Agent Coordination System

This project uses specialized agents to maintain focus and reduce context usage.

### Available Agents

| Agent | Domain | Instructions | Invoke |
|-------|--------|--------------|--------|
| Backend | Server, API, Node/Express | `.opencode/agent/backend.md` | `@backend` |
| Frontend | HTML, CSS, JS, UI/UX | `.opencode/agent/frontend.md` | `@frontend` |
| Testing | Tests, QA, infrastructure | `.opencode/agent/testing.md` | `@testing` |
| DevOps | Dependencies, build, deploy | `.opencode/agent/devops.md` | `@devops` |
| Reviewer | Code quality gate | `.opencode/agent/reviewer.md` | `@reviewer` |

### How to Invoke Specialized Agents

**Using @ mention** (native OpenCode subagents):

```
@backend please implement the SSE streaming endpoint for model generation
```

OpenCode will automatically load the backend agent's instructions from `.opencode/agent/backend.md` and invoke it with the configured tools and permissions.

**Using /workflow command** (automated orchestration):

```
/workflow dashboard-bpr
```

The workflow orchestrator will automatically route to appropriate agents based on issue labels using the Task tool with @mention syntax.

### Benefits of Specialized Agents

1. **Reduced Context**
   - Each agent only sees domain-relevant issues
   - Focused instruction sets (200-300 lines vs 1000+)
   - No mixing of unrelated concerns

2. **Domain Expertise**
   - Best practices specific to domain
   - Relevant examples and patterns
   - Appropriate tools and commands

3. **Clear Boundaries**
   - Explicit scope definitions
   - Handoff protocols via beads
   - No accidental cross-domain modifications

4. **Parallel Work**
   - Multiple agents work simultaneously
   - Git-backed coordination via beads
   - No coordination conflicts

### Label System

Issues are tagged with domain labels:

```bash
# View work by domain
bd ready --label backend --json
bd ready --label frontend --json
bd ready --label testing --json
bd ready --label devops --json

# Multiple labels possible
bd list --label backend,testing --json
```

### Handoff Protocol

When an agent discovers work in another domain:

```bash
# Backend agent discovers frontend work needed
bd create "Frontend: Add streaming UI component" \
  --label frontend \
  --deps discovered-from:backend-sse-id \
  --priority 2 \
  --description "Backend SSE endpoint ready at /api/stream. 
                 Need UI to consume EventSource and display tokens." \
  --json
```

The frontend agent will discover this via `bd ready --label frontend`.

### Example Multi-Agent Workflow

**Scenario**: Implement streaming generation (dashboard-x90)

1. **Architecture Planning** (General agent)
   - Break epic into domain tasks
   - Create: backend task, frontend task, testing task
   - Link with dependencies

2. **Backend Agent** (`.opencode/agent/backend.md`)
   ```bash
   bd ready --label backend
   # Implement SSE endpoint
   bd close backend-task --reason "SSE ready"
   ```

3. **Frontend Agent** (`.opencode/agent/frontend.md`)
   ```bash
   bd ready --label frontend
   # Build EventSource consumer UI
   bd close frontend-task --reason "Streaming UI complete"
   ```

4. **Testing Agent** (`.opencode/agent/testing.md`)
   ```bash
   bd ready --label testing
   # Write integration tests
   bd close testing-task --reason "Tests passing"
   ```

Each agent maintains minimal context. Beads coordinates everything through git.

### Context Comparison

**Before (Unified Agent)**:
- Single agent sees all 10 issues
- Must understand entire stack
- Context includes frontend, backend, testing, devops
- ~2000+ lines of instructions

**After (Specialized Agents)**:
- Backend agent sees 3-4 backend issues
- Focuses on server-side concerns only
- Context limited to backend domain
- ~300 lines of focused instructions
- **60-85% context reduction**

### Getting Started

See `.opencode/docs/agent-system.md` for complete agent system documentation.

## Automated Workflow System

This project includes an automated dev→test→review workflow system that coordinates specialized agents to complete issues from start to finish.

### Overview

The workflow system automates the complete software development lifecycle:

```
User: /workflow <issue-id>
  ↓
Orchestrator: Analyzes issue, splits if multi-domain
  ↓
Developer Agent: Implements solution
  ↓
Test Agent: Writes comprehensive tests
  ↓
Review Agent: Reviews code quality and best practices
  ↓
Approval OR Changes Requested (max 3 iterations)
  ↓
Complete: All issues closed ✓
```

### Available Agents

| Agent | Role | Instructions |
|-------|------|--------------|
| **Orchestrator** | Workflow coordination | `.opencode/command/workflow/workflow.md` |
| **Backend** | Server implementation | `.opencode/agent/backend.md` |
| **Frontend** | UI implementation | `.opencode/agent/frontend.md` |
| **Testing** | Test infrastructure | `.opencode/agent/testing.md` |
| **DevOps** | Build/deploy | `.opencode/agent/devops.md` |
| **Reviewer** | Code quality gate | `.opencode/agent/reviewer.md` |

### Using the /workflow Command

**Show smart suggestions** (what to do next):
```
/workflow
```

Shows:
- Active and paused workflows
- Ready issues grouped by domain
- Blocked issues needing attention
- Suggested next actions

**Start a specific workflow**:
```
/workflow dashboard-bpr
```

The orchestrator will:
1. Check for paused workflows
2. Analyze the issue (labels, status, dependencies)
3. Detect and split multi-domain issues
4. Present smart detection menu for confirmation
5. Route through dev→test→review phases
6. Handle iterations (max 3) if changes requested
7. Complete successfully or escalate to human

**Resume a paused workflow**:
```
/workflow dashboard-bpr
```
If the workflow was paused (due to error or max iterations), the orchestrator will detect it and offer to resume.

### Workflow Features

**Multi-Domain Support**:
- Automatically detects issues with multiple domain labels
- Splits into separate domain-specific issues
- Processes each domain sequentially (backend → frontend → devops)
- Links all split issues together

**Iteration Management**:
- Reviewer agent can approve or request changes
- Changes trigger new iteration (developer fixes → test updates → review again)
- Maximum 3 iterations before human escalation
- Prevents infinite loops

**Error Handling**:
- Any agent failure creates a blocker issue
- Workflow pauses automatically
- Human resolves blocker, then resumes workflow
- All context preserved in orchestrator tracking

**State Management**:
- Orchestrator tracking issue stores workflow state as JSON
- Tracks current phase, iteration count, handoff chain
- Enables pause/resume functionality
- Git-backed persistence (in .beads/issues.jsonl)

### MCP Tools Integration

All agents have access to MCP tools for enhanced capabilities:

**Beads**: Issue tracking and coordination (all agents)
**Context7**: Best practices documentation (backend, frontend, testing, reviewer)
**Puppeteer**: UI testing and verification (frontend, testing)
**Sequential Thinking**: Complex problem breakdown (backend, reviewer)
**GitHub/Azure**: PR management (devops)

See `.opencode/docs/mcp-tools-reference.md` for complete tool documentation.

### Handoff Templates

Agents create structured handoff issues when passing work:

- **Dev → Test**: Test handoff with implementation details
- **Test → Review**: Review handoff with test coverage
- **Review → Dev**: Fix handoff with specific feedback
- **Any → Human**: Blocker/escalation for human intervention

See `.opencode/docs/handoff-templates.md` for templates and examples.

### Workflow Examples

**Simple Backend Feature**:
```
/workflow dashboard-bpr

1. Orchestrator: Single domain (backend) detected
2. Backend Agent: Implements environment variable config
3. Test Agent: Writes tests for config loading
4. Reviewer: Approves (code quality good)
5. Complete: All issues closed ✓

Duration: ~5 minutes (automated)
Iterations: 1
```

**Multi-Domain Feature**:
```
/workflow dashboard-jd3

1. Orchestrator: Multi-domain (backend + frontend) detected
2. Split into:
   - dashboard-jd3-backend "Backend: Add model unload API"
   - dashboard-jd3-frontend "Frontend: Add unload button UI"
3. Process backend: dev → test → review → approve ✓
4. Process frontend: dev → test → review → approve ✓
5. Complete: Original issue closed ✓

Duration: ~10 minutes (automated)
Iterations: 1 per domain
```

**Feature with Review Iterations**:
```
/workflow dashboard-x90

1. Backend Agent: Implements streaming generation
2. Test Agent: Writes tests
3. Reviewer: Requests changes (error handling incomplete)
4. Backend Agent: Fixes error handling (iteration 2)
5. Test Agent: Updates tests
6. Reviewer: Approves ✓
7. Complete: All issues closed ✓

Duration: ~8 minutes (automated)
Iterations: 2
```

**Max Iterations Escalation**:
```
/workflow dashboard-abc

1-3. Three iterations with changes requested
4. Iteration 3: Reviewer still requests changes
5. Orchestrator: Max iterations reached
6. Creates escalation: "Escalation: dashboard-abc needs human review"
7. Blocks original issue
8. Pauses workflow
9. Human reviews, fixes manually, closes escalation
10. Can resume if needed or close as complete

Duration: ~15 minutes (automated) + human intervention
Iterations: 3 (max)
```

### Best Practices for Workflow

**Do's**:
- ✓ Use /workflow for any feature or bug fix
- ✓ Let orchestrator detect multi-domain issues
- ✓ Trust the review process (iteration limits prevent loops)
- ✓ Review escalation issues promptly
- ✓ Let agents document their work in issue comments

**Don'ts**:
- ✗ Don't manually create dev/test/review issues (orchestrator handles)
- ✗ Don't bypass the review phase
- ✗ Don't modify orchestrator tracking issues manually
- ✗ Don't start new workflow if one already in progress

### Troubleshooting

**Workflow stuck/paused?**
```bash
# Check for paused workflows
bd list --label orchestrator-context --status in_progress

# View workflow details
bd show <orch-tracking-id> --json

# Check for blockers
bd list --label blocked,needs-human
```

**Want to cancel a workflow?**
```bash
# Close orchestrator tracking issue
bd close <orch-tracking-id> --reason "Cancelled by user"

# Close any handoff issues
bd close <handoff-id> --reason "Workflow cancelled"
```

**Need to restart from scratch?**
```bash
# Close all workflow-related issues
# Start fresh with /workflow <issue-id>
```

### Documentation

- **Orchestrator Agent**: `.opencode/command/workflow/workflow.md`
- **Reviewer Agent**: `.opencode/agent/reviewer.md`
- **MCP Tools Reference**: `.opencode/docs/mcp-tools-reference.md`
- **Handoff Templates**: `.opencode/docs/handoff-templates.md`
- **Slash Command**: `.opencode/command/workflow/workflow.md`

## Project-Specific Guidelines

### Technology Stack

This is a Node.js/Express dashboard application for monitoring Ollama instances:
- **Backend**: Express.js, axios, systeminformation
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Target**: Local Ollama instances (http://localhost:11434)

### Development Workflow

1. **Starting the server**: `npm run dev` (development with auto-reload) or `npm start` (production)
2. **Testing changes**: Access http://localhost:3000 in browser
3. **API endpoints**: See README.md for complete API documentation

### Code Quality

- Keep frontend code simple (vanilla JS, no frameworks)
- Use clear variable names and comments
- Test API endpoints thoroughly
- Ensure responsive design works on mobile

### Common Tasks

- Adding new metrics: Update `/api/hardware` endpoint and frontend display
- Adding model operations: Create new endpoint in `server.js` and UI controls
- UI improvements: Modify `public/index.html`, `public/styles.css`, and `public/script.js`

For more details, see README.md and QUICKSTART.md.
