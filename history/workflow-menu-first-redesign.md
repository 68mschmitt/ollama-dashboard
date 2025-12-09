# Workflow Orchestrator Menu-First Redesign

## Date
December 9, 2025

## Overview
Redesigned the workflow orchestrator command to be menu-first, eliminating ambiguity about when to prompt users versus automatically continuing workflows.

## Problem Statement

The previous workflow orchestrator had several issues:

1. **Ambiguous command mode**: Unclear whether to show menu and wait, or automatically continue
2. **Missing invocation context**: Agents didn't specify behavior when invoked outside workflow
3. **Conflicting instructions**: "Automatic continuation" vs "Wait for user selection"
4. **No clear default path**: Menu treated as edge case rather than primary interface
5. **User confusion**: Users receiving clarifying questions instead of actionable recommendations

## Solution: Menu-First Design

### Core Philosophy

**Primary Use Case**: Smart menu with contextual recommendations
**Secondary Use Case**: Direct issue ID as shortcut for power users

### Key Changes

#### 1. Command Spec Restructured (.opencode/command/workflow/workflow.md)

**Before**: Step 0 had confusing logic about when to show menu
**After**: Clear routing with three paths:
- Empty args → Smart Menu (PRIMARY)
- Valid issue ID → Direct Workflow (SHORTCUT)
- Invalid input → Error + recover to menu (ERROR)

**Before**: Menu shown as "Step 0a" nested under decision logic
**After**: Menu is Steps 2-6 in the primary flow

#### 2. Menu Intelligence Enhanced

**Smart Recommendations Algorithm**:
```javascript
Priority 100: Resume paused workflows (time already invested)
Priority 90:  Fix critical blockers (unblocks other work)
Priority 80:  High-priority ready issues (P0, P1)
```

**Visual Indicators**:
- ⏸️ = Paused workflow (resume)
- 🚀 = Ready to start (new)
- 🔧 = Needs fix (blocker/escalation)
- ✅ = Recently completed
- ⚠️ = Needs attention

#### 3. Single Selection Principle

**Before**: Nested menus, multi-step selection flows
**After**: ONE selection → automatic execution

**Actions**:
- Options 1-3: Execute recommended actions (workflows run to completion)
- Options 4-5: View information and return to menu
- Option 6: Enter specific issue ID and start workflow
- Option 0: Exit

#### 4. Automatic Continuation Clarified

**Scope of automation**:
- Menu display: WAIT for user selection
- After selection: AUTOMATIC execution through all phases
- No prompts during workflow execution (dev → test → review)
- Next decision point: Only if errors, escalation, or completion

#### 5. Agent Invocation Context Added

All agent files now have "Invocation Context" section explaining:

**Workflow Invocation** (primary):
- Receive orchestrator context
- Output structured markers (`HANDOFF_CREATED:`, `REVIEW_DECISION:`)
- Orchestrator handles automatic continuation

**Direct Invocation** (secondary):
- User invokes directly (`@backend do X`)
- No workflow context
- Work independently via beads
- No automatic handoff

### Files Modified

1. `.opencode/command/workflow/workflow.md` - Complete rewrite (menu-first)
2. `.opencode/agent/backend.md` - Added invocation context section
3. `.opencode/agent/frontend.md` - Added invocation context section
4. `.opencode/agent/testing.md` - Added invocation context section
5. `.opencode/agent/devops.md` - Added invocation context section
6. `.opencode/agent/reviewer.md` - Added invocation context section
7. `AGENTS.md` - Updated /workflow command documentation

### User Experience Improvements

#### Before
```
User: /workflow
Agent: I need to clarify what you're asking me to do...
       Questions:
       1. Which issue should I work on?
       2. What is the current state?
       3. What phase are we in?
```

#### After
```
User: /workflow
Agent: [Displays smart menu automatically]
       
       ╔═══════════════════════════════════════════════════════╗
       ║              🎯 WORKFLOW ORCHESTRATOR                  ║
       ╚═══════════════════════════════════════════════════════╝
       
       ┌─ RECOMMENDED ACTIONS ───────────────────────────────┐
       │  [1] ⏸️  Resume: dashboard-bpr (testing, iter 1/3)  │
       │  [2] 🚀 Start: dashboard-def (backend, P1)         │
       │  [3] 🔧 Fix: dashboard-abc-esc (blocker)           │
       └──────────────────────────────────────────────────────┘
       
       Select [1-6,0]: _

User: 1
Agent: [Automatically resumes workflow, executes to completion]
```

### Technical Implementation Details

#### Recommendation Generation
```javascript
function generateRecommendations(paused, active, byDomain, blocked) {
  // Priority-based ranking
  // Return top 3 actionable items
  // Include context for display
}
```

#### Menu Action Execution
```javascript
switch(selection) {
  case 1-3: executeRecommendation() → automatic workflow
  case 4-5: displayInfo() → return to menu
  case 6: promptForId() → start workflow
  case 0: exit()
}
```

#### Error Recovery
- Invalid input → show error, redisplay menu
- Empty input → prompt again
- Error during workflow → create blocker, pause, return to menu status

### Benefits

1. **No Ambiguity**: Clear what happens at each step
2. **User-Friendly**: Always actionable recommendations
3. **Context-Aware**: Smart suggestions based on workspace state
4. **Efficient**: Single selection → automatic completion
5. **Recoverable**: Errors handled gracefully, return to menu
6. **Discoverable**: Menu shows what's possible
7. **Flexible**: Shortcut mode for power users

### Testing Checklist

- [ ] `/workflow` shows menu automatically
- [ ] Menu displays active/paused/ready/blocked issues
- [ ] Recommendations ranked by priority
- [ ] Selection 1-3 starts/resumes workflows
- [ ] Selection 4-5 shows info and returns to menu
- [ ] Selection 6 prompts for issue ID
- [ ] Selection 0 exits cleanly
- [ ] Invalid input shows error and redisplays menu
- [ ] `/workflow <issue-id>` skips menu (direct mode)
- [ ] Direct mode detects existing workflows
- [ ] Workflows execute automatically after selection
- [ ] Agents output structured markers
- [ ] Orchestrator parses markers correctly
- [ ] Iteration limits enforced (max 3)
- [ ] Escalation creates blocker issues
- [ ] Multi-domain splits work correctly
- [ ] State tracked in orchestrator issues

### Documentation Updates

- Command spec: Complete rewrite with menu-first approach
- Agent specs: Added invocation context sections
- Main docs: Updated /workflow usage with PRIMARY/SHORTCUT modes
- History: This document capturing the redesign

### Future Enhancements

1. **Persistent menu state**: Remember last viewed position
2. **Filtering**: Allow filtering recommendations by domain
3. **Search**: Quick search for issue IDs in menu
4. **Recent history**: Show recently completed workflows
5. **Metrics**: Display workflow success rate, avg duration
6. **Batch operations**: Select multiple issues to process

### Success Criteria

✅ Users never receive "clarifying questions" from orchestrator
✅ Menu is the default, automatic experience
✅ Direct issue ID works as power user shortcut
✅ Agents understand when they're in workflow vs direct invocation
✅ Workflows execute automatically once started
✅ No nested menus or multi-step selections
✅ Error recovery always returns to actionable state

## Conclusion

The menu-first redesign eliminates ambiguity in the workflow orchestrator by making the smart menu the primary interface, with clear automatic execution after selection. This provides a superior user experience with contextual recommendations while maintaining power user shortcuts for direct workflow invocation.
