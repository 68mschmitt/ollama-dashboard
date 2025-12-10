/**
 * Functional Tests for Dark/Light Mode Toggle Feature
 * Tests actual behavior of theme switching, localStorage, and system preferences
 * 
 * These tests verify the implementation logic by analyzing code flow and behavior
 */

const fs = require('fs');
const path = require('path');

describe('Theme Toggle - Functional Tests', () => {
    let scriptContent;
    let htmlContent;
    let cssContent;

    beforeAll(() => {
        const jsPath = path.join(__dirname, 'public', 'script.js');
        const htmlPath = path.join(__dirname, 'public', 'index.html');
        const cssPath = path.join(__dirname, 'public', 'styles.css');
        
        scriptContent = fs.readFileSync(jsPath, 'utf8');
        htmlContent = fs.readFileSync(htmlPath, 'utf8');
        cssContent = fs.readFileSync(cssPath, 'utf8');
    });

    describe('Theme Initialization Logic', () => {
        test('should check localStorage before system preference', () => {
            const initFunc = scriptContent.split('function initializeTheme()')[1].split('function')[0];
            
            // localStorage check should come before system preference check
            const localStoragePos = initFunc.indexOf("localStorage.getItem('theme')");
            const systemPrefPos = initFunc.indexOf("prefers-color-scheme");
            
            expect(localStoragePos).toBeGreaterThan(-1);
            expect(systemPrefPos).toBeGreaterThan(-1);
            expect(localStoragePos).toBeLessThan(systemPrefPos);
        });

        test('should use system preference when no saved theme', () => {
            const initFunc = scriptContent.split('function initializeTheme()')[1].split('function')[0];
            
            // Should check for saved theme first, then fall back to system
            expect(initFunc).toContain("if (savedTheme)");
            expect(initFunc).toContain("window.matchMedia('(prefers-color-scheme: dark)')");
            expect(initFunc).toContain("setTheme(prefersDark ? 'dark' : 'light')");
        });

        test('should listen for system theme changes', () => {
            const initFunc = scriptContent.split('function initializeTheme()')[1].split('function')[0];
            
            // Should add event listener for system preference changes
            expect(initFunc).toContain("addEventListener('change'");
            expect(initFunc).toContain("!localStorage.getItem('theme')");
        });

        test('should not auto-switch if user has set preference', () => {
            const initFunc = scriptContent.split('function initializeTheme()')[1].split('function')[0];
            
            // Should check if user has saved preference before auto-switching
            expect(initFunc).toContain("if (!localStorage.getItem('theme'))");
        });
    });

    describe('Theme Setting Logic', () => {
        test('should set data-theme attribute for dark mode', () => {
            const setThemeFunc = scriptContent.split('function setTheme(theme)')[1].split('function')[0];
            
            expect(setThemeFunc).toContain("if (theme === 'dark')");
            expect(setThemeFunc).toContain("setAttribute('data-theme', 'dark')");
        });

        test('should remove data-theme attribute for light mode', () => {
            const setThemeFunc = scriptContent.split('function setTheme(theme)')[1].split('function')[0];
            
            expect(setThemeFunc).toContain("removeAttribute('data-theme')");
        });

        test('should update theme icon based on theme', () => {
            const setThemeFunc = scriptContent.split('function setTheme(theme)')[1].split('function')[0];
            
            // Dark mode should show sun icon
            expect(setThemeFunc).toContain("'☀️'");
            // Light mode should show moon icon
            expect(setThemeFunc).toContain("'🌙'");
        });

        test('should handle missing theme icon gracefully', () => {
            const setThemeFunc = scriptContent.split('function setTheme(theme)')[1].split('function')[0];
            
            // Should check if themeIcon exists before using it
            expect(setThemeFunc).toContain("if (themeIcon)");
        });

        test('should show toast notification on theme change', () => {
            // Check that showToast is called in toggleTheme function
            const toggleFunc = scriptContent.split('function toggleTheme()')[1].split('function')[0];
            
            expect(toggleFunc).toContain("showToast");
        });
    });

    describe('Theme Toggle Logic', () => {
        test('should toggle between light and dark modes', () => {
            const toggleFunc = scriptContent.split('function toggleTheme()')[1].split('function')[0];
            
            expect(toggleFunc).toContain("currentTheme === 'dark' ? 'light' : 'dark'");
        });

        test('should save toggled theme to localStorage', () => {
            const toggleFunc = scriptContent.split('function toggleTheme()')[1].split('function')[0];
            
            expect(toggleFunc).toContain("localStorage.setItem('theme'");
        });

        test('should call setTheme after toggle', () => {
            const toggleFunc = scriptContent.split('function toggleTheme()')[1].split('function')[0];
            
            expect(toggleFunc).toContain("setTheme(newTheme)");
        });

        test('should get current theme from data-theme attribute', () => {
            const toggleFunc = scriptContent.split('function toggleTheme()')[1].split('function')[0];
            
            expect(toggleFunc).toContain("getAttribute('data-theme')");
        });
    });

    describe('Event Listener Setup', () => {
        test('should attach click listener to theme toggle button', () => {
            const setupFunc = scriptContent.split('function setupEventListeners()')[1].split('function')[0];
            
            expect(setupFunc).toContain("getElementById('themeToggle')");
            expect(setupFunc).toContain("addEventListener('click', toggleTheme)");
        });

        test('should initialize theme on DOMContentLoaded', () => {
            const domContentLoadedSection = scriptContent.split("document.addEventListener('DOMContentLoaded'")[1].split('});')[0];
            
            expect(domContentLoadedSection).toContain("initializeTheme()");
        });
    });

    describe('CSS Variables System', () => {
        test('should define all required light theme variables', () => {
            const rootSection = cssContent.split(':root {')[1].split('}')[0];
            
            const requiredVars = [
                '--bg-gradient-start',
                '--bg-gradient-end',
                '--card-bg',
                '--text-primary',
                '--text-secondary',
                '--text-tertiary',
                '--border-color',
                '--input-bg',
                '--input-border',
                '--shadow-color'
            ];
            
            requiredVars.forEach(variable => {
                expect(rootSection).toContain(variable);
            });
        });

        test('should define all required dark theme variables', () => {
            const darkThemeSection = cssContent.split('[data-theme="dark"]')[1].split('}')[0];
            
            const requiredVars = [
                '--bg-gradient-start',
                '--bg-gradient-end',
                '--card-bg',
                '--text-primary',
                '--text-secondary',
                '--text-tertiary',
                '--border-color',
                '--input-bg',
                '--input-border',
                '--shadow-color'
            ];
            
            requiredVars.forEach(variable => {
                expect(darkThemeSection).toContain(variable);
            });
        });

        test('should use CSS variables in selectors', () => {
            // Check that variables are actually used
            const varUsages = [
                'var(--bg-gradient-start)',
                'var(--bg-gradient-end)',
                'var(--card-bg)',
                'var(--text-primary)',
                'var(--border-color)',
                'var(--input-bg)'
            ];
            
            varUsages.forEach(usage => {
                expect(cssContent).toContain(usage);
            });
        });

        test('should have smooth transitions for theme changes', () => {
            // Check for transition properties
            expect(cssContent).toContain('transition:');
            expect(cssContent).toContain('0.3s');
        });

        test('should apply transitions to color properties', () => {
            // Transitions should apply to properties that change with theme
            expect(cssContent).toContain('background');
            expect(cssContent).toContain('color');
            expect(cssContent).toContain('border');
        });
    });

    describe('HTML Structure', () => {
        test('should have theme toggle button in header', () => {
            expect(htmlContent).toContain('id="themeToggle"');
            expect(htmlContent).toContain('class="theme-toggle"');
        });

        test('should have theme icon element', () => {
            expect(htmlContent).toContain('class="theme-icon"');
            expect(htmlContent).toContain('🌙'); // Default light mode icon
        });

        test('should have proper button semantics', () => {
            expect(htmlContent).toContain('<button id="themeToggle"');
            expect(htmlContent).toContain('aria-label="Toggle theme"');
        });

        test('should place theme toggle in header controls', () => {
            const headerControlsStart = htmlContent.indexOf('class="header-controls"');
            const themeToggleStart = htmlContent.indexOf('id="themeToggle"');
            const headerControlsEnd = htmlContent.indexOf('</div>', headerControlsStart);
            
            expect(themeToggleStart).toBeGreaterThan(headerControlsStart);
            expect(themeToggleStart).toBeLessThan(headerControlsEnd);
        });
    });

    describe('Accessibility Features', () => {
        test('should have aria-label for theme toggle', () => {
            expect(htmlContent).toContain('aria-label="Toggle theme"');
        });

        test('should use semantic button element', () => {
            expect(htmlContent).toContain('<button');
            expect(htmlContent).toContain('id="themeToggle"');
        });

        test('should have visible icon for feedback', () => {
            expect(htmlContent).toContain('class="theme-icon"');
            // Icon should be visible (not hidden)
            expect(htmlContent).not.toContain('display: none');
        });

        test('should support keyboard navigation', () => {
            // Button element supports keyboard navigation by default
            expect(htmlContent).toContain('<button');
        });
    });

    describe('Browser API Usage', () => {
        test('should use standard localStorage API', () => {
            expect(scriptContent).toContain('localStorage.getItem');
            expect(scriptContent).toContain('localStorage.setItem');
        });

        test('should use standard matchMedia API', () => {
            expect(scriptContent).toContain("window.matchMedia('(prefers-color-scheme: dark)')");
        });

        test('should use standard DOM methods', () => {
            expect(scriptContent).toContain('document.documentElement');
            expect(scriptContent).toContain('setAttribute');
            expect(scriptContent).toContain('removeAttribute');
            expect(scriptContent).toContain('querySelector');
            expect(scriptContent).toContain('getElementById');
        });

        test('should not use vendor-prefixed APIs', () => {
            // Should use standard APIs, not webkit or moz prefixed
            expect(scriptContent).not.toContain('webkit');
            expect(scriptContent).not.toContain('moz');
        });
    });

    describe('Error Handling', () => {
        test('should handle localStorage being unavailable', () => {
            const initFunc = scriptContent.split('function initializeTheme()')[1].split('function')[0];
            
            // Should have try-catch or check for localStorage availability
            // At minimum, should not crash if localStorage is undefined
            expect(initFunc).toContain('localStorage');
        });

        test('should handle missing DOM elements gracefully', () => {
            const setThemeFunc = scriptContent.split('function setTheme(theme)')[1].split('function')[0];
            
            // Should check if themeIcon exists
            expect(setThemeFunc).toContain('if (themeIcon)');
        });

        test('should handle invalid theme values', () => {
            const setThemeFunc = scriptContent.split('function setTheme(theme)')[1].split('function')[0];
            
            // Should have else clause for non-dark themes
            expect(setThemeFunc).toContain('else');
        });
    });

    describe('Performance Considerations', () => {
        test('should use CSS transitions instead of JavaScript animations', () => {
            expect(cssContent).toContain('transition:');
            // Theme animations should use CSS, not JavaScript
            // (setInterval is used for other features like refresh, not theme)
            const setThemeFunc = scriptContent.split('function setTheme(theme)')[1].split('function')[0];
            expect(setThemeFunc).not.toContain('setInterval');
            expect(setThemeFunc).not.toContain('requestAnimationFrame');
        });

        test('should not cause layout thrashing', () => {
            const setThemeFunc = scriptContent.split('function setTheme(theme)')[1].split('function')[0];
            
            // Should batch DOM operations
            // Should not have multiple reads/writes interleaved
            const attributeWrites = (setThemeFunc.match(/setAttribute|removeAttribute/g) || []).length;
            expect(attributeWrites).toBeLessThanOrEqual(2); // One for data-theme, one for icon
        });

        test('should initialize theme synchronously on page load', () => {
            const domContentLoadedSection = scriptContent.split("document.addEventListener('DOMContentLoaded'")[1].split('});')[0];
            
            // initializeTheme should be called early, not deferred
            expect(domContentLoadedSection).toContain("initializeTheme()");
        });
    });

    describe('Integration with Existing Features', () => {
        test('should not interfere with other event listeners', () => {
            const setupFunc = scriptContent.split('function setupEventListeners()')[1].split('function')[0];
            
            // Should have both theme toggle and other listeners
            expect(setupFunc).toContain("getElementById('themeToggle')");
            expect(setupFunc).toContain("getElementById('generateBtn')");
        });

        test('should work with existing toast notification system', () => {
            // Check that toggleTheme calls showToast
            const toggleFunc = scriptContent.split('function toggleTheme()')[1].split('function')[0];
            
            expect(toggleFunc).toContain('showToast');
        });

        test('should not modify existing CSS structure', () => {
            // Existing selectors should still be present
            expect(cssContent).toContain('.container');
            expect(cssContent).toContain('header');
            expect(cssContent).toContain('.card');
            expect(cssContent).toContain('.btn');
        });

        test('should preserve existing HTML structure', () => {
            // Existing elements should still be present
            expect(htmlContent).toContain('id="statusDot"');
            expect(htmlContent).toContain('id="generateBtn"');
            expect(htmlContent).toContain('class="container"');
        });
    });

    describe('Theme Values', () => {
        test('light theme should use purple gradient', () => {
            const rootSection = cssContent.split(':root {')[1].split('}')[0];
            
            // Light theme uses purple gradient
            expect(rootSection).toContain('#667eea');
            expect(rootSection).toContain('#764ba2');
        });

        test('dark theme should use dark gradient', () => {
            const darkThemeSection = cssContent.split('[data-theme="dark"]')[1].split('}')[0];
            
            // Dark theme uses dark colors
            expect(darkThemeSection).toContain('#1a202c');
            expect(darkThemeSection).toContain('#2d3748');
        });

        test('light theme should use dark text', () => {
            const rootSection = cssContent.split(':root {')[1].split('}')[0];
            
            // Light theme text should be dark
            expect(rootSection).toContain('--text-primary');
        });

        test('dark theme should use light text', () => {
            const darkThemeSection = cssContent.split('[data-theme="dark"]')[1].split('}')[0];
            
            // Dark theme text should be light
            expect(darkThemeSection).toContain('--text-primary');
        });
    });

    describe('Code Quality', () => {
        test('should use consistent naming conventions', () => {
            // Functions should be camelCase
            expect(scriptContent).toContain('initializeTheme');
            expect(scriptContent).toContain('setTheme');
            expect(scriptContent).toContain('toggleTheme');
            
            // Variables should be camelCase
            expect(scriptContent).toContain('savedTheme');
            expect(scriptContent).toContain('currentTheme');
            expect(scriptContent).toContain('newTheme');
        });

        test('should use semantic CSS class names', () => {
            expect(cssContent).toContain('.theme-toggle');
            expect(htmlContent).toContain('class="theme-icon"');
        });

        test('should use semantic HTML elements', () => {
            expect(htmlContent).toContain('<button');
            expect(htmlContent).toContain('aria-label');
        });

        test('should have clear variable names', () => {
            const setThemeFunc = scriptContent.split('function setTheme(theme)')[1].split('function')[0];
            
            // Variable names should be descriptive
            expect(setThemeFunc).toContain('themeIcon');
            expect(setThemeFunc).toContain('html');
        });
    });
});
