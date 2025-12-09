# Beads MCP Migration Reference

This document provides a complete mapping from `bd` CLI commands to `beads_*` MCP functions for migrating workflows and agents.

## Why Use MCP Functions?

✅ **Structured responses** - No JSON parsing required  
✅ **Better error handling** - Structured error objects  
✅ **Type safety** - Schema validation built-in  
✅ **Performance** - No shell process overhead  
✅ **Debugging** - Clear function call traces  
✅ **Consistency** - Same interface as other MCP tools  

## Complete CLI → MCP Mapping

### bd ready

**CLI Command**:
```bash
bd ready --label backend --json
bd ready --status pending --json
bd ready --json
```

**MCP Function**:
```javascript
beads_ready({ label: "backend" })
beads_ready({ status: "pending" })
beads_ready({})
```

**Parameters**:
- `label` (string, optional) - Filter by domain label
- `status` (string, optional) - Filter by status

**Returns**: Array of ready issue objects

---

### bd create

**CLI Command**:
```bash
bd create "Issue Title" \
  --label backend \
  --priority 2 \
  --deps discovered-from:parent-id \
  --description "Detailed description" \
  --notes '{"key": "value"}' \
  --json
```

**MCP Function**:
```javascript
beads_create({
  title: "Issue Title",
  label: "backend",
  priority: 2,
  deps: "discovered-from:parent-id",
  description: "Detailed description",
  notes: JSON.stringify({ key: "value" })
})
```

**Parameters**:
- `title` (string, required) - Issue title
- `label` (string, optional) - Domain tags
- `priority` (number, optional) - 0-4 priority level
- `deps` (string, optional) - Dependency string
- `description` (string, optional) - Issue details
- `notes` (string, optional) - JSON metadata (must be stringified)

**Returns**: Created issue object with ID

---

### bd update

**CLI Command**:
```bash
bd update dashboard-bpr --status in_progress --json
bd update dashboard-bpr --priority 1 --json
bd update dashboard-bpr-orch --notes '{"phase": "testing"}' --json
```

**MCP Function**:
```javascript
beads_update({
  id: "dashboard-bpr",
  status: "in_progress"
})

beads_update({
  id: "dashboard-bpr",
  priority: 1
})

beads_update({
  id: "dashboard-bpr-orch",
  notes: JSON.stringify({ phase: "testing" })
})
```

**Parameters**:
- `id` (string, required) - Issue ID
- `status` (string, optional) - New status
- `priority` (number, optional) - New priority
- `notes` (string, optional) - JSON metadata (must be stringified)

**Returns**: Updated issue object

---

### bd close

**CLI Command**:
```bash
bd close dashboard-bpr --reason "Implementation complete" --json
```

**MCP Function**:
```javascript
beads_close({
  id: "dashboard-bpr",
  reason: "Implementation complete"
})
```

**Parameters**:
- `id` (string, required) - Issue ID
- `reason` (string, optional but recommended) - Completion message

**Returns**: Closed issue object

---

### bd comment

**CLI Command**:
```bash
bd comment dashboard-bpr "Implementation notes..." --json
```

**MCP Function**:
```javascript
beads_comment({
  id: "dashboard-bpr",
  comment: "Implementation notes..."
})
```

**Parameters**:
- `id` (string, required) - Issue ID
- `comment` (string, required) - Comment text

**Returns**: Comment object with timestamp

---

### bd show

**CLI Command**:
```bash
bd show dashboard-bpr --json
```

**MCP Function**:
```javascript
beads_show({ id: "dashboard-bpr" })
```

**Parameters**:
- `id` (string, required) - Issue ID

**Returns**: Full issue object with all fields

---

### bd list

**CLI Command**:
```bash
bd list --label orchestrator-context --status in_progress --json
bd list --priority 1 --json
bd list --label backend,frontend --json
```

**MCP Function**:
```javascript
beads_list({
  label: "orchestrator-context",
  status: "in_progress"
})

beads_list({ priority: 1 })

beads_list({ label: "backend,frontend" })
```

**Parameters**:
- `label` (string, optional) - Filter by labels (comma-separated)
- `status` (string, optional) - Filter by status
- `priority` (number, optional) - Filter by priority

**Returns**: Array of issue objects matching filters

---

## Common Migration Patterns

### Pattern 1: Check for Ready Work

**Before (CLI)**:
```bash
result=$(bd ready --label backend --json)
```

**After (MCP)**:
```javascript
const issues = beads_ready({ label: "backend" });
// issues is already a JavaScript array
```

---

### Pattern 2: Create Issue and Store ID

**Before (CLI)**:
```bash
result=$(bd create "Title" --label backend --json)
issue_id=$(echo "$result" | jq -r '.id')
```

**After (MCP)**:
```javascript
const result = beads_create({
  title: "Title",
  label: "backend"
});
const issueId = result.id;
```

---

### Pattern 3: Update with Complex Metadata

**Before (CLI)**:
```bash
bd update dashboard-orch \
  --notes '{"phase":"testing","iteration":2,"data":["a","b"]}' \
  --json
```

**After (MCP)**:
```javascript
beads_update({
  id: "dashboard-orch",
  notes: JSON.stringify({
    phase: "testing",
    iteration: 2,
    data: ["a", "b"]
  })
});
```

---

### Pattern 4: Query and Filter Issues

**Before (CLI)**:
```bash
# Get orchestrator tracking issues
result=$(bd list --label orchestrator-context --status in_progress --json)
# Parse JSON to get specific fields
```

**After (MCP)**:
```javascript
const trackingIssues = beads_list({
  label: "orchestrator-context",
  status: "in_progress"
});

// Direct JavaScript array methods
const paused = trackingIssues.filter(issue => {
  const state = JSON.parse(issue.notes || "{}");
  return state.paused === true;
});
```

---

### Pattern 5: Error Handling

**Before (CLI)**:
```bash
if ! result=$(bd create "Title" --json 2>&1); then
  echo "Error: $result"
  exit 1
fi
```

**After (MCP)**:
```javascript
try {
  const issue = beads_create({ title: "Title" });
  // Success - use issue.id
} catch (error) {
  // Error handling
  beads_create({
    title: "Blocker: Failed to create issue",
    label: "blocked,needs-human",
    priority: 1,
    description: `Error: ${error.message}`
  });
}
```

---

## Workflow-Specific Examples

### Example 1: Orchestrator Tracking Issue

**Before (CLI)**:
```bash
bd create "Orchestrator: Workflow for dashboard-bpr" \
  --label orchestrator-context \
  --priority 2 \
  --deps parent-child:dashboard-bpr \
  --description "Tracking workflow..." \
  --notes '{
    "workflow_id": "dashboard-bpr",
    "current_phase": "dev",
    "iteration": 1,
    "max_iterations": 3
  }' \
  --json
```

**After (MCP)**:
```javascript
const orchIssue = beads_create({
  title: "Orchestrator: Workflow for dashboard-bpr",
  label: "orchestrator-context",
  priority: 2,
  deps: "parent-child:dashboard-bpr",
  description: "Tracking workflow...",
  notes: JSON.stringify({
    workflow_id: "dashboard-bpr",
    current_phase: "dev",
    iteration: 1,
    max_iterations: 3
  })
});

// Store tracking ID
const orchId = orchIssue.id;
```

---

### Example 2: Create Test Handoff

**Before (CLI)**:
```bash
test_id=$(bd create "Test: dashboard-bpr - Verify feature" \
  --label testing \
  --deps discovered-from:dashboard-bpr \
  --priority 2 \
  --description "Test requirements..." \
  --json | jq -r '.id')

echo "HANDOFF_CREATED: test:$test_id"
```

**After (MCP)**:
```javascript
const testIssue = beads_create({
  title: "Test: dashboard-bpr - Verify feature",
  label: "testing",
  deps: "discovered-from:dashboard-bpr",
  priority: 2,
  description: "Test requirements..."
});

// Output for orchestrator parsing
console.log(`HANDOFF_CREATED: test:${testIssue.id}`);
```

---

### Example 3: Update Workflow State

**Before (CLI)**:
```bash
bd update dashboard-orch \
  --notes '{
    "current_phase": "testing",
    "current_issue": "dashboard-test-xyz",
    "handoff_chain": [{"from": "dev", "to": "test"}]
  }' \
  --json
```

**After (MCP)**:
```javascript
beads_update({
  id: "dashboard-orch",
  notes: JSON.stringify({
    current_phase: "testing",
    current_issue: "dashboard-test-xyz",
    handoff_chain: [{ from: "dev", to: "test" }]
  })
});
```

---

### Example 4: Check for Paused Workflows

**Before (CLI)**:
```bash
workflows=$(bd list --label orchestrator-context --status in_progress --json)
# Parse JSON and check for paused field
```

**After (MCP)**:
```javascript
const workflows = beads_list({
  label: "orchestrator-context",
  status: "in_progress"
});

const pausedWorkflows = workflows.filter(w => {
  const state = JSON.parse(w.notes || "{}");
  return state.paused === true;
});

if (pausedWorkflows.length > 0) {
  // Present resume menu
}
```

---

### Example 5: Close Workflow Issues

**Before (CLI)**:
```bash
bd close review-id --reason "Review approved" --json
bd close test-id --reason "Tests validated" --json
bd close dev-id --reason "Implementation approved" --json
bd close original-id --reason "Complete after 2 iterations" --json
bd close orch-id --reason "Workflow completed successfully" --json
```

**After (MCP)**:
```javascript
// Close all issues in reverse order
beads_close({ id: reviewId, reason: "Review approved" });
beads_close({ id: testId, reason: "Tests validated" });
beads_close({ id: devId, reason: "Implementation approved" });
beads_close({ id: originalId, reason: "Complete after 2 iterations" });
beads_close({ id: orchId, reason: "Workflow completed successfully" });
```

---

## Important Notes

1. **JSON.stringify() for notes**: Always stringify complex objects for the `notes` field
2. **No --json flag needed**: MCP functions always return structured data
3. **Direct array/object access**: No need to parse JSON strings
4. **Synchronous-style syntax**: MCP handles async internally
5. **Error objects**: MCP framework provides structured error handling

## Testing MCP Functions

Before migrating, test that beads MCP is working:

```javascript
// Test 1: List ready issues
const ready = beads_ready({});
console.log("Ready issues:", ready.length);

// Test 2: Create test issue
const testIssue = beads_create({
  title: "MCP Migration Test",
  label: "testing",
  priority: 2
});
console.log("Created:", testIssue.id);

// Test 3: Update status
beads_update({
  id: testIssue.id,
  status: "in_progress"
});

// Test 4: Add comment
beads_comment({
  id: testIssue.id,
  comment: "Testing MCP functions"
});

// Test 5: Close issue
beads_close({
  id: testIssue.id,
  reason: "MCP test complete"
});
```

---

## Migration Checklist

- [ ] Replaced all `bd ready` with `beads_ready()`
- [ ] Replaced all `bd create` with `beads_create()`
- [ ] Replaced all `bd update` with `beads_update()`
- [ ] Replaced all `bd close` with `beads_close()`
- [ ] Replaced all `bd comment` with `beads_comment()`
- [ ] Replaced all `bd show` with `beads_show()`
- [ ] Replaced all `bd list` with `beads_list()`
- [ ] Removed all `--json` flags from examples
- [ ] Updated JSON parsing logic (no longer needed)
- [ ] Updated error handling to use try/catch
- [ ] Added JSON.stringify() for all `notes` fields
- [ ] Tested all MCP functions work correctly

---

**Last Updated**: December 9, 2025
