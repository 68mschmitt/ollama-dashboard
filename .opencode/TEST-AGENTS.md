# Quick Agent Test Guide

## Test 1: Direct Agent Invocation

Try invoking agents directly with @mention:

```
@backend check for backend work using bd ready
```

Expected behavior:
- OpenCode loads `.opencode/agent/backend.md`
- Agent runs `bd ready --label backend --json`
- Shows backend-specific issues

## Test 2: List Available Agents

Try Tab key to see available agents, or type:

```
@
```

Expected: Autocomplete shows available agents (backend, frontend, testing, devops, reviewer)

## Test 3: Workflow Dashboard

```
/workflow
```

Expected:
- Shows workflow dashboard
- Lists active/paused workflows
- Shows ready issues by domain
- Provides suggested actions

## Test 4: Full Workflow (if you have issues)

```
/workflow <issue-id>
```

Expected:
- Analyzes issue
- Presents smart detection menu
- Routes to appropriate domain agent
- Manages dev → test → review cycle

## Verification Checklist

- [ ] `@backend` works - agent loads and responds
- [ ] `@frontend` works - agent loads and responds
- [ ] `@testing` works - agent loads and responds
- [ ] `@devops` works - agent loads and responds
- [ ] `@reviewer` works - agent loads and responds
- [ ] `/workflow` shows dashboard
- [ ] Agents have access to configured tools (write, edit, bash, beads)
- [ ] Agents respect permission settings

## Troubleshooting

### Agent doesn't load
- Check `.opencode/agent/<agent>.md` exists
- Verify frontmatter is valid YAML
- Ensure `mode: subagent` is set

### Tools not available
- Check `tools` section in frontmatter
- Verify MCP servers are running (beads, context7, etc.)

### Workflow command fails
- Check `.opencode/command/workflow/workflow.md` exists
- Verify beads is installed and working (`bd --version`)
- Check for syntax errors in workflow.md

## Success Indicators

✅ Agents respond to @mention
✅ Agents have domain-specific instructions
✅ Agents can access tools (bd commands, file operations)
✅ Workflow command executes
✅ Task tool can launch subagents

---

If all tests pass, the migration is successful!
