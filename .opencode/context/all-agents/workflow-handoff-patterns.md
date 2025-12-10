# Workflow Handoff Patterns

**For**: All agents (backend, frontend, testing, reviewer, devops)  
**Purpose**: Standardized handoff templates and documentation formats for multi-agent workflows

## Overview

Agents work together through structured handoffs. Each agent completes their work and creates a handoff issue for the next agent in the chain, with complete context and instructions.

## Handoff Types

### 1. Development → Testing Handoff

Created by: Backend, Frontend, or DevOps agents  
Received by: Testing agent

**Template:**

```bash
bd create "Testing: <original-id> - Add tests for <feature>" \
  --label testing \
  --deps discovered-from:<dev-issue-id> \
  --priority <same-as-original> \
  --description "Implementation complete for <feature>. Tests needed.

**Files Changed**: 
- src/feature.js (implementation)
- src/api/endpoint.js (API changes)

**Implementation Summary**:
<Brief summary of what was implemented>

**Test Scenarios Needed**:
- Unit tests for core functions
- Integration tests for API endpoints
- Edge case handling
- Error scenarios

**Entry Points**:
- Function: \`functionName()\` in src/feature.js
- Endpoint: POST /api/endpoint
" \
  --json
```

### 2. Testing → Review Handoff

Created by: Testing agent  
Received by: Reviewer agent

**Template:**

```bash
bd create "Review: <original-id> - <feature> implementation" \
  --label review \
  --deps discovered-from:<testing-issue-id> \
  --priority <same-as-original> \
  --description "Implementation and tests complete for <feature>.

**Files Changed**: 
- src/feature.js (implementation)
- src/feature.test.js (tests)

**Test Coverage**: <percentage>%

**Review Checklist**:
- Code quality
- Best practices adherence
- Test coverage adequacy
- Security considerations
- Performance considerations

**Implementation Details**:
<paste developer implementation summary>

**Test Details**:
<Summary of tests added, coverage report>
" \
  --json
```

**Required Output Format:**

When creating review handoff, the testing agent must output:
```
HANDOFF_CREATED: review:<review-issue-id>
```

This allows the orchestrator to parse and continue the workflow automatically.

### 3. Review → Development Handoff (Changes Requested)

Created by: Reviewer agent  
Received by: Backend, Frontend, or DevOps agents

**Template:**

```bash
bd create "Fix: <original-id> - Address review feedback" \
  --label <backend|frontend|devops> \
  --deps discovered-from:<review-issue-id> \
  --priority <same-as-original> \
  --description "Review requested changes for <feature>.

**Review Outcome**: Changes Requested (Iteration <N>)

**Issues Found**:
1. <Issue description>
   - Location: <file>:<line>
   - Severity: <high|medium|low>
   - Fix needed: <specific action>

2. <Issue description>
   - Location: <file>:<line>
   - Severity: <high|medium|low>
   - Fix needed: <specific action>

**Original Implementation**: <brief summary>

**Action Items**:
- [ ] Fix issue 1
- [ ] Fix issue 2
- [ ] Update tests if needed
- [ ] Re-submit for review
" \
  --json
```

### 4. Testing → Development Handoff (Bug Discovery)

Created by: Testing agent  
Received by: Backend, Frontend, or DevOps agents

**Template:**

```bash
bd create "Backend: Fix issue revealed by test" \
  --label backend \
  --priority 1 \
  --deps discovered-from:<testing-issue-id> \
  --description "Tests uncovered bug in <feature>.

**Issue**: <clear description of the problem>

**Failing Test**: <test name or test case description>

**Expected Behavior**:
<what should happen>

**Actual Behavior**:
<what actually happens>

**Steps to Reproduce**:
1. <step 1>
2. <step 2>
3. <observe error>

**Test File**: tests/<file>.test.js:<line>
**Source File**: src/<file>.js:<line> (suspected location)

**Error Output**:
\`\`\`
<paste error message or stack trace>
\`\`\`
" \
  --json
```

### 5. Any Agent → Human Escalation (Blocker)

Created by: Any agent  
Received by: Human developer

**Template:**

```bash
bd create "Blocker: <original-id> - <brief issue description>" \
  --label blocked,needs-human \
  --deps blocks:<original-issue-id> \
  --priority 0 \
  --description "Cannot proceed with <original-task>. Human intervention needed.

**Agent**: <agent-name>
**Phase**: <development|testing|review>
**Iteration**: <N> (if applicable)

**Problem**:
<Clear description of what went wrong>

**What Was Attempted**:
1. <attempt 1> - <outcome>
2. <attempt 2> - <outcome>
3. <attempt 3> - <outcome>

**Why Blocked**:
<Explanation of why agent cannot proceed>

**Possible Solutions** (for human to evaluate):
- Option 1: <description>
- Option 2: <description>

**Context**:
- Orchestrator tracking: <orch-id> (if in workflow)
- Related issues: <issue-ids>
- Files involved: <file list>
" \
  --json
```

## Structured Documentation Format

### Agent Work Comments

When documenting work in an issue comment, use this structured format:

```bash
bd comment <issue-id> "
---
**Agent**: <Agent Name>
**Phase**: <Development|Testing|Review>
**Status**: <Completed|In Progress|Blocked>
**Timestamp**: $(date -u +\"%Y-%m-%dT%H:%M:%SZ\")

### Work Summary
<Brief summary of what was done>

### Files Changed
- path/to/file1.js (added feature X)
- path/to/file2.test.js (added tests)

### Key Decisions
- Decision 1: <rationale>
- Decision 2: <rationale>

### Test Results (if testing agent)
- Tests passing: <count>
- Coverage: <percentage>%
- New tests added: <count>

### Review Findings (if reviewer agent)
- Issues found: <count>
- Severity breakdown: <high/medium/low counts>
- Approved: <yes|no>

### Next Steps
<What needs to happen next, or which handoff was created>
---
" --json
```

### Why This Format Matters

**Benefits:**
- Consistent structure across all agents
- Easy to parse for orchestrator
- Complete context for next agent
- Clear audit trail
- Enables workflow automation

**Required Fields:**
- Agent name (who did the work)
- Phase (where in workflow)
- Status (current state)
- Timestamp (when work completed)

**Optional but Recommended:**
- Work summary
- Files changed
- Key decisions
- Test results (testing agent)
- Review findings (reviewer agent)
- Next steps

## Handoff Output Markers

### Purpose

Orchestrators and automation systems parse handoff markers to continue workflows automatically.

### Format Specification

When creating a handoff issue, output a marker in this format:

```
HANDOFF_CREATED: <type>:<issue-id>
```

**Valid types:**
- `review` - Testing → Review handoff
- `testing` - Development → Testing handoff
- `fix` - Review → Development handoff (changes requested)
- `blocked` - Any → Human escalation

**Examples:**

```
HANDOFF_CREATED: review:dashboard-abc
HANDOFF_CREATED: testing:dashboard-xyz
HANDOFF_CREATED: fix:dashboard-123
HANDOFF_CREATED: blocked:dashboard-456
```

### When to Output Markers

**Always output when:**
- Working within an automated workflow (orchestrator present)
- Creating handoff to next phase
- Completing your work and passing to another agent

**Don't output when:**
- Working independently (no orchestrator)
- Creating issues for human review
- Internal work tracking (not handoffs)

## Workflow State Tracking

### Orchestrator Context

When invoked by an orchestrator, agents receive workflow context:

```bash
# Example: Agent receives this context
ORCHESTRATOR_TRACKING_ID=dashboard-orch-123
ITERATION=1
PHASE=testing
ORIGINAL_ISSUE=dashboard-bpr
```

### Updating Orchestrator State

If provided with orchestrator tracking ID, update its state after completing work:

```bash
bd comment <orchestrator-tracking-id> "
**Phase Update**: <phase> → <next-phase>
**Status**: <completed|in-progress|blocked>
**Handoff Created**: <handoff-issue-id>
**Iteration**: <N>
" --json
```

This helps orchestrator track workflow progress and make routing decisions.

## Handoff Best Practices

### Do's

✅ **Include complete context** - Next agent should have everything they need
✅ **Be specific** - "Fix error handling in line 45" not "improve code"
✅ **List all files changed** - Helps reviewer/tester scope their work
✅ **Use structured format** - Makes parsing and automation easier
✅ **Output handoff markers** - Enables workflow automation
✅ **Link dependencies** - Use `discovered-from` to track work chain

### Don'ts

❌ **Assume context** - Don't assume next agent knows background
❌ **Vague descriptions** - "Fix bugs" is not helpful
❌ **Skip markers** - Always output HANDOFF_CREATED in workflows
❌ **Forget priority** - Match priority to original issue
❌ **Omit timestamps** - Always include when work was done

## Example: Complete Handoff Chain

**Scenario**: Implementing streaming generation feature

### Step 1: Development Complete

```bash
# Backend agent creates handoff to testing
bd create "Testing: dashboard-x90 - Add tests for streaming API" \
  --label testing \
  --deps discovered-from:dashboard-x90-backend \
  --priority 1 \
  --description "Streaming API implementation complete.

**Files Changed**:
- src/api/stream.js (SSE endpoint)
- src/utils/streaming.js (helper functions)

**Implementation Summary**:
Added Server-Sent Events endpoint at /api/stream for real-time token streaming.

**Test Scenarios Needed**:
- Unit tests for streaming utilities
- Integration test for SSE endpoint
- Error handling (connection drops, timeouts)
- Concurrent stream handling
" \
  --json

# Output: HANDOFF_CREATED: testing:dashboard-x90-test
```

### Step 2: Testing Complete

```bash
# Testing agent creates handoff to review
bd create "Review: dashboard-x90 - Streaming API implementation" \
  --label review \
  --deps discovered-from:dashboard-x90-test \
  --priority 1 \
  --description "Implementation and tests complete.

**Files Changed**:
- src/api/stream.js
- src/utils/streaming.js
- tests/api/stream.test.js
- tests/utils/streaming.test.js

**Test Coverage**: 87%

**Test Summary**:
- 15 unit tests added (utilities)
- 8 integration tests added (endpoint)
- All edge cases covered
- Error scenarios tested

**Review Checklist**:
- Code quality ✓
- Error handling ✓
- Test coverage ✓
- Security (streaming data) ⚠️
- Performance considerations ⚠️
" \
  --json

# Output: HANDOFF_CREATED: review:dashboard-x90-review
```

### Step 3A: Review Approved

```bash
# Reviewer closes review issue, workflow complete
bd close dashboard-x90-review --reason "Approved. Code quality good, all tests passing."
# Orchestrator closes original issue
bd close dashboard-x90 --reason "Feature complete and approved."
```

### Step 3B: Review Requests Changes

```bash
# Reviewer creates fix handoff back to backend
bd create "Fix: dashboard-x90 - Address review feedback" \
  --label backend \
  --deps discovered-from:dashboard-x90-review \
  --priority 1 \
  --description "Changes requested for streaming API.

**Review Outcome**: Changes Requested (Iteration 2)

**Issues Found**:
1. Memory leak in streaming buffer
   - Location: src/utils/streaming.js:45
   - Severity: high
   - Fix needed: Add cleanup on connection close

2. Missing rate limiting
   - Location: src/api/stream.js:30
   - Severity: medium
   - Fix needed: Add rate limit middleware

**Action Items**:
- [ ] Fix memory leak
- [ ] Add rate limiting
- [ ] Update tests for new behavior
- [ ] Re-submit for review
" \
  --json

# Output: HANDOFF_CREATED: fix:dashboard-x90-fix
# Workflow continues with iteration 2
```

## Loading Instructions

**When to load this context:**
- At the start of any workflow session (all agents)
- Before creating handoff issues
- When receiving handoff from another agent
- When working with orchestrator

**How to load:**
```bash
read ../../context/all-agents/workflow-handoff-patterns.md
```

## Summary

**Key Takeaways:**
1. Use structured templates for all handoffs
2. Include complete context for next agent
3. Output `HANDOFF_CREATED: <type>:<id>` markers for automation
4. Use structured documentation format in comments
5. Update orchestrator state when provided tracking ID
6. Link issues with `discovered-from` dependency

**Goal**: Enable seamless multi-agent workflows with complete context transfer.
