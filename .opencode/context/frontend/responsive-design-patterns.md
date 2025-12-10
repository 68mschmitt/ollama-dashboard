# Responsive Design Patterns

**For**: Frontend agent  
**Purpose**: Mobile-first CSS patterns, media queries, flexbox, CSS grid, and responsive best practices

## Overview

This guide covers responsive design patterns for the Ollama Metrics Dashboard. We focus on mobile-first approach, flexible layouts, and ensuring the dashboard works beautifully on all screen sizes.

## Mobile-First Approach

### Why Mobile-First

Start with mobile styles, then enhance for larger screens:
- Simpler base styles
- Progressive enhancement
- Better performance on mobile
- Forces focus on essential content

### Basic Pattern

```css
/* Base styles: Mobile (default) */
.container {
    padding: 16px;
    font-size: 14px;
}

/* Tablet: 768px and up */
@media (min-width: 768px) {
    .container {
        padding: 24px;
        font-size: 16px;
    }
}

/* Desktop: 1024px and up */
@media (min-width: 1024px) {
    .container {
        padding: 32px;
        max-width: 1200px;
        margin: 0 auto;
    }
}
```

## Breakpoints

### Standard Breakpoints

```css
/* Mobile: 0-767px (default, no media query needed) */

/* Tablet: 768px - 1023px */
@media (min-width: 768px) {
    /* Tablet styles */
}

/* Desktop: 1024px and up */
@media (min-width: 1024px) {
    /* Desktop styles */
}

/* Large Desktop: 1440px and up (optional) */
@media (min-width: 1440px) {
    /* Large desktop styles */
}
```

### Breakpoint Variables

```css
:root {
    /* Define breakpoints as custom properties (for documentation) */
    --breakpoint-tablet: 768px;
    --breakpoint-desktop: 1024px;
    --breakpoint-large: 1440px;
}

/* Note: Can't use custom properties in @media queries directly */
/* Use preprocessor variables or stick with hardcoded values */
```

## Flexible Layouts with Flexbox

### Flexbox Basics

```css
/* Container */
.flex-container {
    display: flex;
    flex-direction: row;        /* row | column */
    justify-content: flex-start; /* flex-start | center | space-between | space-around */
    align-items: stretch;        /* stretch | center | flex-start | flex-end */
    gap: 16px;                   /* Space between items */
}

/* Items */
.flex-item {
    flex: 1;                     /* Grow to fill space */
    flex: 0 0 auto;              /* Don't grow, don't shrink, auto width */
    flex: 0 0 200px;             /* Fixed width */
}
```

### Common Flexbox Patterns

```css
/* Horizontal row with wrapping */
.metrics-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
}

.metric-card {
    flex: 1 1 300px; /* Grow, shrink, min-width 300px */
}

/* Vertical stack */
.sidebar {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

/* Center content horizontally and vertically */
.centered {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

/* Space between header and footer */
.page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.header {
    flex: 0 0 auto; /* Don't grow */
}

.main {
    flex: 1; /* Grow to fill space */
}

.footer {
    flex: 0 0 auto;
}

/* Responsive row to column */
.responsive-row {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

@media (min-width: 768px) {
    .responsive-row {
        flex-direction: row;
    }
}
```

## CSS Grid Layouts

### Grid Basics

```css
.grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3 equal columns */
    grid-template-rows: auto;
    gap: 16px;
}

/* Span multiple columns */
.grid-item-wide {
    grid-column: span 2; /* Span 2 columns */
}

/* Explicit placement */
.grid-item-specific {
    grid-column: 1 / 3; /* Start at 1, end at 3 */
    grid-row: 2 / 4;    /* Start at row 2, end at row 4 */
}
```

### Responsive Grid Patterns

```css
/* Auto-fit: Create as many columns as fit */
.auto-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
}

/* Responsive grid with breakpoints */
.metrics-grid {
    display: grid;
    grid-template-columns: 1fr; /* Mobile: 1 column */
    gap: 16px;
}

@media (min-width: 768px) {
    .metrics-grid {
        grid-template-columns: repeat(2, 1fr); /* Tablet: 2 columns */
    }
}

@media (min-width: 1024px) {
    .metrics-grid {
        grid-template-columns: repeat(3, 1fr); /* Desktop: 3 columns */
    }
}

/* Dashboard layout */
.dashboard {
    display: grid;
    grid-template-areas:
        "header"
        "main"
        "sidebar";
    gap: 16px;
}

@media (min-width: 1024px) {
    .dashboard {
        grid-template-areas:
            "header header"
            "main sidebar";
        grid-template-columns: 1fr 300px;
    }
}

.header { grid-area: header; }
.main { grid-area: main; }
.sidebar { grid-area: sidebar; }
```

## Responsive Typography

### Fluid Font Sizes

```css
/* Method 1: Media queries */
body {
    font-size: 14px; /* Mobile */
}

@media (min-width: 768px) {
    body {
        font-size: 16px; /* Tablet */
    }
}

/* Method 2: Viewport units with min/max */
h1 {
    font-size: clamp(24px, 5vw, 48px);
    /* min: 24px, preferred: 5% of viewport width, max: 48px */
}

/* Method 3: Calc with viewport units */
p {
    font-size: calc(14px + 0.25vw);
}
```

### Line Height and Spacing

```css
/* Responsive line height */
body {
    line-height: 1.5; /* Mobile: tighter spacing */
}

@media (min-width: 768px) {
    body {
        line-height: 1.6; /* Desktop: more spacious */
    }
}

/* Responsive margins */
h2 {
    margin-bottom: 12px;
}

@media (min-width: 768px) {
    h2 {
        margin-bottom: 16px;
    }
}
```

## Responsive Images

### Flexible Images

```css
/* Make images responsive by default */
img {
    max-width: 100%;
    height: auto;
    display: block;
}

/* Maintain aspect ratio */
.image-container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    overflow: hidden;
}

.image-container img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover; /* or contain */
}
```

### Picture Element

```html
<picture>
    <source media="(min-width: 1024px)" srcset="large.jpg">
    <source media="(min-width: 768px)" srcset="medium.jpg">
    <img src="small.jpg" alt="Description">
</picture>
```

## Viewport Units

### Understanding Viewport Units

```css
/* vw: 1% of viewport width */
.full-width {
    width: 100vw;
}

/* vh: 1% of viewport height */
.full-height {
    min-height: 100vh;
}

/* vmin: 1% of smaller dimension */
.square {
    width: 50vmin;
    height: 50vmin;
}

/* vmax: 1% of larger dimension */
.responsive-text {
    font-size: 5vmax;
}
```

### Safe Usage

```css
/* Avoid 100vw (causes horizontal scroll due to scrollbar) */
/* ❌ BAD */
.container {
    width: 100vw;
}

/* ✅ GOOD */
.container {
    width: 100%;
}

/* Use calc for precise viewport sizing */
.hero {
    height: calc(100vh - 60px); /* Full height minus header */
}
```

## Media Query Patterns

### Orientation

```css
/* Portrait orientation (mobile, typically) */
@media (orientation: portrait) {
    .content {
        flex-direction: column;
    }
}

/* Landscape orientation */
@media (orientation: landscape) {
    .content {
        flex-direction: row;
    }
}
```

### Hover Capability

```css
/* Only apply hover effects on devices that support hover */
@media (hover: hover) {
    .button:hover {
        background: #0066cc;
    }
}

/* Touch devices (no hover support) */
@media (hover: none) {
    .button:active {
        background: #0066cc;
    }
}
```

### Print Styles

```css
@media print {
    /* Hide unnecessary elements */
    .no-print {
        display: none;
    }
    
    /* Optimize for printing */
    body {
        font-size: 12pt;
        color: black;
        background: white;
    }
    
    /* Avoid page breaks inside elements */
    .card {
        page-break-inside: avoid;
    }
}
```

### Dark Mode

```css
/* Detect system dark mode preference */
@media (prefers-color-scheme: dark) {
    :root {
        --bg-color: #1a1a1a;
        --text-color: #ffffff;
    }
}

@media (prefers-color-scheme: light) {
    :root {
        --bg-color: #ffffff;
        --text-color: #000000;
    }
}
```

## Touch-Friendly Design

### Minimum Touch Target Size

```css
/* Buttons should be at least 44x44px */
.button {
    min-width: 44px;
    min-height: 44px;
    padding: 12px 24px;
    
    /* Add spacing between touch targets */
    margin: 8px;
}

/* Links in text should be larger on mobile */
a {
    padding: 4px 0;
    min-height: 44px;
    display: inline-block;
}

@media (min-width: 768px) {
    a {
        padding: 0;
        min-height: auto;
        display: inline;
    }
}
```

### Touch Feedback

```css
/* Visual feedback for touch */
.button {
    transition: background-color 0.15s ease;
}

.button:active {
    background-color: #0066cc;
    transform: scale(0.98);
}

/* Disable hover effects on touch devices */
@media (hover: hover) {
    .button:hover {
        background-color: #0080ff;
    }
}
```

## Container Queries (Modern)

### Using Container Queries

```css
/* Define container */
.card-container {
    container-type: inline-size;
    container-name: card;
}

/* Query based on container size, not viewport */
@container card (min-width: 400px) {
    .card {
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
}

@container card (min-width: 600px) {
    .card {
        grid-template-columns: 1fr 1fr 1fr;
    }
}
```

## Performance Considerations

### CSS Performance

```css
/* Avoid expensive properties on large screens */
@media (max-width: 767px) {
    /* Box shadows, filters, gradients are more expensive on mobile */
    .card {
        box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Lighter shadow */
    }
}

@media (min-width: 768px) {
    .card {
        box-shadow: 0 8px 16px rgba(0,0,0,0.15); /* Richer shadow */
    }
}

/* Use transform and opacity for animations (GPU accelerated) */
.animated {
    transition: transform 0.3s ease, opacity 0.3s ease;
}
```

### Loading Strategies

```css
/* Show simplified layout while loading */
.loading {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

## Common Responsive Patterns

### Navigation

```css
/* Mobile: Hamburger menu */
.nav {
    display: none; /* Hidden by default */
}

.nav.open {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    background: white;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.hamburger {
    display: block;
}

/* Desktop: Horizontal menu */
@media (min-width: 768px) {
    .nav {
        display: flex !important;
        flex-direction: row;
        position: static;
        box-shadow: none;
    }
    
    .hamburger {
        display: none;
    }
}
```

### Cards

```css
/* Mobile: Full-width cards */
.card {
    margin-bottom: 16px;
}

/* Tablet: 2-column grid */
@media (min-width: 768px) {
    .cards-container {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }
    
    .card {
        margin-bottom: 0;
    }
}

/* Desktop: 3-column grid */
@media (min-width: 1024px) {
    .cards-container {
        grid-template-columns: repeat(3, 1fr);
    }
}
```

### Sidebar Layouts

```css
/* Mobile: Sidebar below content */
.layout {
    display: flex;
    flex-direction: column;
}

.main {
    order: 1;
}

.sidebar {
    order: 2;
}

/* Desktop: Sidebar beside content */
@media (min-width: 1024px) {
    .layout {
        flex-direction: row;
        gap: 24px;
    }
    
    .main {
        flex: 1;
        order: 1;
    }
    
    .sidebar {
        flex: 0 0 300px;
        order: 2;
    }
}
```

## Common Pitfalls

### Fixed Widths

```css
/* ❌ BAD: Fixed width breaks on mobile */
.container {
    width: 1200px;
}

/* ✅ GOOD: Max-width with padding */
.container {
    max-width: 1200px;
    width: 100%;
    padding: 0 16px;
    margin: 0 auto;
}
```

### Forgetting Viewport Meta Tag

```html
<!-- ❌ BAD: Missing viewport meta tag -->
<head>
    <title>Dashboard</title>
</head>

<!-- ✅ GOOD: Include viewport meta tag -->
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Dashboard</title>
</head>
```

### Horizontal Scroll

```css
/* ❌ BAD: Content wider than viewport */
.content {
    width: 100vw; /* Includes scrollbar width */
    padding: 0 20px; /* Adds extra width */
}

/* ✅ GOOD: Use 100% and box-sizing */
* {
    box-sizing: border-box;
}

.content {
    width: 100%;
    padding: 0 20px; /* Included in width */
}
```

### Tiny Touch Targets

```css
/* ❌ BAD: Too small for touch */
.icon-button {
    width: 20px;
    height: 20px;
}

/* ✅ GOOD: Minimum 44x44px */
.icon-button {
    width: 44px;
    height: 44px;
    padding: 12px;
}

.icon-button img {
    width: 20px;
    height: 20px;
}
```

## Testing Responsive Design

### Browser DevTools

1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test common devices:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)
   - Desktop (1920x1080)

### CSS for Testing

```css
/* Show breakpoints during development */
body::before {
    content: 'Mobile';
    position: fixed;
    top: 0;
    right: 0;
    background: red;
    color: white;
    padding: 4px 8px;
    z-index: 9999;
    font-size: 12px;
}

@media (min-width: 768px) {
    body::before {
        content: 'Tablet';
        background: orange;
    }
}

@media (min-width: 1024px) {
    body::before {
        content: 'Desktop';
        background: green;
    }
}
```

## Loading Instructions

**When to load this context:**
- Implementing responsive layouts
- Working on mobile-first designs
- Debugging layout issues across screen sizes
- Adding media queries
- Optimizing for different devices
- Implementing flexbox or grid layouts

**How to load:**
```bash
read .opencode/context/frontend/responsive-design-patterns.md
```

**Also consider loading:**
- `vanilla-js-patterns.md` - For JavaScript behavior at different breakpoints
- `ui-component-patterns.md` - For responsive component patterns
- `accessibility-guidelines.md` - For accessible responsive design

## Summary

**Key Takeaways:**
- Start mobile-first, enhance for larger screens
- Use flexbox for 1D layouts, grid for 2D layouts
- Ensure touch targets are at least 44x44px
- Test on real devices when possible
- Use viewport meta tag
- Avoid fixed widths, use max-width instead
- Consider performance on mobile devices
- Use media queries for breakpoints: 768px (tablet), 1024px (desktop)

**Goal**: Create responsive interfaces that work beautifully on all screen sizes from mobile phones to large desktop monitors.
