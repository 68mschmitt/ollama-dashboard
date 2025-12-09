# Project-Specific OpenCode Commands

This directory contains OpenCode slash commands that are specific to this project.

## Available Commands

### /workflow

**File**: `command/workflow/workflow.md`

**Description**: Start automated dev→test→review workflow for an issue

**Usage**:
```
/workflow <issue-id>
```

**Example**:
```
/workflow dashboard-bpr
```

**What it does**:
1. Checks for paused workflows
2. Analyzes the issue (labels, status, dependencies)
3. Detects multi-domain issues and splits if needed
4. Routes through dev→test→review phases
5. Handles iterations (max 3) or escalates
6. Completes successfully or blocks for human intervention

**Documentation**: See `AGENTS.md` → "Automated Workflow System" section

---

## About Project Commands

Project-specific commands in `.opencode/command/` are only available when working within this project directory. This keeps project-specific workflows isolated from global commands.

## Adding New Commands

To add a new project command:

1. Create a directory: `.opencode/command/<command-name>/`
2. Add a markdown file: `.opencode/command/<command-name>/<command-name>.md`
3. Include frontmatter:
   ```yaml
   ---
   description: Your command description
   agent: optional-agent-type
   ---
   ```
4. Add command instructions/logic in the markdown body

## Related Documentation

- **Agent Instructions**: `.opencode/agent/` directory
- **Workflow System**: `AGENTS.md` → "Automated Workflow System"
- **MCP Tools**: `.opencode/docs/mcp-tools-reference.md`
- **Templates**: `.opencode/docs/handoff-templates.md`

---

**Last Updated**: December 9, 2025
