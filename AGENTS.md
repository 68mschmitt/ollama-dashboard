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

| Agent | Domain | Label | Instructions |
|-------|--------|-------|--------------|
| Backend | Server, API, Node/Express | `backend` | `.agents/backend_agent.md` |
| Frontend | HTML, CSS, JS, UI/UX | `frontend` | `.agents/frontend_agent.md` |
| Testing | Tests, QA, infrastructure | `testing` | `.agents/testing_agent.md` |
| DevOps | Dependencies, build, deploy | `devops` | `.agents/devops_agent.md` |

### How to Invoke Specialized Agents

**Pattern**: Tell OpenCode to load specific agent context

```
User: "Load the backend agent instructions from .agents/backend_agent.md 
       and check for backend work"

AI: *Reads backend_agent.md* 
    *Runs: bd ready --label backend --json*
    *Works within backend domain scope*
```

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

2. **Backend Agent** (`.agents/backend_agent.md`)
   ```bash
   bd ready --label backend
   # Implement SSE endpoint
   bd close backend-task --reason "SSE ready"
   ```

3. **Frontend Agent** (`.agents/frontend_agent.md`)
   ```bash
   bd ready --label frontend
   # Build EventSource consumer UI
   bd close frontend-task --reason "Streaming UI complete"
   ```

4. **Testing Agent** (`.agents/testing_agent.md`)
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

See `.agents/README.md` for complete agent system documentation.

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
