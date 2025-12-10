# Tool Usage Best Practices

**For**: All agents (backend, frontend, testing, reviewer, devops)  
**Purpose**: Prevent common tool usage errors and inefficiencies

## CRITICAL: Bash Tool Description Parameter

### The Requirement

**ALWAYS include the `description` parameter when using the bash tool.**

The bash tool requires two parameters:
- `description` (string) - Brief description of what the command does
- `command` (string) - The actual shell command to execute

### Examples

✅ **CORRECT Usage:**

```javascript
bash({
  description: "Count test files in project",
  command: "find . -name '*.test.js' | wc -l"
})

bash({
  description: "Run npm tests for instances module",
  command: "npm test -- instances.test.js"
})

bash({
  description: "Check git status",
  command: "git status"
})
```

❌ **WRONG Usage (Will Fail):**

```javascript
// Missing description parameter
bash({ 
  command: "find . -name '*.test.js' | wc -l" 
})
// Error: Invalid input: expected string, received undefined

// Empty description
bash({ 
  description: "",
  command: "npm test" 
})
// Not technically an error, but not helpful
```

### Why This Matters

- **15-20 failed tool calls** were observed in testing sessions due to this issue
- Each failure wastes time and requires retry
- The description helps humans understand what the command does when reviewing logs

## Tool Selection Strategy

### When to Use Which Tool

**For File Operations:**

| Task | ✅ Use This | ❌ NOT This |
|------|------------|-------------|
| Read file contents | `read` tool | `cat`, `head`, `tail`, `grep` |
| Modify file contents | `edit` tool | `sed`, `awk`, `perl` |
| Create new file | `write` tool | `echo >`, `cat > file <<EOF` |
| Search for pattern | `grep` tool | `bash + grep command` |
| Find files | `glob` tool | `bash + find command` |

**For Shell Operations:**

Use `bash` tool for:
- Package manager commands (`npm`, `yarn`, `pip`)
- Version control (`git`)
- Process management (`ps`, `kill`)
- System commands that truly need shell execution

### Examples

✅ **CORRECT - Use dedicated tools:**

```javascript
// Reading a file
read({ filePath: "/path/to/file.js" })

// Editing a file
edit({
  filePath: "/path/to/file.js",
  oldString: "const old = 1;",
  newString: "const new = 2;"
})

// Searching for pattern
grep({
  pattern: "function.*test",
  path: "/path/to/search"
})
```

❌ **WRONG - Using bash for file operations:**

```javascript
// Don't do this
bash({
  description: "Read file contents",
  command: "cat /path/to/file.js"
})

// Don't do this
bash({
  description: "Replace text in file",
  command: "sed -i 's/old/new/g' file.js"
})
```

## Failure Recovery Pattern

### The Rule: Switch After 2 Failures

If a tool or command fails **2 times in a row**, immediately switch to a different approach.

### Decision Tree

```
Attempt 1: bash command
  ↓ (fails)
Attempt 2: Same bash command with different args
  ↓ (fails)
STOP: Switch strategy
  ↓
Try: read + edit tools instead
```

### Example Scenario

**Scenario**: Trying to count lines in a file

```javascript
// Attempt 1 - bash (fails due to missing description)
bash({ command: "wc -l file.js" })
// ❌ Error

// Attempt 2 - bash with description (fails for other reason)
bash({ description: "Count lines", command: "wc -l file.js" })
// ❌ Error

// SWITCH STRATEGY - Use read tool instead
read({ filePath: "file.js" })
// ✅ Success - count lines from result
```

### When to Switch Strategies

After 2 failures, consider these alternatives:

| Failed Approach | Alternative Strategy |
|----------------|---------------------|
| Bash command | Read + Edit tools |
| Single edit operation | Multiple smaller edits |
| Complex regex | Simple string replacement |
| Full test run | Focused test file |
| Direct file modification | Create helper script |

## Common Mistakes to Avoid

### 1. Continuing with failing tool beyond 2 attempts
- Wastes time (~5 minutes per session observed)
- Frustrates workflow
- Solution: Set mental limit of 2 attempts, then pivot

### 2. Using bash for file content operations
- Less efficient than dedicated tools
- Harder to debug
- Error handling is worse
- Solution: Use read/edit/write/grep/glob tools

### 3. Not checking tool documentation
- Each tool has specific parameter requirements
- Missing required parameters causes failures
- Solution: When in doubt, check the tool's parameter schema

### 4. Assuming bash works like a normal shell
- This is an AI tool interface, not a real terminal
- Different error handling and output
- Solution: Treat bash as a last resort, use specialized tools first

## Loading Instructions

**When to load this context:**
- At the start of every work session (all agents)
- Before using bash tool for the first time
- After encountering a tool failure

**How to load:**
```bash
read ../../context/all-agents/tool-usage-best-practices.md
```

## Summary Checklist

Before using bash tool:
- [ ] Included `description` parameter?
- [ ] Is bash really needed, or could I use read/edit/grep/glob?
- [ ] Have I already tried this approach twice without success?
- [ ] Do I know what to do if this fails?

Remember: **Specialized tools > Bash for file operations**
