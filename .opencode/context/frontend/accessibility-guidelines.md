# Accessibility Guidelines

**For**: Frontend agent  
**Purpose**: Web accessibility (a11y) best practices for creating inclusive user interfaces

## Overview

This guide covers web accessibility principles and implementation patterns to ensure the Ollama Metrics Dashboard is usable by everyone, including people with disabilities who use assistive technologies.

## Semantic HTML

### Use Semantic Elements

```html
<!-- ❌ BAD: Generic divs with no meaning -->
<div class="header">
    <div class="navigation">
        <div class="nav-item">Home</div>
    </div>
</div>

<!-- ✅ GOOD: Semantic HTML -->
<header>
    <nav>
        <ul>
            <li><a href="/">Home</a></li>
        </ul>
    </nav>
</header>
```

### Common Semantic Elements

```html
<!-- Page structure -->
<header> <!-- Site or page header -->
<nav>    <!-- Navigation links -->
<main>   <!-- Main content (one per page) -->
<article> <!-- Self-contained content -->
<section> <!-- Thematic grouping of content -->
<aside>   <!-- Tangentially related content -->
<footer>  <!-- Site or page footer -->

<!-- Content -->
<h1> to <h6> <!-- Headings (hierarchical) -->
<p>          <!-- Paragraphs -->
<ul>, <ol>   <!-- Lists -->
<figure>     <!-- Images with captions -->
<figcaption> <!-- Caption for figure -->
<time>       <!-- Dates and times -->
<address>    <!-- Contact information -->

<!-- Form controls -->
<button>     <!-- Clickable button -->
<label>      <!-- Label for form control -->
<input>      <!-- Form input -->
<select>     <!-- Dropdown -->
<textarea>   <!-- Multi-line text input -->
```

## ARIA (Accessible Rich Internet Applications)

### When to Use ARIA

**First Rule of ARIA**: Don't use ARIA if native HTML exists.

```html
<!-- ❌ BAD: ARIA when HTML exists -->
<div role="button" tabindex="0" aria-pressed="false">Click me</div>

<!-- ✅ GOOD: Native HTML -->
<button>Click me</button>
```

### ARIA Roles

```html
<!-- Landmark roles (prefer semantic HTML) -->
<div role="banner">      <!-- Use <header> instead -->
<div role="navigation">  <!-- Use <nav> instead -->
<div role="main">        <!-- Use <main> instead -->
<div role="complementary"> <!-- Use <aside> instead -->

<!-- Widget roles (when HTML doesn't exist) -->
<div role="dialog" aria-labelledby="dialog-title">
    <h2 id="dialog-title">Confirmation</h2>
    <p>Are you sure?</p>
</div>

<!-- Live region roles -->
<div role="alert">Error: Connection failed</div>
<div role="status">Loading complete</div>
<div role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"></div>
```

### ARIA States and Properties

```html
<!-- Labels and descriptions -->
<button aria-label="Close dialog">×</button>
<input aria-describedby="password-hint">
<span id="password-hint">Must be 8+ characters</span>

<!-- States -->
<button aria-pressed="true">Bold</button>
<div aria-expanded="false">Collapsed content</div>
<input aria-invalid="true" aria-errormessage="email-error">
<span id="email-error">Invalid email</span>

<!-- Relationships -->
<h2 id="section-title">Models</h2>
<div aria-labelledby="section-title">
    <!-- Content -->
</div>

<!-- Live regions -->
<div aria-live="polite">Updates will be announced</div>
<div aria-live="assertive">Important! Read immediately</div>
<div aria-atomic="true">Entire region re-announced on change</div>
```

## Keyboard Navigation

### Focus Management

```html
<!-- Ensure interactive elements are focusable -->
<button>Focusable by default</button>
<a href="/path">Focusable by default</a>

<!-- Make non-interactive elements focusable when needed -->
<div tabindex="0" role="button" onclick="handleClick()">
    Custom button
</div>

<!-- Prevent focus (use sparingly) -->
<div tabindex="-1">Not in tab order, but focusable programmatically</div>

<!-- Never use tabindex > 0 (breaks natural tab order) -->
```

### Focus Styles

```css
/* ❌ BAD: Removing focus outline without replacement */
button:focus {
    outline: none;
}

/* ✅ GOOD: Custom focus style */
button:focus {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
}

/* ✅ BETTER: Only remove outline for mouse users */
button:focus {
    outline: 2px solid #0066cc;
}

button:focus:not(:focus-visible) {
    outline: none;
}
```

### Keyboard Event Handling

```javascript
// Handle both click and keyboard events
button.addEventListener('click', handleAction);
button.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAction();
    }
});

// For custom interactive elements
const customButton = document.querySelector('[role="button"]');

customButton.addEventListener('keydown', (e) => {
    // Space or Enter should activate
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        customButton.click();
    }
});

// Trap focus in modal
function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) { // Shift+Tab
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
        
        // Escape to close
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}
```

## Screen Reader Support

### Alt Text for Images

```html
<!-- ❌ BAD: Missing alt text -->
<img src="logo.png">

<!-- ❌ BAD: Redundant alt text -->
<img src="logo.png" alt="Logo image">

<!-- ✅ GOOD: Descriptive alt text -->
<img src="logo.png" alt="Ollama Dashboard">

<!-- ✅ GOOD: Decorative image (empty alt) -->
<img src="decoration.png" alt="">

<!-- ✅ GOOD: Complex image with detailed description -->
<figure>
    <img src="chart.png" alt="CPU usage over time">
    <figcaption>
        CPU usage increased from 20% to 80% between 2pm and 4pm.
    </figcaption>
</figure>
```

### Form Labels

```html
<!-- ❌ BAD: No label -->
<input type="text" placeholder="Enter name">

<!-- ✅ GOOD: Explicit label -->
<label for="name-input">Name:</label>
<input type="text" id="name-input">

<!-- ✅ GOOD: Implicit label -->
<label>
    Name:
    <input type="text">
</label>

<!-- ✅ GOOD: Hidden label (visual label is clear) -->
<label for="search-input" class="visually-hidden">Search</label>
<input type="text" id="search-input" placeholder="Search models...">
```

### Visually Hidden Text

```css
/* Screen reader only text (visually hidden but accessible) */
.visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
```

```html
<button>
    <span aria-hidden="true">×</span>
    <span class="visually-hidden">Close dialog</span>
</button>
```

### Announcing Dynamic Content

```javascript
// Create live region for announcements
const announcer = document.createElement('div');
announcer.setAttribute('role', 'status');
announcer.setAttribute('aria-live', 'polite');
announcer.className = 'visually-hidden';
document.body.appendChild(announcer);

// Announce message
function announce(message) {
    announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
        announcer.textContent = '';
    }, 1000);
}

// Usage
announce('Model loaded successfully');
announce('5 new models available');
```

## Color and Contrast

### Contrast Requirements

**WCAG 2.1 Level AA Requirements**:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio
- UI components and graphics: 3:1 contrast ratio

```css
/* ❌ BAD: Insufficient contrast */
.text {
    color: #999999; /* 2.85:1 on white background */
    background: #ffffff;
}

/* ✅ GOOD: Sufficient contrast */
.text {
    color: #595959; /* 7:1 on white background */
    background: #ffffff;
}

/* ✅ GOOD: High contrast for important text */
.error {
    color: #cc0000; /* 7.4:1 on white background */
    background: #ffffff;
}
```

### Don't Rely on Color Alone

```html
<!-- ❌ BAD: Color is only indicator -->
<span style="color: red;">Error</span>

<!-- ✅ GOOD: Icon + text + color -->
<span class="error">
    <span aria-hidden="true">❌</span>
    Error
</span>

<!-- ❌ BAD: Color-coded status -->
<div class="status-green">Active</div>
<div class="status-red">Inactive</div>

<!-- ✅ GOOD: Text + color -->
<div class="status status--active">
    <span class="status__icon" aria-hidden="true">●</span>
    Active
</div>
<div class="status status--inactive">
    <span class="status__icon" aria-hidden="true">●</span>
    Inactive
</div>
```

## Forms and Inputs

### Error Messages

```html
<!-- Associate error message with input -->
<label for="email">Email</label>
<input 
    type="email" 
    id="email" 
    aria-describedby="email-error"
    aria-invalid="true"
>
<span id="email-error" class="error-message">
    Please enter a valid email address
</span>
```

```javascript
// Show error and update ARIA
function showError(input, message) {
    input.setAttribute('aria-invalid', 'true');
    
    const errorId = `${input.id}-error`;
    input.setAttribute('aria-describedby', errorId);
    
    const errorElement = document.createElement('span');
    errorElement.id = errorId;
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    input.parentNode.appendChild(errorElement);
    
    // Announce error
    announce(message);
}

// Clear error
function clearError(input) {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    
    const error = input.parentNode.querySelector('.error-message');
    if (error) {
        error.remove();
    }
}
```

### Required Fields

```html
<!-- Visual and programmatic indication -->
<label for="name">
    Name
    <span class="required" aria-label="required">*</span>
</label>
<input type="text" id="name" required aria-required="true">

<!-- Or use descriptive text -->
<label for="email">Email (required)</label>
<input type="email" id="email" required>
```

## Modals and Dialogs

### Accessible Modal

```javascript
class AccessibleModal {
    constructor() {
        this.previousFocus = null;
    }
    
    open(content) {
        // Save current focus
        this.previousFocus = document.activeElement;
        
        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'modal-title');
        
        this.modal.innerHTML = `
            <div class="modal__content">
                <h2 id="modal-title">${content.title}</h2>
                <div class="modal__body">${content.body}</div>
                <button class="modal__close" aria-label="Close dialog">×</button>
            </div>
        `;
        
        document.body.appendChild(this.modal);
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus first focusable element
        const firstFocusable = this.modal.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        // Trap focus
        this.trapFocus(this.modal);
        
        // Close on Escape
        this.handleEscape = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', this.handleEscape);
    }
    
    close() {
        if (this.modal) {
            this.modal.remove();
            document.body.style.overflow = '';
            
            // Restore focus
            if (this.previousFocus) {
                this.previousFocus.focus();
            }
            
            document.removeEventListener('keydown', this.handleEscape);
        }
    }
    
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        });
    }
}
```

## Skip Links

### Skip to Main Content

```html
<body>
    <!-- Skip link (first focusable element) -->
    <a href="#main-content" class="skip-link">
        Skip to main content
    </a>
    
    <header>
        <!-- Navigation -->
    </header>
    
    <main id="main-content" tabindex="-1">
        <!-- Main content -->
    </main>
</body>
```

```css
/* Hide skip link until focused */
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
}

.skip-link:focus {
    top: 0;
}
```

## Loading States

### Accessible Loading Indicators

```html
<!-- Loading spinner with text -->
<div role="status" aria-live="polite" aria-busy="true">
    <div class="spinner" aria-hidden="true"></div>
    <span class="visually-hidden">Loading models...</span>
</div>

<!-- Progress bar -->
<div role="progressbar" 
     aria-valuenow="45" 
     aria-valuemin="0" 
     aria-valuemax="100"
     aria-label="Loading progress">
    <div class="progress-bar__fill" style="width: 45%"></div>
    <span class="visually-hidden">45% complete</span>
</div>
```

## Common Patterns

### Accessible Button

```html
<!-- Icon button with label -->
<button aria-label="Delete model">
    <svg aria-hidden="true"><!-- trash icon --></svg>
</button>

<!-- Button with icon and text -->
<button>
    <svg aria-hidden="true"><!-- icon --></svg>
    Delete Model
</button>

<!-- Toggle button -->
<button 
    aria-pressed="false" 
    aria-label="Toggle dark mode"
    onclick="toggleDarkMode(this)">
    🌙
</button>

<script>
function toggleDarkMode(button) {
    const isPressed = button.getAttribute('aria-pressed') === 'true';
    button.setAttribute('aria-pressed', !isPressed);
    // Update theme...
}
</script>
```

### Accessible Tabs

```html
<div class="tabs">
    <div role="tablist" aria-label="Model information">
        <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">
            Details
        </button>
        <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2">
            Parameters
        </button>
    </div>
    
    <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
        <!-- Details content -->
    </div>
    
    <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
        <!-- Parameters content -->
    </div>
</div>
```

```javascript
// Arrow key navigation for tabs
tablist.addEventListener('keydown', (e) => {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(document.activeElement);
    
    let nextIndex;
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
        nextIndex = 0;
    } else if (e.key === 'End') {
        nextIndex = tabs.length - 1;
    }
    
    if (nextIndex !== undefined) {
        e.preventDefault();
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
    }
});
```

## Testing Accessibility

### Testing Tools

1. **Keyboard Testing**:
   - Can you navigate entire site with Tab/Shift+Tab?
   - Can you activate all controls with Enter/Space?
   - Is focus always visible?
   - Does Escape close modals/menus?

2. **Screen Reader Testing**:
   - NVDA (Windows, free)
   - JAWS (Windows, paid)
   - VoiceOver (macOS, built-in): Cmd+F5

3. **Automated Tools**:
   - axe DevTools (browser extension)
   - Lighthouse (Chrome DevTools)
   - WAVE (browser extension)

### Manual Checks

```javascript
// Check for missing alt text
document.querySelectorAll('img:not([alt])').forEach(img => {
    console.warn('Missing alt text:', img);
});

// Check for low contrast
// (Use browser extension like axe DevTools)

// Check for keyboard traps
// (Manually tab through entire page)
```

## Common Pitfalls

### Missing Labels

```html
<!-- ❌ BAD -->
<input type="text" placeholder="Search">

<!-- ✅ GOOD -->
<label for="search">Search</label>
<input type="text" id="search" placeholder="Search">
```

### Non-Interactive Elements as Buttons

```html
<!-- ❌ BAD -->
<div onclick="handleClick()">Click me</div>

<!-- ✅ GOOD -->
<button onclick="handleClick()">Click me</button>
```

### Empty Links

```html
<!-- ❌ BAD -->
<a href="/page"></a>

<!-- ✅ GOOD -->
<a href="/page">Go to page</a>

<!-- ✅ GOOD: Icon link with label -->
<a href="/page" aria-label="Go to page">
    <svg aria-hidden="true"><!-- icon --></svg>
</a>
```

## Loading Instructions

**When to load this context:**
- Starting any frontend implementation
- Adding interactive elements
- Creating forms
- Building modals or dialogs
- Implementing keyboard navigation
- Adding dynamic content
- Reviewing code for accessibility issues

**How to load:**
```bash
read .opencode/context/frontend/accessibility-guidelines.md
```

**Also consider loading:**
- `vanilla-js-patterns.md` - For implementing keyboard handlers
- `ui-component-patterns.md` - For accessible component patterns
- `responsive-design-patterns.md` - For touch-friendly designs

## Summary

**Key Takeaways:**
- Use semantic HTML whenever possible
- Provide text alternatives for non-text content
- Ensure keyboard accessibility for all interactive elements
- Maintain sufficient color contrast (4.5:1 for normal text)
- Label all form controls
- Provide focus indicators
- Use ARIA only when HTML is insufficient
- Test with keyboard and screen readers
- Trap focus in modals and announce dynamic content
- Don't rely on color alone to convey information

**Goal**: Create interfaces that are usable by everyone, regardless of their abilities or the assistive technologies they use.
