# Agent Context Migration Plan

**Created**: 2024-12-10  
**Purpose**: Guide for migrating remaining agents (backend, frontend, reviewer, devops) to the context file architecture  
**Status**: Ready for execution in fresh agent session

## Background

The testing agent has been successfully migrated to use external context files. This plan documents how to migrate the remaining agents (backend, frontend, reviewer, devops) to the same architecture.

### Completed Work

✅ **Testing Agent**: Fully migrated with 4 framework-specific context files
✅ **Shared Context**: 3 all-agents context files created and working
✅ **Agent References**: All agents updated to reference shared context

### Current State

```
.opencode/context/
├── all-agents/          # ✅ Complete - used by all agents
│   ├── efficiency-patterns.md
│   ├── tool-usage-best-practices.md
│   └── workflow-handoff-patterns.md
├── testing/             # ✅ Complete - testing agent specific
│   ├── jest-best-practices.md
│   ├── puppeteer-e2e-testing.md
│   ├── supertest-api-testing.md
│   └── test-strategy-general.md
├── backend/             # ❌ TODO - backend agent specific
├── frontend/            # ❌ TODO - frontend agent specific
├── review/              # ❌ TODO - reviewer agent specific
└── devops/              # ❌ TODO - devops agent specific
```

## Migration Principles

### What Stays in Agent Files
- Invocation context (workflow vs manual)
- Domain boundaries and responsibilities
- Workflow steps (claim, implement, document, handoff, close)
- Project-specific beads integration
- MCP tools overview (what's available)
- Workflow integration instructions

### What Moves to Context Files
- Framework-specific patterns and best practices
- Code examples and templates
- Common pitfalls and solutions
- Detailed implementation guidance
- Tool-specific usage patterns

### Context File Characteristics
- **Reusable**: Can be loaded by any agent needing that knowledge
- **Focused**: Single responsibility (one framework or pattern)
- **Comprehensive**: Complete examples and explanations
- **Self-contained**: Include loading instructions at end
- **Tool-agnostic metadata**: Should work with any tool/framework doing similar tasks

## Migration Priority

### Phase 1: Backend Agent (Priority: High)
**Reason**: Most complex domain, highest implementation detail currently in agent file

**Estimated Context Files**: 3-4 files
- `express-best-practices.md` - Express.js patterns, middleware, routing
- `nodejs-patterns.md` - Node.js best practices, async/await, error handling
- `api-design-patterns.md` - REST API design, request/response patterns
- `backend-testing-integration.md` - How backend code should be tested

**Current Agent Size**: 11,410 bytes (342 lines)  
**Target Agent Size**: ~200-250 lines (~40% reduction)

### Phase 2: Frontend Agent (Priority: High)
**Reason**: Second most complex, contains vanilla JS patterns

**Estimated Context Files**: 3-4 files
- `vanilla-js-patterns.md` - ES6+ patterns, DOM manipulation
- `responsive-design-patterns.md` - CSS patterns, media queries
- `frontend-state-management.md` - localStorage, session state
- `accessibility-guidelines.md` - ARIA, semantic HTML

**Current Agent Size**: 10,880 bytes (325 lines)  
**Target Agent Size**: ~200-250 lines (~40% reduction)

### Phase 3: Reviewer Agent (Priority: Medium)
**Reason**: Review process is standardized, contains checklist patterns

**Estimated Context Files**: 3-4 files
- `code-review-checklist.md` - Comprehensive review checklist
- `security-review-patterns.md` - Security considerations by technology
- `performance-review-guidelines.md` - Performance anti-patterns
- `test-coverage-evaluation.md` - How to evaluate test quality

**Current Agent Size**: 12,665 bytes (377 lines)  
**Target Agent Size**: ~200-250 lines (~45% reduction)

### Phase 4: DevOps Agent (Priority: Low)
**Reason**: Smallest agent, least complex patterns

**Estimated Context Files**: 2-3 files
- `dependency-management.md` - npm patterns, security updates
- `build-and-deployment.md` - Build scripts, CI/CD patterns
- `docker-patterns.md` - Containerization best practices (if needed)

**Current Agent Size**: 5,897 bytes (176 lines)  
**Target Agent Size**: ~150-180 lines (~15% reduction)

## Step-by-Step Migration Process

### For Each Agent:

#### Step 1: Analyze Current Agent File (15-30 minutes)

1. **Read the complete agent file**
   ```bash
   read .opencode/agent/{agent-name}.md
   ```

2. **Identify content categories**:
   - [ ] Workflow instructions (KEEP in agent file)
   - [ ] Framework-specific examples (MOVE to context)
   - [ ] Best practices lists (MOVE to context)
   - [ ] Code templates (MOVE to context)
   - [ ] Tool usage patterns (MOVE to context)
   - [ ] Project-specific beads commands (KEEP in agent file)

3. **Create extraction plan**:
   - List all sections to extract
   - Determine logical grouping (1 context file per major topic)
   - Identify dependencies between sections

#### Step 2: Create Context Directory (5 minutes)

```bash
mkdir -p .opencode/context/{agent-name}/
```

#### Step 3: Create Context Files (30-60 minutes per file)

For each identified context file:

1. **Create file with standard structure**:
   ```markdown
   # {Topic Name}
   
   **For**: {Agent Name} agent  
   **Purpose**: {One-sentence description}
   
   ## Overview
   {Brief introduction}
   
   ## {Section 1}
   {Content with examples}
   
   ## {Section 2}
   {Content with examples}
   
   ## Loading Instructions
   
   **When to load this context:**
   - {Scenario 1}
   - {Scenario 2}
   
   **How to load:**
   ```bash
   read .opencode/context/{agent-name}/{filename}.md
   ```
   
   ## Summary
   
   **Key Takeaways:**
   - {Takeaway 1}
   - {Takeaway 2}
   
   **Goal**: {One-sentence goal}
   ```

2. **Extract content from agent file**:
   - Copy relevant sections
   - Expand with more examples if needed
   - Add "Common Pitfalls" sections
   - Include troubleshooting guidance

3. **Add cross-references**:
   - Reference related context files
   - Link to shared context (all-agents/) when relevant

#### Step 4: Modify Agent File (20-30 minutes)

1. **Add Context Resources section** (after "Your Domain"):
   ```markdown
   ## Context Resources
   
   **IMPORTANT**: Before starting any {domain} work, load the essential context files using the Read tool.
   
   ### Essential Context (Load FIRST - Every Session)
   
   Load these files at the start of **every** work session:
   
   ```bash
   # Critical tool usage patterns
   read .opencode/context/all-agents/tool-usage-best-practices.md
   
   # Efficiency patterns and batch operations
   read .opencode/context/all-agents/efficiency-patterns.md
   
   # Handoff templates and documentation formats
   read .opencode/context/all-agents/workflow-handoff-patterns.md
   ```
   
   ### {Agent}-Specific Context (Load as Needed)
   
   Load these based on what you're working on:
   
   ```bash
   # {Context file 1 purpose}
   read .opencode/context/{agent-name}/{file1}.md
   
   # {Context file 2 purpose}
   read .opencode/context/{agent-name}/{file2}.md
   ```
   
   ### Context Loading Example
   
   ```bash
   # Example: Starting a {specific task}
   
   # 1. Load essential context (always)
   read .opencode/context/all-agents/tool-usage-best-practices.md
   read .opencode/context/all-agents/efficiency-patterns.md
   read .opencode/context/all-agents/workflow-handoff-patterns.md
   
   # 2. Load domain-specific context (as needed)
   read .opencode/context/{agent-name}/{file1}.md
   read .opencode/context/{agent-name}/{file2}.md
   
   # 3. Begin work
   bd ready --label {agent-label} --json
   ```
   ```

2. **Replace detailed sections with references**:
   - Keep high-level overview
   - Add pointer to context file for details
   - Example:
     ```markdown
     ## {Topic} Best Practices
     
     **See complete {topic} patterns and examples in:**
     `.opencode/context/{agent-name}/{topic}-patterns.md`
     
     **Quick Reference:**
     - {Key point 1}
     - {Key point 2}
     
     Load the context file for complete guidance and examples.
     ```

3. **Verify agent file structure**:
   - [ ] Frontmatter unchanged
   - [ ] Invocation Context section intact
   - [ ] Your Domain section intact
   - [ ] Context Resources section added
   - [ ] Your Workflow section intact (but slimmed)
   - [ ] Available MCP Tools section intact
   - [ ] Workflow Integration section intact
   - [ ] Summary section intact

#### Step 5: Verification (10-15 minutes)

1. **Check file sizes**:
   ```bash
   wc -l .opencode/agent/{agent-name}.md
   wc -l .opencode/context/{agent-name}/*.md
   ```
   
   - Agent file should be ~200-300 lines
   - Context files should be ~300-600 lines each
   - Total context should be 3-5x original agent file size

2. **Verify references**:
   - All context file paths are correct
   - All references are up-to-date
   - Loading instructions are clear

3. **Test agent invocation** (if possible):
   - Invoke agent with test issue
   - Verify it loads context files
   - Verify it follows patterns from context

## Detailed Migration Plans

### Backend Agent Migration

**Current Structure Analysis** (backend.md):
- Lines 1-53: Frontmatter, invocation, domain, context resources ✅ KEEP
- Lines 54-120: Workflow steps ✅ KEEP (slim down)
- Lines 121-180: API endpoint patterns → MOVE to context
- Lines 181-240: Error handling examples → MOVE to context
- Lines 241-280: Environment configuration → MOVE to context
- Lines 281-342: MCP tools, workflow integration ✅ KEEP

**Context Files to Create**:

1. **`express-best-practices.md`** (~400 lines)
   - Express.js middleware patterns
   - Route organization
   - Request/response handling
   - Error middleware
   - Body parsing patterns
   - Static file serving

2. **`nodejs-patterns.md`** (~350 lines)
   - Async/await patterns
   - Error handling strategies
   - Promise management
   - Module organization
   - Event loop understanding
   - Memory management

3. **`api-design-patterns.md`** (~400 lines)
   - REST API design principles
   - Endpoint naming conventions
   - Status code usage
   - Request validation
   - Response formatting
   - API versioning

4. **`environment-configuration.md`** (~300 lines)
   - Environment variable patterns
   - Configuration management
   - Secrets handling
   - Multi-environment setup
   - .env file patterns

**Migration Steps**:
1. Create `.opencode/context/backend/` directory
2. Extract and create `express-best-practices.md`
3. Extract and create `nodejs-patterns.md`
4. Extract and create `api-design-patterns.md`
5. Extract and create `environment-configuration.md`
6. Update backend.md with context references
7. Verify total reduction ~140 lines

### Frontend Agent Migration

**Current Structure Analysis** (frontend.md):
- Lines 1-53: Frontmatter, invocation, domain, context resources ✅ KEEP
- Lines 54-120: Workflow steps ✅ KEEP (slim down)
- Lines 121-180: DOM manipulation patterns → MOVE to context
- Lines 181-240: Event handling examples → MOVE to context
- Lines 241-280: CSS patterns → MOVE to context
- Lines 281-325: MCP tools, workflow integration ✅ KEEP

**Context Files to Create**:

1. **`vanilla-js-patterns.md`** (~450 lines)
   - ES6+ features and patterns
   - DOM manipulation best practices
   - Event handling patterns
   - Async operations (fetch)
   - State management patterns
   - Common pitfalls (this binding, closures)

2. **`responsive-design-patterns.md`** (~400 lines)
   - Mobile-first approach
   - Media queries
   - Flexbox patterns
   - CSS Grid patterns
   - Viewport units
   - Responsive images

3. **`ui-component-patterns.md`** (~350 lines)
   - Component structure (no framework)
   - Reusable patterns
   - Data attributes
   - Template literals for HTML
   - Dynamic content updates
   - Loading states

4. **`accessibility-guidelines.md`** (~300 lines)
   - Semantic HTML
   - ARIA attributes
   - Keyboard navigation
   - Screen reader considerations
   - Color contrast
   - Focus management

**Migration Steps**:
1. Create `.opencode/context/frontend/` directory
2. Extract and create `vanilla-js-patterns.md`
3. Extract and create `responsive-design-patterns.md`
4. Extract and create `ui-component-patterns.md`
5. Extract and create `accessibility-guidelines.md`
6. Update frontend.md with context references
7. Verify total reduction ~125 lines

### Reviewer Agent Migration

**Current Structure Analysis** (reviewer.md):
- Lines 1-60: Frontmatter, invocation, domain, context resources ✅ KEEP
- Lines 61-150: Review workflow ✅ KEEP (slim down)
- Lines 151-220: Code quality checklist → MOVE to context
- Lines 221-280: Security review patterns → MOVE to context
- Lines 281-340: Performance considerations → MOVE to context
- Lines 341-377: MCP tools, workflow integration ✅ KEEP

**Context Files to Create**:

1. **`code-review-checklist.md`** (~500 lines)
   - General code quality criteria
   - Readability and maintainability
   - Naming conventions
   - Function complexity
   - Code duplication
   - Documentation quality
   - Technology-specific checklists

2. **`security-review-patterns.md`** (~450 lines)
   - Input validation
   - Authentication/authorization
   - SQL injection prevention
   - XSS prevention
   - CSRF protection
   - Secrets management
   - Dependency vulnerabilities

3. **`performance-review-guidelines.md`** (~400 lines)
   - Backend performance patterns
   - Frontend performance patterns
   - Database query optimization
   - Caching strategies
   - Bundle size considerations
   - Memory leaks

4. **`test-coverage-evaluation.md`** (~350 lines)
   - Coverage metrics interpretation
   - Quality over quantity
   - Critical path coverage
   - Edge case coverage
   - Integration test adequacy
   - E2E test appropriateness

**Migration Steps**:
1. Create `.opencode/context/review/` directory
2. Extract and create `code-review-checklist.md`
3. Extract and create `security-review-patterns.md`
4. Extract and create `performance-review-guidelines.md`
5. Extract and create `test-coverage-evaluation.md`
6. Update reviewer.md with context references
7. Verify total reduction ~170 lines

### DevOps Agent Migration

**Current Structure Analysis** (devops.md):
- Lines 1-53: Frontmatter, invocation, domain, context resources ✅ KEEP
- Lines 54-100: Workflow steps ✅ KEEP (slim down)
- Lines 101-130: Dependency management → MOVE to context
- Lines 131-160: Build patterns → MOVE to context
- Lines 161-176: MCP tools, workflow integration ✅ KEEP

**Context Files to Create**:

1. **`dependency-management.md`** (~350 lines)
   - npm best practices
   - package.json management
   - Security updates
   - Dependency auditing
   - Lock file handling
   - Peer dependencies

2. **`build-and-ci-patterns.md`** (~400 lines)
   - Build script organization
   - CI/CD pipeline setup
   - Environment-specific builds
   - Artifact management
   - Deployment strategies
   - Rollback procedures

3. **`monitoring-and-logging.md`** (~300 lines) [OPTIONAL]
   - Logging best practices
   - Monitoring setup
   - Error tracking
   - Performance monitoring
   - Health check endpoints

**Migration Steps**:
1. Create `.opencode/context/devops/` directory
2. Extract and create `dependency-management.md`
3. Extract and create `build-and-ci-patterns.md`
4. Optionally create `monitoring-and-logging.md`
5. Update devops.md with context references
6. Verify total reduction ~25 lines (already small)

## Execution Checklist

### Pre-Migration
- [ ] Read this plan completely
- [ ] Review testing agent migration as reference (`.opencode/agent/testing.md`)
- [ ] Review existing context files as templates (`.opencode/context/testing/`)
- [ ] Understand current agent responsibilities

### During Migration (Per Agent)
- [ ] Create context directory
- [ ] Extract content to context files (3-4 files per agent)
- [ ] Add standard headers, loading instructions, summaries
- [ ] Update agent file with Context Resources section
- [ ] Replace detailed sections with context references
- [ ] Verify file sizes (agent ~200-300 lines, context ~300-600 each)

### Post-Migration
- [ ] Verify all file paths are correct
- [ ] Check that all references work
- [ ] Test agent invocation (if possible)
- [ ] Update this plan with actual results
- [ ] Document any deviations from plan

## Success Criteria

### Per Agent
- ✅ Agent file reduced to 200-300 lines
- ✅ 3-4 context files created (300-600 lines each)
- ✅ Context Resources section added
- ✅ All references accurate
- ✅ Loading instructions clear

### Overall
- ✅ All 4 agents migrated (backend, frontend, reviewer, devops)
- ✅ 12-16 new context files created
- ✅ Agent files focused on workflow only
- ✅ Context files comprehensive and reusable
- ✅ Total context ~4,000-6,000 lines
- ✅ Agent files reduced by ~30-45% each

## Time Estimates

### Per Agent
- Analysis: 15-30 minutes
- Context file creation: 2-3 hours (3-4 files × 30-60 min)
- Agent file modification: 20-30 minutes
- Verification: 10-15 minutes
- **Total per agent**: 3-4.5 hours

### All Agents
- Backend: 4 hours
- Frontend: 3.5 hours
- Reviewer: 4 hours
- DevOps: 2.5 hours
- **Total**: 14 hours (~2 work days)

## Tips for Success

1. **Start with Backend**: Most complex, sets good patterns
2. **Use Testing as Template**: Copy structure from testing context files
3. **Keep Examples Realistic**: Use actual code from project when possible
4. **Add Troubleshooting**: Include "Common Issues" sections
5. **Cross-Reference**: Link related context files
6. **Verify Paths**: All file paths must be correct relative paths
7. **Loading Instructions**: Every context file needs clear loading instructions
8. **Summary Sections**: Help agents quickly decide if file is relevant

## Common Pitfalls to Avoid

❌ **Don't**: Copy entire agent file sections without reorganizing
✅ **Do**: Restructure content for context file audience

❌ **Don't**: Create overly specific context files (one pattern per file)
✅ **Do**: Group related patterns logically (one framework or domain per file)

❌ **Don't**: Forget loading instructions in context files
✅ **Do**: Include clear "When to load" and "How to load" sections

❌ **Don't**: Leave agent files with scattered framework details
✅ **Do**: Keep agent files purely focused on workflow

❌ **Don't**: Skip verification step
✅ **Do**: Check file sizes and reference accuracy

## Example Session Workflow

```bash
# 1. Start fresh session
# 2. Read this plan
read history/agent-context-migration-plan.md

# 3. Choose agent to migrate (recommend: backend first)
AGENT="backend"

# 4. Analyze current agent file
read .opencode/agent/${AGENT}.md
# Take notes on sections to extract

# 5. Create context directory
mkdir -p .opencode/context/${AGENT}/

# 6. Create context files (3-4 files)
# For each context file:
#   - Write content with standard structure
#   - Include examples and best practices
#   - Add loading instructions

# 7. Modify agent file
#   - Add Context Resources section
#   - Replace detailed sections with references
#   - Verify workflow sections intact

# 8. Verify
wc -l .opencode/agent/${AGENT}.md
wc -l .opencode/context/${AGENT}/*.md
# Check that paths are correct

# 9. Repeat for next agent
```

## Reference Materials

- **Testing Agent Migration**: `.opencode/agent/testing.md` (completed example)
- **Testing Context Files**: `.opencode/context/testing/` (templates to follow)
- **Shared Context**: `.opencode/context/all-agents/` (cross-agent patterns)
- **Session Analysis**: See original comments in plan prompt (efficiency insights)

## Questions to Ask During Migration

1. **Is this workflow or implementation?**
   - Workflow → Keep in agent file
   - Implementation → Move to context

2. **Is this reusable across projects?**
   - Yes → Great content for context file
   - No → Might stay in agent file or become project-specific context

3. **Does this belong in shared context?**
   - If multiple agents need it → Move to all-agents/
   - If agent-specific → Keep in agent-specific context

4. **Is this complete enough?**
   - Context files should be comprehensive
   - Include examples, pitfalls, troubleshooting

5. **Can an agent load this on-demand?**
   - Yes → Good context file
   - Must always be loaded → Consider keeping in agent

## Next Steps After Migration

1. **Monitor Usage**: Watch how agents use context files
2. **Gather Feedback**: Note any confusion or missing content
3. **Iterate**: Update context files based on actual usage
4. **Add More**: Create additional context files as patterns emerge
5. **Share Patterns**: Document successful patterns for other projects

## Appendix: File Size Targets

| Agent | Current | Target Agent | Context Files | Total Context |
|-------|---------|--------------|---------------|---------------|
| Backend | 342 lines | ~200 lines | 4 files | ~1,450 lines |
| Frontend | 325 lines | ~200 lines | 4 files | ~1,500 lines |
| Reviewer | 377 lines | ~200 lines | 4 files | ~1,700 lines |
| DevOps | 176 lines | ~160 lines | 2-3 files | ~750 lines |
| **Totals** | **1,220 lines** | **~760 lines** | **14-15 files** | **~5,400 lines** |

Net result: Agent files 38% smaller, 5.4k lines of comprehensive context documentation added.
