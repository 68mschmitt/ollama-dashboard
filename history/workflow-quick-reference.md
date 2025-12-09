# Quick Reference: Workflow Orchestrator Menu

## Usage

### Primary Mode (Recommended)
```
/workflow
```
Shows smart menu with recommendations → Select option → Automatic execution

### Shortcut Mode (Power Users)
```
/workflow <issue-id>
```
Skip menu, directly start/resume workflow for specific issue

## Menu Options

### Recommended Actions (1-3)
Execute immediately, workflow runs to completion automatically
- **[1-3]** Top recommendations based on:
  - Priority 100: Resume paused workflows
  - Priority 90: Fix critical blockers
  - Priority 80-89: High-priority issues (P0, P1)

### Information & Navigation (4-5)
View information, then return to menu
- **[4]** View all ready issues (filtered by domain)
- **[5]** View active workflows (status, phase, iteration)

### Manual Entry (6)
- **[6]** Enter specific issue ID to start workflow

### Exit (0)
- **[0]** Exit without action

## Visual Indicators

| Icon | Meaning | Action |
|------|---------|--------|
| ⏸️ | Paused workflow | Resume from last phase |
| 🚀 | Ready to start | Begin new workflow |
| 🔧 | Needs fix | Resolve blocker |
| ✅ | Recently completed | View summary |
| ⚠️ | Needs attention | Review details |
| ⚡ | In progress (active) | View status |

## Workflow Execution

Once you select a workflow action (options 1-3, 6):

```
Selection → AUTOMATIC execution
   ↓
Phase 1: Development (backend/frontend/devops agent)
   ↓ (automatic)
Phase 2: Testing (testing agent)
   ↓ (automatic)
Phase 3: Review (reviewer agent)
   ↓
Decision:
  ✓ APPROVED → Complete (all issues closed)
  ✗ CHANGES_REQUESTED → Iteration (max 3)
```

**No manual intervention** during workflow execution unless:
- Error occurs (creates blocker, pauses)
- Max iterations reached (escalates to human)
- Workflow completes (shows summary)

## Example Session

```bash
$ /workflow

╔═══════════════════════════════════════════════════════╗
║              🎯 WORKFLOW ORCHESTRATOR                  ║
╚═══════════════════════════════════════════════════════╝

Analyzing workspace... ✓

┌─ WORKFLOW STATUS ───────────────────────────────────┐
│ Active: 0 | Paused: 1 | Blocked: 0 | Ready: 5      │
└──────────────────────────────────────────────────────┘

┌─ RECOMMENDED ACTIONS ───────────────────────────────┐
│                                                      │
│  [1] ⏸️  Resume: dashboard-bpr (testing, iter 1/3)  │
│      Backend feature paused - continue testing       │
│      Priority: HIGH - Work already started          │
│                                                      │
│  [2] 🚀 Start: dashboard-def (backend, P1)         │
│      Add streaming API endpoint                      │
│      Priority: HIGH - Critical feature              │
│                                                      │
│  [3] 🚀 Start: dashboard-jkl (frontend, P2)        │
│      Add dark mode toggle                            │
│      Priority: MEDIUM - Nice to have               │
│                                                      │
└──────────────────────────────────────────────────────┘

┌─ MORE OPTIONS ──────────────────────────────────────┐
│  [4] 📋 View all ready issues (5 total)            │
│  [5] 🔍 View active workflows (0 in progress)      │
│  [6] 🎯 Start specific issue (enter ID)            │
│  [0] ❌ Exit                                        │
└──────────────────────────────────────────────────────┘

💡 Tip: Workflows run automatically once started

Select [1-6,0]: 1

Resuming workflow for dashboard-bpr...
Loading state... ✓
Current phase: testing | Iteration: 1/3

Phase 2/3: Testing
Routing to @testing...

[Testing Agent executes automatically]
Tests written... ✓
Coverage: 87%

Phase 3/3: Review
Routing to @reviewer...

[Reviewer Agent executes automatically]
Code reviewed... ✓
Decision: APPROVED ✓

╔═══════════════════════════════════════════════════════╗
║         ✅ WORKFLOW COMPLETE                           ║
╚═══════════════════════════════════════════════════════╝

Issue: dashboard-bpr
Title: Add environment variable configuration

┌─ WORKFLOW SUMMARY ──────────────────────────────────┐
│ Duration:   8 minutes
│ Iterations: 1
│ Result:     ✅ Approved
└──────────────────────────────────────────────────────┘

🎉 All phases completed successfully!
```

## Troubleshooting

### Menu shows no recommendations
- **Cause**: No issues ready or no prioritized work
- **Action**: Use option [4] to view all issues, or create new issues with `bd create`

### Workflow paused with blocker
- **Indicator**: ⚠️ icon next to issue
- **Action**: 
  1. View blocker details (option [5] or `bd show <blocker-id>`)
  2. Resolve the blocker issue
  3. Close blocker: `bd close <blocker-id>`
  4. Resume workflow: `/workflow` → select paused workflow

### Max iterations reached (escalation)
- **Indicator**: 🔧 icon next to escalation issue
- **Action**:
  1. Review escalation details
  2. Manually fix the issues
  3. Close escalation issue
  4. Resume workflow if needed

### Agent error during execution
- **Behavior**: Workflow pauses, blocker created
- **Action**:
  1. Check blocker issue for error details
  2. Fix underlying problem
  3. Close blocker
  4. Resume workflow from menu

## Best Practices

1. **Start with menu**: Always run `/workflow` first to see recommendations
2. **Resume paused work**: Prioritize resuming over starting new (time invested)
3. **Fix blockers early**: Unblock other work by resolving critical issues
4. **Trust automation**: Once started, let workflow run to completion
5. **Use shortcuts sparingly**: Direct issue IDs bypass context and recommendations

## Advanced Usage

### Batch Processing (CI/CD)
```bash
# Get ready issues
ISSUES=$(bd ready --json | jq -r '.[].id')

# Process each
for issue in $ISSUES; do
  /workflow $issue
done
```

### Filtering by Domain
```bash
# View backend work only
bd ready --label backend --json

# Then use option [6] to manually enter issue ID
```

### Checking Status
```bash
# View all active workflows
bd list --label orchestrator-context --status in_progress --json

# View specific workflow state
bd show <orch-tracking-id> --json
```

## See Also

- `.opencode/command/workflow/workflow.md` - Complete orchestrator specification
- `.opencode/agent/*.md` - Individual agent specifications
- `AGENTS.md` - Full agent system documentation
- `.opencode/docs/mcp-tools-reference.md` - Tool usage guide
