# /workflow Command - Quick Reference

## Command Usage

### Show Smart Suggestions (no arguments)
```bash
/workflow
```

**Shows**:
- Active workflows (currently running)
- Paused workflows (can be resumed)
- Ready issues (grouped by domain)
- Blocked issues (need attention)
- Suggested next actions

**Use case**: "What should I work on next?"

### Start/Resume Specific Workflow
```bash
/workflow <issue-id>
```

**Example**:
```bash
/workflow dashboard-bpr
```

**Does**:
- Starts new workflow for the issue
- Or resumes paused workflow
- Follows complete dev→test→review cycle

**Use case**: "Work on this specific issue"

---

## Smart Suggestions Dashboard Example

```
═══════════════════════════════════════════════════════
🎯 Workflow Dashboard
═══════════════════════════════════════════════════════

ACTIVE WORKFLOWS:
  • dashboard-bpr (backend) - At testing phase (iteration 1/3)

PAUSED WORKFLOWS:
  None

READY ISSUES (can start now):
Backend:
  • dashboard-def - Add streaming API endpoint (priority 1)
  • dashboard-ghi - Fix error handling bug (priority 2)

Frontend:
  • dashboard-jkl - Add dark mode toggle (priority 2)

BLOCKED ISSUES (need attention):
  None

═══════════════════════════════════════════════════════
SUGGESTED ACTIONS:

1. Start high-priority backend work: /workflow dashboard-def
2. Start frontend work: /workflow dashboard-jkl
3. View issue details: bd show dashboard-def --json
4. Check all ready issues: bd ready --json

═══════════════════════════════════════════════════════
```

---

## How It Works

### Without Issue ID (`/workflow`)

1. **Checks orchestrator tracking issues**
   - Finds all workflows with `orchestrator-context` label
   - Parses workflow state from notes field
   - Determines active vs paused status

2. **Queries ready issues**
   - Runs `bd ready --json` to get unblocked issues
   - Groups by domain (backend, frontend, testing, devops)
   - Sorts by priority (0=critical, 1=high, 2=medium, etc.)

3. **Checks for blockers**
   - Finds issues with `blocked` or `needs-human` labels
   - Shows what needs attention

4. **Generates smart suggestions**
   - Prioritizes: Resume → High priority → Medium priority
   - Provides copy-paste ready commands
   - Helps user decide what to work on next

5. **Exits** (doesn't start a workflow)

### With Issue ID (`/workflow dashboard-bpr`)

1. Checks for existing workflow
2. Analyzes the issue
3. Starts or resumes workflow
4. Routes through dev→test→review
5. Completes or escalates

---

## When to Use Each

**Use `/workflow` (no args) when**:
- ✅ You want to see what's available
- ✅ You need to decide what to work on
- ✅ You want to check workflow status
- ✅ You want smart suggestions

**Use `/workflow <issue-id>` when**:
- ✅ You know which issue to work on
- ✅ You want to resume a specific workflow
- ✅ You're ready to start implementation

---

## Quick Tips

1. **Start your session with `/workflow`** to see what's happening
2. **Use the suggested commands** - they're copy-paste ready
3. **Check blocked issues first** - resolve blockers before starting new work
4. **Resume paused workflows** before starting new ones
5. **Group related work** - finish backend before starting dependent frontend

---

## Examples

### Morning Workflow
```bash
# 1. Check what needs attention
/workflow

# Output shows: Paused workflow dashboard-abc needs escalation resolved

# 2. Check the escalation
bd show dashboard-abc-esc --json

# 3. Fix the issue manually

# 4. Resume the workflow
/workflow dashboard-abc
```

### Starting New Work
```bash
# 1. See what's available
/workflow

# Output shows: High-priority backend issue dashboard-def

# 2. Start working on it
/workflow dashboard-def

# Workflow automatically: implements → tests → reviews → completes
```

### Checking Status
```bash
# Quick status check
/workflow

# Output shows: dashboard-bpr at testing phase (iteration 1/3)
# You can see progress without interrupting the workflow
```

---

## Related Commands

```bash
# See all ready work
bd ready --json

# See work by domain
bd ready --label backend --json
bd ready --label frontend --json

# See blocked issues
bd list --label blocked,needs-human --json

# See active workflows
bd list --label orchestrator-context --status in_progress --json

# Get issue details
bd show <issue-id> --json
```

---

**Pro Tip**: Make `/workflow` your first command of every coding session to get a complete overview of what needs attention!
