# GitHub Copilot Instructions for Ollama Metrics Dashboard

## Project Overview

This is a real-time monitoring dashboard for local Ollama instances with comprehensive hardware metrics, model management, and test generation capabilities.

**Issue Tracking**: We use **beads** (command: `bd`) for all task tracking. Do NOT create markdown TODO lists.

**Key Features:**
- Real-time hardware monitoring (CPU, Memory, GPU, Disk, Network)
- Model management (list, show running, test generation)
- Server health status with auto-refresh
- Responsive design with modern gradient UI

## Tech Stack

- **Backend**: Node.js, Express.js, axios, cors, systeminformation
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Target**: Ollama running on http://localhost:11434

## Coding Guidelines

### Testing
- Always test API endpoints manually with curl or browser
- Verify UI responsiveness on different screen sizes
- Check auto-refresh behavior (5-second intervals)
- Test with Ollama running and offline states

### Code Style
- Keep frontend code simple (vanilla JS, no frameworks)
- Use clear variable names and inline comments
- Follow existing Express.js patterns in server.js
- Maintain responsive design principles

### File Structure
```
dashboard/
├── server.js           # Express backend with API routes
├── public/
│   ├── index.html      # Dashboard UI
│   ├── styles.css      # Gradient UI styling
│   └── script.js       # Frontend JavaScript
├── package.json        # Dependencies
└── .beads/
    ├── beads.db        # SQLite database (DO NOT COMMIT)
    └── issues.jsonl    # Git-synced issue storage
```

## Issue Tracking with bd

**CRITICAL**: This project uses **bd** for ALL task tracking. Do NOT create markdown TODO lists.

### Essential Commands

```bash
# Find work
bd ready --json                    # Unblocked issues
bd list --status open --json       # All open issues

# Create and manage
bd create "Title" -t bug|feature|task -p 0-4 --json
bd create "Subtask" --parent <epic-id> --json  # Hierarchical subtask
bd update <id> --status in_progress --json
bd close <id> --reason "Done" --json

# Search
bd show <id> --json
bd list --priority 1 --json
```

### Workflow

1. **Check ready work**: `bd ready --json`
2. **Claim task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** `bd create "Found bug" -p 1 --deps discovered-from:<parent-id> --json`
5. **Complete**: `bd close <id> --reason "Done" --json`
6. **Sync**: Changes auto-sync to `.beads/issues.jsonl`

### Priorities

- `0` - Critical (server crashes, data loss, broken API)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

## API Endpoints

### Models
- `GET /api/models` - List all available models
- `GET /api/models/running` - List currently running models
- `GET /api/models/:name` - Get detailed information about a specific model

### Monitoring
- `GET /api/health` - Check Ollama server status
- `GET /api/hardware` - Get comprehensive hardware metrics
- `POST /api/generate` - Generate text using a model

## Development Tasks

### Common Modifications

**Adding new hardware metrics:**
1. Update `/api/hardware` endpoint in `server.js`
2. Add new display section in `public/index.html`
3. Update `updateHardware()` in `public/script.js`

**Adding model operations:**
1. Create new API endpoint in `server.js`
2. Add UI controls in `public/index.html`
3. Wire up event handlers in `public/script.js`

**UI improvements:**
1. Modify layout in `public/index.html`
2. Update styles in `public/styles.css`
3. Test responsive behavior on mobile

## CLI Help

Run `bd <command> --help` to see all available flags for any command.
For example: `bd create --help` shows `--parent`, `--deps`, `--assignee`, etc.

## Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Test API endpoints before closing issues
- ✅ Verify responsive design on mobile
- ✅ Run `bd <cmd> --help` to discover available flags
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT commit `.beads/beads.db` (JSONL only)
- ❌ Do NOT add frontend frameworks without discussion
- ❌ Do NOT break the auto-refresh functionality

---

**For detailed workflows and advanced features, see [AGENTS.md](../AGENTS.md)**
