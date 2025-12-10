# UI Component Patterns

**For**: Frontend agent  
**Purpose**: Reusable vanilla JavaScript component patterns for building modular, maintainable UI elements

## Overview

This guide covers UI component patterns for the Ollama Metrics Dashboard using vanilla JavaScript. We focus on creating reusable, self-contained components without frameworks.

## Component Structure

### Basic Component Pattern

```javascript
// Component as class
class MetricCard {
    constructor(container, data) {
        this.container = container;
        this.data = data;
        this.element = null;
        
        this.render();
        this.attachEvents();
    }
    
    render() {
        this.element = document.createElement('div');
        this.element.className = 'metric-card';
        this.element.innerHTML = this.template();
        this.container.appendChild(this.element);
    }
    
    template() {
        return `
            <div class="metric-card__header">
                <h3>${this.data.name}</h3>
            </div>
            <div class="metric-card__body">
                <p class="metric-card__value">${this.data.value}</p>
                <span class="metric-card__unit">${this.data.unit}</span>
            </div>
        `;
    }
    
    attachEvents() {
        const header = this.element.querySelector('.metric-card__header');
        header.addEventListener('click', () => this.handleClick());
    }
    
    handleClick() {
        console.log('Card clicked:', this.data.name);
    }
    
    update(newData) {
        this.data = { ...this.data, ...newData };
        this.render();
    }
    
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

// Usage
const container = document.getElementById('metrics-container');
const card = new MetricCard(container, {
    name: 'CPU Usage',
    value: 45,
    unit: '%'
});
```

### Functional Component Pattern

```javascript
// Component as factory function
function createButton(options) {
    const {
        text = 'Click me',
        variant = 'primary',
        onClick = () => {}
    } = options;
    
    const button = document.createElement('button');
    button.className = `btn btn--${variant}`;
    button.textContent = text;
    button.addEventListener('click', onClick);
    
    return {
        element: button,
        
        setText(newText) {
            button.textContent = newText;
        },
        
        setVariant(newVariant) {
            button.className = `btn btn--${newVariant}`;
        },
        
        disable() {
            button.disabled = true;
            button.classList.add('btn--disabled');
        },
        
        enable() {
            button.disabled = false;
            button.classList.remove('btn--disabled');
        },
        
        destroy() {
            button.remove();
        }
    };
}

// Usage
const deleteBtn = createButton({
    text: 'Delete',
    variant: 'danger',
    onClick: () => deleteModel()
});

container.appendChild(deleteBtn.element);
```

## Data Attributes for Components

### Using Data Attributes

```javascript
// Markup
// <div class="card" data-component="metric-card" data-metric-id="cpu">
//     ...
// </div>

// Initialize components from DOM
function initializeComponents() {
    const elements = document.querySelectorAll('[data-component="metric-card"]');
    
    elements.forEach(element => {
        const metricId = element.dataset.metricId;
        new MetricCard(element, metricId);
    });
}

// Component reads its config from data attributes
class Card {
    constructor(element) {
        this.element = element;
        this.config = {
            id: element.dataset.cardId,
            type: element.dataset.cardType,
            collapsible: element.dataset.collapsible === 'true'
        };
        
        this.init();
    }
}
```

## Loading States

### Loading Skeleton

```javascript
class ModelList {
    constructor(container) {
        this.container = container;
    }
    
    showLoading() {
        this.container.innerHTML = `
            <div class="skeleton-loader">
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
                <div class="skeleton-card"></div>
            </div>
        `;
    }
    
    showData(models) {
        this.container.innerHTML = models.map(model => `
            <div class="model-card">
                <h3>${model.name}</h3>
                <p>${model.size}</p>
            </div>
        `).join('');
    }
    
    async load() {
        this.showLoading();
        
        try {
            const models = await fetchModels();
            this.showData(models);
        } catch (error) {
            this.showError(error.message);
        }
    }
}
```

### Loading CSS

```css
.skeleton-loader {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.skeleton-card {
    height: 100px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: 8px;
}

@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
```

## Empty States

### Empty State Component

```javascript
function showEmptyState(container, options = {}) {
    const {
        icon = '📭',
        title = 'No items found',
        message = 'Try adding some items to get started',
        actionText = null,
        onAction = null
    } = options;
    
    const actionButton = actionText ? `
        <button class="btn btn--primary empty-state__action">
            ${actionText}
        </button>
    ` : '';
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state__icon">${icon}</div>
            <h3 class="empty-state__title">${title}</h3>
            <p class="empty-state__message">${message}</p>
            ${actionButton}
        </div>
    `;
    
    if (actionText && onAction) {
        const button = container.querySelector('.empty-state__action');
        button.addEventListener('click', onAction);
    }
}

// Usage
if (models.length === 0) {
    showEmptyState(container, {
        icon: '🤖',
        title: 'No models found',
        message: 'Pull a model from Ollama to get started',
        actionText: 'Pull Model',
        onAction: () => openPullDialog()
    });
}
```

## Error States

### Error Display Component

```javascript
class ErrorDisplay {
    constructor(container) {
        this.container = container;
    }
    
    show(error, options = {}) {
        const {
            retry = null,
            dismiss = true
        } = options;
        
        const element = document.createElement('div');
        element.className = 'error-display';
        
        element.innerHTML = `
            <div class="error-display__content">
                <span class="error-display__icon">⚠️</span>
                <div class="error-display__message">
                    <strong>Error</strong>
                    <p>${error.message || error}</p>
                </div>
                <div class="error-display__actions">
                    ${retry ? '<button class="btn btn--small" data-action="retry">Retry</button>' : ''}
                    ${dismiss ? '<button class="btn btn--small btn--text" data-action="dismiss">Dismiss</button>' : ''}
                </div>
            </div>
        `;
        
        // Event delegation for actions
        element.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            if (action === 'retry' && retry) {
                retry();
            } else if (action === 'dismiss') {
                this.hide();
            }
        });
        
        this.container.appendChild(element);
        this.element = element;
    }
    
    hide() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}

// Usage
const errorDisplay = new ErrorDisplay(document.getElementById('errors'));

try {
    await loadData();
} catch (error) {
    errorDisplay.show(error, {
        retry: () => loadData(),
        dismiss: true
    });
}
```

## Notifications/Toasts

### Toast Notification System

```javascript
class ToastManager {
    constructor() {
        this.container = this.createContainer();
        this.toasts = new Map();
    }
    
    createContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }
    
    show(message, options = {}) {
        const {
            type = 'info',      // info, success, warning, error
            duration = 3000,
            dismissible = true
        } = options;
        
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        
        toast.innerHTML = `
            <span class="toast__icon">${icons[type]}</span>
            <span class="toast__message">${message}</span>
            ${dismissible ? '<button class="toast__close">&times;</button>' : ''}
        `;
        
        this.container.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('toast--visible'), 10);
        
        // Dismiss button
        if (dismissible) {
            const closeBtn = toast.querySelector('.toast__close');
            closeBtn.addEventListener('click', () => this.dismiss(toast));
        }
        
        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.dismiss(toast), duration);
        }
        
        return toast;
    }
    
    dismiss(toast) {
        toast.classList.remove('toast--visible');
        setTimeout(() => toast.remove(), 300); // Match CSS transition
    }
    
    success(message, options) {
        return this.show(message, { ...options, type: 'success' });
    }
    
    error(message, options) {
        return this.show(message, { ...options, type: 'error' });
    }
    
    warning(message, options) {
        return this.show(message, { ...options, type: 'warning' });
    }
    
    info(message, options) {
        return this.show(message, { ...options, type: 'info' });
    }
}

// Singleton instance
const toast = new ToastManager();

// Usage
toast.success('Model loaded successfully');
toast.error('Failed to connect to Ollama', { duration: 5000 });
toast.warning('Model is large and may take a while');
```

### Toast CSS

```css
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.toast {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 300px;
    max-width: 400px;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
}

.toast--visible {
    opacity: 1;
    transform: translateX(0);
}

.toast--success { border-left: 4px solid #22c55e; }
.toast--error { border-left: 4px solid #ef4444; }
.toast--warning { border-left: 4px solid #f59e0b; }
.toast--info { border-left: 4px solid #3b82f6; }

.toast__close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    opacity: 0.5;
    margin-left: auto;
}

.toast__close:hover {
    opacity: 1;
}
```

## Modal/Dialog Component

### Modal Implementation

```javascript
class Modal {
    constructor() {
        this.overlay = null;
        this.modal = null;
        this.isOpen = false;
    }
    
    open(content, options = {}) {
        const {
            title = '',
            size = 'medium',     // small, medium, large
            dismissible = true,
            onClose = null
        } = options;
        
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        
        // Create modal
        this.modal = document.createElement('div');
        this.modal.className = `modal modal--${size}`;
        
        this.modal.innerHTML = `
            <div class="modal__header">
                <h2 class="modal__title">${title}</h2>
                ${dismissible ? '<button class="modal__close">&times;</button>' : ''}
            </div>
            <div class="modal__body">
                ${content}
            </div>
        `;
        
        this.overlay.appendChild(this.modal);
        document.body.appendChild(this.overlay);
        
        // Close handlers
        if (dismissible) {
            const closeBtn = this.modal.querySelector('.modal__close');
            closeBtn.addEventListener('click', () => this.close());
            
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) {
                    this.close();
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }
        
        // Animate in
        requestAnimationFrame(() => {
            this.overlay.classList.add('modal-overlay--visible');
        });
        
        this.isOpen = true;
        this.onClose = onClose;
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        if (!this.overlay) return;
        
        this.overlay.classList.remove('modal-overlay--visible');
        
        setTimeout(() => {
            this.overlay.remove();
            this.overlay = null;
            this.modal = null;
            this.isOpen = false;
            
            // Restore body scroll
            document.body.style.overflow = '';
            
            if (this.onClose) {
                this.onClose();
            }
        }, 300);
    }
}

// Usage
const modal = new Modal();

modal.open(`
    <p>Are you sure you want to delete this model?</p>
    <div class="modal__actions">
        <button class="btn btn--danger" id="confirm-delete">Delete</button>
        <button class="btn btn--secondary" id="cancel-delete">Cancel</button>
    </div>
`, {
    title: 'Confirm Deletion',
    size: 'small',
    onClose: () => console.log('Modal closed')
});

document.getElementById('confirm-delete').addEventListener('click', () => {
    deleteModel();
    modal.close();
});

document.getElementById('cancel-delete').addEventListener('click', () => {
    modal.close();
});
```

## Dynamic Content Updates

### Efficient Updates

```javascript
class ModelList {
    constructor(container) {
        this.container = container;
        this.models = [];
        this.elements = new Map(); // Track elements by ID
    }
    
    render(models) {
        this.models = models;
        
        // Clear container
        this.container.innerHTML = '';
        this.elements.clear();
        
        // Render all models
        models.forEach(model => {
            const element = this.createModelElement(model);
            this.container.appendChild(element);
            this.elements.set(model.id, element);
        });
    }
    
    createModelElement(model) {
        const element = document.createElement('div');
        element.className = 'model-card';
        element.dataset.modelId = model.id;
        
        element.innerHTML = `
            <h3>${model.name}</h3>
            <p>${model.size}</p>
            <button data-action="delete">Delete</button>
        `;
        
        return element;
    }
    
    // Update single model (efficient)
    updateModel(modelId, updates) {
        const element = this.elements.get(modelId);
        if (!element) return;
        
        // Update specific parts only
        if (updates.name) {
            element.querySelector('h3').textContent = updates.name;
        }
        if (updates.size) {
            element.querySelector('p').textContent = updates.size;
        }
    }
    
    // Add single model
    addModel(model) {
        const element = this.createModelElement(model);
        this.container.appendChild(element);
        this.elements.set(model.id, element);
        this.models.push(model);
    }
    
    // Remove single model
    removeModel(modelId) {
        const element = this.elements.get(modelId);
        if (element) {
            element.remove();
            this.elements.delete(modelId);
            this.models = this.models.filter(m => m.id !== modelId);
        }
    }
}
```

## Form Components

### Form Validation

```javascript
class Form {
    constructor(formElement) {
        this.form = formElement;
        this.fields = new Map();
        
        this.setupValidation();
    }
    
    setupValidation() {
        const inputs = this.form.querySelectorAll('[data-validate]');
        
        inputs.forEach(input => {
            const rules = input.dataset.validate.split('|');
            this.fields.set(input.name, { element: input, rules });
            
            // Validate on blur
            input.addEventListener('blur', () => {
                this.validateField(input.name);
            });
        });
        
        // Validate on submit
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateAll()) {
                this.handleSubmit();
            }
        });
    }
    
    validateField(fieldName) {
        const field = this.fields.get(fieldName);
        if (!field) return true;
        
        const { element, rules } = field;
        const value = element.value.trim();
        
        // Clear previous errors
        this.clearFieldError(element);
        
        // Run validation rules
        for (const rule of rules) {
            const [ruleName, param] = rule.split(':');
            
            if (ruleName === 'required' && !value) {
                this.showFieldError(element, 'This field is required');
                return false;
            }
            
            if (ruleName === 'min' && value.length < parseInt(param)) {
                this.showFieldError(element, `Minimum ${param} characters`);
                return false;
            }
            
            if (ruleName === 'email' && !this.isValidEmail(value)) {
                this.showFieldError(element, 'Invalid email address');
                return false;
            }
        }
        
        return true;
    }
    
    validateAll() {
        let isValid = true;
        
        this.fields.forEach((field, name) => {
            if (!this.validateField(name)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    showFieldError(element, message) {
        element.classList.add('form-field--error');
        
        const error = document.createElement('span');
        error.className = 'form-field__error';
        error.textContent = message;
        
        element.parentNode.appendChild(error);
    }
    
    clearFieldError(element) {
        element.classList.remove('form-field--error');
        
        const error = element.parentNode.querySelector('.form-field__error');
        if (error) {
            error.remove();
        }
    }
    
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    handleSubmit() {
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData);
        
        console.log('Form submitted:', data);
    }
}

// Usage
const form = new Form(document.getElementById('my-form'));
```

## Common Pitfalls

### Memory Leaks

```javascript
// ❌ BAD: Event listeners not removed
class Component {
    constructor(element) {
        element.addEventListener('click', () => this.handleClick());
    }
}

// ✅ GOOD: Store reference and remove on destroy
class Component {
    constructor(element) {
        this.element = element;
        this.handleClick = this.handleClick.bind(this);
        element.addEventListener('click', this.handleClick);
    }
    
    destroy() {
        this.element.removeEventListener('click', this.handleClick);
    }
}
```

### Recreating Elements Unnecessarily

```javascript
// ❌ BAD: Recreates entire list on every update
function updateList(items) {
    container.innerHTML = items.map(item => `
        <div>${item.name}</div>
    `).join('');
}

// ✅ GOOD: Only update changed items
function updateList(items) {
    const existing = new Map();
    container.querySelectorAll('[data-id]').forEach(el => {
        existing.set(el.dataset.id, el);
    });
    
    items.forEach(item => {
        if (existing.has(item.id)) {
            // Update existing
            const el = existing.get(item.id);
            el.querySelector('.name').textContent = item.name;
        } else {
            // Create new
            const el = createItemElement(item);
            container.appendChild(el);
        }
    });
}
```

## Loading Instructions

**When to load this context:**
- Building reusable UI components
- Implementing loading, empty, or error states
- Creating modals, toasts, or notifications
- Building form validation
- Managing dynamic content updates
- Structuring component architecture

**How to load:**
```bash
read .opencode/context/frontend/ui-component-patterns.md
```

**Also consider loading:**
- `vanilla-js-patterns.md` - For JavaScript fundamentals
- `responsive-design-patterns.md` - For responsive component styling
- `accessibility-guidelines.md` - For accessible components

## Summary

**Key Takeaways:**
- Use class or factory pattern for components
- Always provide loading, empty, and error states
- Use data attributes for component configuration
- Clean up event listeners on component destroy
- Update only changed elements for performance
- Use template literals for HTML generation
- Provide clear visual feedback for user actions
- Make components self-contained and reusable

**Goal**: Build modular, maintainable UI components that provide excellent user experience and are easy to reason about.
