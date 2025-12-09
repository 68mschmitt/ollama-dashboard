# Multi-Agent System

This project uses specialized agents coordinated through beads issue tracking.

## Agent Types

- **backend_agent.md** - Server, API, Node/Express work
- **frontend_agent.md** - UI, HTML/CSS/JS work  
- **testing_agent.md** - Test infrastructure and cases
- **devops_agent.md** - Dependencies, build, deployment

## Usage

### Invoking an Agent

Tell OpenCode to load specific agent context:

> "Load the backend agent instructions from .agents/backend_agent.md and check for backend work"

### Agent Workflow

1. Agent checks for domain-specific work: `bd ready --label <domain>`
2. Agent claims issue: `bd update <id> --status in_progress`
3. Agent implements solution within domain scope
4. Agent creates handoff issues if other domains needed
5. Agent completes: `bd close <id> --reason "..."`

### Benefits

- **Reduced context**: Each agent sees only relevant information
- **Domain expertise**: Specialized knowledge and best practices
- **Clear boundaries**: Explicit scope and handoff protocols
- **Parallel work**: Multiple agents work simultaneously
- **Git coordination**: All handoffs tracked in version control

## Label System

| Label | Domain | Files |
|-------|--------|-------|
| backend | Server-side code | server.js, API routes |
| frontend | Client-side code | public/*.html/css/js |
| testing | Test infrastructure | tests/, *.test.js |
| devops | Build/deploy | package.json, CI/CD |
| architecture | Design decisions | Cross-cutting concerns |

## Handoff Protocol

When work requires another domain:

```bash
bd create "Frontend: Add streaming UI" \
  --label frontend \
  --deps discovered-from:backend-issue-id \
  --json
```

This creates a linked issue for the frontend agent to discover.
