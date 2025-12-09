# Handoff Templates

This document provides templates for creating handoff issues between agents in the automated workflow.

## Naming Convention

**Pattern**: `<Phase>: <Original-ID> - <Action>`

**Examples**:
- `Test: dashboard-bpr - Verify environment variable configuration`
- `Review: dashboard-bpr - Environment variable implementation`
- `Fix: dashboard-bpr - Address review comments (iteration 2)`

## Developer → Test Handoff

**Created by**: Developer agent (backend, frontend, or devops)
**Claimed by**: Test agent

```bash
bd create "Test: <original-id> - Verify <feature-name>" \
  --label testing \
  --deps discovered-from:<original-id> \
  --priority <same-as-original> \
  --description "
Implementation completed for <original-id>: <original-title>

**Implementation Summary**:
<paste developer's implementation notes>

**Files Modified**:
- <file-path> (lines X-Y)
- <file-path> (lines X-Y)

**Test Requirements**:
- Verify <feature> works as specified
- Test edge cases: <list edge cases>
- Test error handling: <list error scenarios>
- Ensure no regressions in related functionality

**Acceptance Criteria**:
- All tests pass
- Coverage meets project standards (80%+)
- Tests document expected behavior clearly

**Reference**:
- Parent issue: <original-id>
- Developer notes: See comments on <original-id>
" \
  --json
```

**Example**:

```bash
bd create "Test: dashboard-bpr - Verify environment variable configuration" \
  --label testing \
  --deps discovered-from:dashboard-bpr \
  --priority 2 \
  --description "
Implementation completed for dashboard-bpr: Add environment variable configuration

**Implementation Summary**:
Added support for OLLAMA_URL environment variable in server.js.
Falls back to http://localhost:11434 if not set.
Modified lines 12-15 in server.js.

**Files Modified**:
- server.js (lines 12-15)

**Test Requirements**:
- Verify custom URL works when OLLAMA_URL is set
- Verify fallback to default URL when OLLAMA_URL not set
- Test error handling for invalid URLs
- Ensure no regressions in existing Ollama API calls

**Acceptance Criteria**:
- All tests pass
- Coverage meets project standards (80%+)
- Tests document expected behavior clearly

**Reference**:
- Parent issue: dashboard-bpr
- Developer notes: See comments on dashboard-bpr
" \
  --json
```

## Test → Review Handoff

**Created by**: Test agent
**Claimed by**: Reviewer agent

```bash
bd create "Review: <original-id> - <feature-name> implementation" \
  --label review \
  --deps discovered-from:<test-id> \
  --priority <same-as-original> \
  --description "
Implementation and tests completed for <original-id>: <original-title>

**Files Changed**:
<list files from git diff or developer notes>

**Implementation Details**:
<summary from developer notes>

**Test Coverage**:
<summary from test notes>
- Test files: <list>
- Test cases: <count>
- Coverage: <percentage>

**Review Checklist**:
- [ ] Code quality (naming, structure, comments)
- [ ] Best practices adherence
- [ ] Test coverage adequate
- [ ] Security considerations addressed
- [ ] Performance considerations addressed

**Reference**:
- Original issue: <original-id>
- Test issue: <test-id>
- Developer notes: See comments on <original-id>
- Test notes: See comments on <test-id>
" \
  --json
```

**Example**:

```bash
bd create "Review: dashboard-bpr - Environment variable implementation" \
  --label review \
  --deps discovered-from:dashboard-test-xyz \
  --priority 2 \
  --description "
Implementation and tests completed for dashboard-bpr: Add environment variable configuration

**Files Changed**:
- server.js (lines 12-15 modified)
- tests/server.test.js (new tests added)

**Implementation Details**:
Added OLLAMA_URL environment variable support with fallback to default URL.
Proper error handling for invalid URLs included.

**Test Coverage**:
- Test files: tests/server.test.js
- Test cases: 3 (custom URL, fallback URL, invalid URL)
- Coverage: 85%

**Review Checklist**:
- [ ] Code quality (naming, structure, comments)
- [ ] Best practices adherence
- [ ] Test coverage adequate
- [ ] Security considerations addressed
- [ ] Performance considerations addressed

**Reference**:
- Original issue: dashboard-bpr
- Test issue: dashboard-test-xyz
- Developer notes: See comments on dashboard-bpr
- Test notes: See comments on dashboard-test-xyz
" \
  --json
```

## Review → Developer Handoff (Changes Requested)

**Created by**: Reviewer agent
**Claimed by**: Original developer agent

```bash
bd create "Fix: <original-id> - Address review comments (iteration <n>)" \
  --label <original-domain-label> \
  --deps discovered-from:<review-id> \
  --priority <same-as-original> \
  --description "
Review iteration <n> of 3 for <original-id>: <original-title>

**Review Feedback**:

### Code Quality Issues:
1. <specific issue with file:line reference>
   Suggestion: <specific fix>
   
2. <specific issue with file:line reference>
   Suggestion: <specific fix>

### Best Practices Violations:
1. <specific issue with Context7 reference>
   Fix: <specific implementation>
   Reference: <Context7 library and topic>

### Test Coverage Gaps:
1. <specific gap>
   Required: <specific test to add>

### Security Concerns:
1. <specific concern>
   Risk: <potential impact>
   Fix: <specific mitigation>

### Performance Issues:
1. <specific issue>
   Impact: <performance impact>
   Fix: <specific optimization>

**Action Required**:
Address all feedback points above and update implementation.

**Iteration**: <n> of 3

**Reference**:
- Original issue: <original-id>
- Review issue: <review-id>
- Previous implementation notes: See comments on <original-id>
" \
  --json
```

**Example**:

```bash
bd create "Fix: dashboard-bpr - Address review comments (iteration 1)" \
  --label backend \
  --deps discovered-from:dashboard-review-abc \
  --priority 2 \
  --description "
Review iteration 1 of 3 for dashboard-bpr: Add environment variable configuration

**Review Feedback**:

### Code Quality Issues:
1. Variable name 'url' too generic (server.js:12)
   Suggestion: Rename to 'ollamaApiUrl' for clarity

### Best Practices Violations:
1. Missing input validation (server.js:13)
   Fix: Validate OLLAMA_URL format before using
   Reference: /express-validator/express-validator - URL validation

### Test Coverage Gaps:
1. Missing test for malformed URL
   Required: Add test case for URL with invalid protocol

### Security Concerns:
None identified.

### Performance Issues:
None identified.

**Action Required**:
1. Rename 'url' to 'ollamaApiUrl'
2. Add URL format validation
3. Add test case for malformed URL

**Iteration**: 1 of 3

**Reference**:
- Original issue: dashboard-bpr
- Review issue: dashboard-review-abc
- Previous implementation notes: See comments on dashboard-bpr
" \
  --json
```

## Blocker Issue Template

**Created by**: Orchestrator or any agent encountering errors
**Requires**: Human intervention

```bash
bd create "Blocker: <agent-type> failed on <issue-id>" \
  --label blocked,needs-human \
  --priority 1 \
  --deps discovered-from:<issue-id> \
  --description "
Workflow for <original-id> encountered an error during <phase> phase.

**Error Details**:
- Agent: <agent-type>
- Phase: <phase>
- Timestamp: <timestamp>
- Error: <error-message>
- Stack trace: <if available>

**Context**:
<relevant context from issue notes>

**Action Required**:
Human intervention needed to resolve this blocker.

Once resolved:
1. Close this blocker issue
2. Run: /workflow <original-id> to resume workflow

**Reference**:
- Original issue: <original-id>
- Orchestrator tracking: <orch-id>
- Failed at: <current-issue-id>
" \
  --json
```

**Example**:

```bash
bd create "Blocker: Backend agent failed on dashboard-bpr" \
  --label blocked,needs-human \
  --priority 1 \
  --deps discovered-from:dashboard-bpr \
  --description "
Workflow for dashboard-bpr encountered an error during development phase.

**Error Details**:
- Agent: Backend Agent
- Phase: Development
- Timestamp: 2025-12-09T10:45:00Z
- Error: Cannot read property 'port' of undefined
- Stack trace: server.js:25

**Context**:
Backend agent was implementing environment variable support.
Error occurred when trying to access process.env.PORT.

**Action Required**:
Human intervention needed to resolve this blocker.

Once resolved:
1. Close this blocker issue
2. Run: /workflow dashboard-bpr to resume workflow

**Reference**:
- Original issue: dashboard-bpr
- Orchestrator tracking: dashboard-bpr-orch
- Failed at: dashboard-bpr
" \
  --json
```

## Escalation Issue Template

**Created by**: Orchestrator when max iterations reached
**Requires**: Human developer intervention

```bash
bd create "Escalation: <original-id> needs human review" \
  --label blocked,needs-human \
  --priority 0 \
  --deps discovered-from:<review-id> \
  --description "
Workflow for <original-id> exceeded maximum iterations (3).

**History**:
- Iteration 1: <summary of review feedback>
- Iteration 2: <summary of review feedback>
- Iteration 3: <summary of review feedback>

**Current State**:
Implementation has been revised 3 times but still does not meet review criteria.

**Outstanding Issues**:
<paste unresolved feedback from latest review>

**Recommendation**:
Human developer should:
1. Review the implementation and all feedback
2. Determine if requirements need clarification
3. Implement final fixes manually
4. Update this issue with resolution
5. Close this escalation when complete

**Reference**:
- Original issue: <original-id>
- Latest review: <review-id>
- Orchestrator tracking: <orch-id>
- All iterations: See comments on <original-id>
" \
  --json
```

**Example**:

```bash
bd create "Escalation: dashboard-x90 needs human review" \
  --label blocked,needs-human \
  --priority 0 \
  --deps discovered-from:dashboard-review-final \
  --description "
Workflow for dashboard-x90 exceeded maximum iterations (3).

**History**:
- Iteration 1: Error handling incomplete, missing tests
- Iteration 2: Error handling improved but security validation missing
- Iteration 3: Security added but performance issues introduced

**Current State**:
Implementation has been revised 3 times but still does not meet review criteria.

**Outstanding Issues**:
1. Performance regression in streaming endpoint (server.js:120)
   - Response time increased from 50ms to 500ms
   - Blocking operation in async handler
2. Test coverage still at 75% (below 80% threshold)
   - Missing edge case tests for empty streams

**Recommendation**:
Human developer should:
1. Review the implementation and all feedback
2. Determine if requirements need clarification
3. Implement final fixes manually
4. Update this issue with resolution
5. Close this escalation when complete

**Reference**:
- Original issue: dashboard-x90
- Latest review: dashboard-review-final
- Orchestrator tracking: dashboard-x90-orch
- All iterations: See comments on dashboard-x90
" \
  --json
```

## Multi-Domain Split Templates

**Created by**: Orchestrator when issue has multiple domain labels

### Backend Split

```bash
bd create "Backend: <original-id> - <backend-portion>" \
  --label backend \
  --deps relates-to:<original-id> \
  --priority <same-as-original> \
  --description "
Backend portion of <original-id>: <original-title>

**Backend Requirements**:
<extract backend-specific requirements from original>

**API Specifications**:
- Endpoints to implement: <list>
- Request/response formats: <describe>
- Error handling: <describe>

**Acceptance Criteria**:
<backend-specific criteria>

**Reference**:
- Original issue: <original-id> (split into multiple domains)
- Frontend work depends on this completion
" \
  --json
```

### Frontend Split

```bash
bd create "Frontend: <original-id> - <frontend-portion>" \
  --label frontend \
  --deps discovered-from:<backend-split-id> \
  --priority <same-as-original> \
  --description "
Frontend portion of <original-id>: <original-title>

**Frontend Requirements**:
<extract frontend-specific requirements from original>

**UI Specifications**:
- Components to create: <list>
- User interactions: <describe>
- State management: <describe>

**Backend Integration**:
- API endpoints: <list from backend split>
- Request/response handling: <describe>

**Acceptance Criteria**:
<frontend-specific criteria>

**Reference**:
- Original issue: <original-id> (split into multiple domains)
- Backend issue: <backend-split-id> (must complete first)
" \
  --json
```

## Structured Issue Comments

Agents should document their work in issue comments using this format:

```markdown
---
**Agent**: <Agent Name>
**Phase**: <Development|Testing|Review>
**Status**: <Completed|In Progress|Blocked>
**Timestamp**: <ISO timestamp>

### <Section Title>
<Content>

### <Section Title>
<Content>

### Next Steps
<What happens next>

---
```

**Example Developer Comment**:

```markdown
---
**Agent**: Backend Agent
**Phase**: Development
**Status**: Completed
**Timestamp**: 2025-12-09T10:45:00Z

### Implementation Summary
- Added OLLAMA_URL environment variable support in server.js
- Fallback to http://localhost:11434 if not set
- Updated lines 12-15 in server.js

### Files Modified
- server.js (lines 12-15)

### Manual Testing
✓ Tested with custom URL via environment variable
✓ Tested fallback to default URL
✓ Verified error handling for invalid URLs

### Next Steps
Created handoff issue: dashboard-test-xyz (testing)

---
```

## Best Practices

### Do's
- ✓ Use consistent naming patterns
- ✓ Include specific file:line references
- ✓ Link to parent/related issues
- ✓ Provide clear action items
- ✓ Document all context for next agent
- ✓ Use structured markdown format

### Don'ts
- ✗ Don't create vague handoffs
- ✗ Don't forget to link dependencies
- ✗ Don't omit implementation details
- ✗ Don't skip acceptance criteria
- ✗ Don't forget to document test requirements

---

**Last Updated**: December 9, 2025
