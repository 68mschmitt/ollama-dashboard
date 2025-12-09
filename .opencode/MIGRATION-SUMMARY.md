# OpenCode Native Subagent Migration - Complete

## Summary

Successfully migrated the custom agent system from `.agents/` to native OpenCode subagents in `.opencode/agent/`.

## What Changed

### 1. Agent Definitions → Native OpenCode Subagents

**Before**: `.agents/<agent>_agent.md` (custom format)
**After**: `.opencode/agent/<agent>.md` (OpenCode native format with frontmatter)

All agents now have proper frontmatter configuration:
- `description`: Brief description for agent selection
- `mode: subagent`: Marks as invokable subagent
- `tools`: Tool permissions (write, edit, bash, etc.)
- `permission`: Fine-grained control over tool usage
- `temperature`: Model temperature setting

### 2. Agent Invocation → @mention Syntax

**Before** (manual loading):
```
User: "Load backend agent instructions and work on issue"
```

**After** (native invocation):
```
@backend please implement the SSE streaming endpoint
```

OpenCode automatically:
- Loads `.opencode/agent/backend.md`
- Creates isolated subagent session
- Applies configured tools and permissions
- Manages lifecycle

### 3. Workflow Orchestrator → Task Tool Integration

**Before** (text-based instructions):
```markdown
**Invoke agent with context**:
<paste large text block>
```

**After** (Task tool with @mention):
```javascript
Task({
  subagent_type: "general",
  description: "Implement feature for issue-id",
  prompt: `@backend you are being invoked...
  
  WORKFLOW CONTEXT: ...
  
  YOUR TASKS: ...
  
  IMPORTANT: Output HANDOFF_CREATED: test:<id>
  `
})
```

Orchestrator now:
- Uses Task tool to launch subagents
- Parses structured output (`HANDOFF_CREATED:`, `REVIEW_DECISION:`)
- Manages workflow state
- Handles errors gracefully

### 4. Reference Documentation → .opencode/docs/

**Moved**:
- `.agents/README.md` → `.opencode/docs/agent-system.md`
- `.agents/mcp-tools-reference.md` → `.opencode/docs/mcp-tools-reference.md`
- `.agents/handoff-templates.md` → `.opencode/docs/handoff-templates.md`

### 5. Updated References

- `AGENTS.md`: All paths updated to new locations
- `workflow.md`: Updated to use Task tool and new paths
- Agent instructions: Reference new doc paths

## New Structure

```
.opencode/
├── agent/                      # Native OpenCode subagents
│   ├── backend.md             # Backend developer (Node.js/Express)
│   ├── frontend.md            # Frontend developer (HTML/CSS/JS)
│   ├── testing.md             # Test infrastructure specialist
│   ├── devops.md              # Build/deploy/dependencies
│   └── reviewer.md            # Code quality gate
├── command/
│   └── workflow/
│       └── workflow.md        # Orchestrator (uses Task tool)
└── docs/                      # Reference documentation
    ├── agent-system.md        # Agent system overview
    ├── mcp-tools-reference.md # MCP tools documentation
    └── handoff-templates.md   # Handoff issue templates
```

## How to Use

### Invoke Agents Directly

```bash
# In OpenCode TUI
@backend implement the streaming API endpoint
@frontend add dark mode toggle
@testing write integration tests for auth
@reviewer review the recent changes
```

### Use Workflow Command

```bash
# Automated dev → test → review cycle
/workflow dashboard-bpr

# Show workflow dashboard
/workflow
```

### Agent Configuration

Each agent's frontmatter controls behavior:

```yaml
---
description: Backend Node.js/Express developer
mode: subagent
tools:
  write: true
  edit: true
  bash: true
permission:
  edit: allow
  bash:
    "bd *": allow
    "npm *": allow
    "*": ask
temperature: 0.3
---
```

## Benefits

### 1. Native OpenCode Integration
- ✅ Agents work with OpenCode's built-in agent system
- ✅ No custom invocation logic needed
- ✅ Proper tool sandboxing and permissions
- ✅ Agent switching with Tab key
- ✅ Session management built-in

### 2. @mention Convenience
- ✅ Simple `@backend` syntax
- ✅ Automatic context loading
- ✅ No manual file reading
- ✅ Discoverable via autocomplete

### 3. Better Isolation
- ✅ Each agent runs in isolated session
- ✅ Configured tool access only
- ✅ No accidental cross-domain changes
- ✅ Clear boundaries

### 4. Workflow Automation
- ✅ Task tool manages subagent lifecycle
- ✅ Structured output parsing
- ✅ Error handling and recovery
- ✅ State tracking

### 5. Maintainability
- ✅ Standard OpenCode configuration format
- ✅ Centralized documentation
- ✅ Clear separation of concerns
- ✅ Easy to add new agents

## Testing

To test the migration:

1. **Test direct invocation**:
   ```
   @backend check for backend work
   ```
   Expected: Agent loads, runs `bd ready --label backend`

2. **Test workflow command**:
   ```
   /workflow
   ```
   Expected: Shows workflow dashboard

3. **Test full workflow** (if you have issues):
   ```
   /workflow <issue-id>
   ```
   Expected: Orchestrator routes through dev → test → review

## Backwards Compatibility

The old `.agents/` directory still exists but is **deprecated**. All new functionality uses `.opencode/agent/`.

To fully migrate:
- Old `.agents/` directory can be archived or removed
- All references now point to `.opencode/`
- No code dependencies on `.agents/` remain

## Next Steps

1. **Test agent invocation**: Try `@backend`, `@frontend`, etc.
2. **Run workflow**: Test `/workflow` command
3. **Archive old agents**: Once confirmed working, can remove `.agents/`
4. **Create new agents**: Use `.opencode/agent/` for any new agents

## Migration Date

December 9, 2025

## Related Documentation

- `.opencode/docs/agent-system.md` - Complete agent system overview
- `.opencode/command/workflow/workflow.md` - Workflow orchestrator details
- `.opencode/docs/mcp-tools-reference.md` - Available MCP tools
- `.opencode/docs/handoff-templates.md` - Agent handoff patterns
- `AGENTS.md` - Main project documentation (updated)

---

Migration completed successfully! All agents now use OpenCode's native subagent system.
