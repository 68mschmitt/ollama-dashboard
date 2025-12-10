# Efficiency Patterns

**For**: All agents (backend, frontend, testing, reviewer, devops)  
**Purpose**: Maximize productivity through pattern recognition and batch operations

## Core Principle: Pattern Recognition → Batch Operations

When you identify a pattern that needs fixing in multiple places, **FIX ALL AT ONCE**, not one at a time.

### The Anti-Pattern (What NOT to Do)

❌ **Iterative Fix Pattern** (inefficient):

```
1. Find first issue
2. Fix first issue
3. Test/verify
4. Find next issue
5. Fix next issue
6. Test/verify
7. Repeat 8+ times...
```

**Cost**: ~8 edit operations, ~3 test runs, ~3 minutes wasted

### The Efficient Pattern (What TO DO)

✅ **Batch Fix Pattern** (efficient):

```
1. Find first issue
2. Recognize it's a pattern
3. Search for ALL occurrences
4. Fix ALL at once (single operation)
5. Test/verify once
```

**Savings**: ~1 edit operation, ~1 test run, ~30 seconds

## Pattern Recognition Workflow

### Step 1: Identify Pattern

When you encounter an issue, ask:
- "Is this likely to occur in multiple places?"
- "Does this follow a naming convention or structure?"
- "Am I likely to make this same mistake elsewhere?"

**Examples of patterns:**
- Incorrect function call syntax (repeated across file)
- Missing parameter in multiple places
- Inconsistent naming convention
- Outdated API usage pattern
- Missing error handling in similar functions

### Step 2: Search for All Occurrences

Use appropriate search tools:

```javascript
// Search in single file
read({ filePath: "path/to/file.js" })
// Then manually identify all occurrences

// Search across files
grep({
  pattern: "oldFunctionName",
  path: "src/",
  include: "*.js"
})
```

### Step 3: Fix All at Once

**Option A: Single edit with multiple replacements**
```javascript
edit({
  filePath: "file.js",
  oldString: `// Large block containing ALL instances
function test1() { oldPattern(); }
function test2() { oldPattern(); }
function test3() { oldPattern(); }`,
  newString: `// Fixed block with ALL instances updated
function test1() { newPattern(); }
function test2() { newPattern(); }
function test3() { newPattern(); }`
})
```

**Option B: Regex replacement (when pattern is simple)**
```javascript
bash({
  description: "Replace all occurrences of pattern",
  command: "sed -i '' 's/oldPattern/newPattern/g' file.js"
})
```

**Option C: Multiple edits in sequence (for complex changes)**
```javascript
// Only if edits are truly independent and different
edit({ filePath: "file.js", oldString: "...", newString: "..." })
edit({ filePath: "file.js", oldString: "...", newString: "..." })
edit({ filePath: "file.js", oldString: "...", newString: "..." })
```

### Step 4: Verify Once

Test/verify after ALL fixes are complete, not after each individual fix.

## Real-World Example: Assertion Pattern Fix

**Context**: Found 8 incorrect assertion patterns in test file

❌ **Inefficient approach** (what was observed):
```
1. Fix line 45: expect(errors).toContain(...) → expectErrorDetail(...)
2. Run tests
3. Fix line 67: expect(errors).toContain(...) → expectErrorDetail(...)
4. Run tests
5. Repeat 8 times...
```
**Time wasted**: ~3 minutes, 8 edit calls

✅ **Efficient approach** (what should have happened):
```
1. Identify pattern: expect(errors).toContain(expect.stringContaining(...))
2. Read file to find all 8 occurrences
3. Single edit replacing all 8 at once OR sed command
4. Run tests once
```
**Time saved**: ~2.5 minutes, 1 edit call

## Focused Execution Strategies

### Principle: Run Only What You Need

During iterative development, run focused tests/builds to get faster feedback.

### Examples

**Testing:**
```javascript
// ❌ Slow - run entire test suite for small change
bash({
  description: "Run all tests",
  command: "npm test"
})
// Takes 30+ seconds

// ✅ Fast - run only relevant tests
bash({
  description: "Run instances tests only",
  command: "npm test -- instances.test.js"
})
// Takes 5 seconds

// ✅ Faster - run only specific test suite
bash({
  description: "Run persistence tests only",
  command: "npm test -- instances.test.js -t 'Persistence'"
})
// Takes 2 seconds
```

**Building:**
```javascript
// ❌ Slow - full production build
bash({
  description: "Full production build",
  command: "npm run build"
})

// ✅ Fast - development build or type checking only
bash({
  description: "Type check only",
  command: "npm run type-check"
})
```

**Linting:**
```javascript
// ❌ Slow - lint entire project
bash({
  description: "Lint all files",
  command: "npm run lint"
})

// ✅ Fast - lint only changed files
bash({
  description: "Lint specific file",
  command: "npx eslint src/components/Button.js"
})
```

### When to Run Full Suite

Run complete test suite / full build only:
- Before creating PR
- After completing all changes
- For final verification
- When explicitly requested by user

## Failure Recovery Decision Tree

```
Tool/Command Attempt 1
  ↓
  Fails?
  ↓
Tool/Command Attempt 2 (with modifications)
  ↓
  Fails again?
  ↓
SWITCH STRATEGY IMMEDIATELY
  ↓
Choose alternative approach:
  - Different tool (bash → read/edit)
  - Different technique (single edit → multiple edits)
  - Different scope (full file → partial)
  - Ask for help (create blocker issue)
```

### Examples of Strategy Switches

| Failed Approach | After 2 Attempts, Try |
|----------------|----------------------|
| Bash command failing | Read tool + Edit tool |
| Single large edit failing | Multiple smaller edits |
| Complex regex replacement | Manual string replacements |
| Full test suite timing out | Focused test files |
| Automated fix not working | Manual inspection + fix |

## Efficiency Checklist

Use this checklist during any work session:

### Before Starting
- [ ] Have I loaded essential context files?
- [ ] Do I understand the full scope of work?
- [ ] Can I identify patterns before implementing?

### During Work
- [ ] Am I fixing things one-at-a-time when I could batch them?
- [ ] Am I running full test suites when focused tests would work?
- [ ] Have I tried the same failing approach more than twice?
- [ ] Am I using bash for file operations instead of dedicated tools?

### Pattern Recognition
- [ ] Does this issue appear in multiple places?
- [ ] Can I search for all occurrences?
- [ ] Can I fix all at once?

### Before Testing
- [ ] Can I test just the changed component/file?
- [ ] Do I need the full test suite right now?
- [ ] Is this the minimal test to verify my change?

### After Failure
- [ ] Have I failed twice with the same approach?
- [ ] Is it time to switch strategies?
- [ ] Should I try a different tool or technique?

## Time-Saving Heuristics

### Heuristic 1: "Same Pattern, Batch Fix"
If you see the same issue more than once → Search for all → Fix all at once

### Heuristic 2: "Two Strikes, Switch"
If approach fails twice → Immediately try different approach

### Heuristic 3: "Focused Over Full"
During development → Run focused tests/builds, not full suite

### Heuristic 4: "Tools Over Bash"
For file operations → Use specialized tools (read/edit/grep), not bash

### Heuristic 5: "Verify Last"
Multiple changes → Apply all changes first, then verify once

## Real Session Analysis

From actual testing session, inefficiencies identified:

**Issue**: Test isolation pattern
- **Attempts**: 4 iterations to fix module caching
- **Should have been**: 1 iteration with `jest.resetModules()` immediately
- **Time wasted**: ~5 minutes
- **Lesson**: Know framework patterns upfront, load context first

**Issue**: Assertion pattern fixes
- **Attempts**: 8 separate edit operations
- **Should have been**: 1 batch operation or regex replace
- **Time wasted**: ~3 minutes
- **Lesson**: Recognize pattern, fix all at once

**Issue**: Bash tool failures
- **Attempts**: 15-20 failed calls (missing description)
- **Should have been**: 0 failures (always include description)
- **Time wasted**: ~5 minutes
- **Lesson**: Load tool usage best practices first

**Total efficiency improvement possible**: ~35-40% time savings

## Loading Instructions

**When to load this context:**
- At the start of every work session (all agents)
- When encountering repetitive tasks
- Before starting large refactoring work
- After noticing inefficiency in your approach

**How to load:**
```bash
read ../../context/all-agents/efficiency-patterns.md
```

## Summary

**Remember these key principles:**
1. **Pattern → Batch**: Same issue multiple times? Fix all at once.
2. **Two failures → Switch**: Don't try same approach more than twice.
3. **Focused > Full**: During development, run minimal tests/builds.
4. **Verify last**: Make all changes, then test once.
5. **Tools > Bash**: Use specialized tools for file operations.

**Goal**: Complete work in 60-70% of the time by eliminating waste.
