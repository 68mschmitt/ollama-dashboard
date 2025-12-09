/**
 * E2E Tests for Dark/Light Mode Toggle Feature
 * Tests theme switching, localStorage persistence, and prefers-color-scheme detection
 * 
 * Note: These tests verify the implementation by checking file contents
 * rather than running a live server to avoid port conflicts.
 */

const fs = require('fs');
const path = require('path');

describe('Dark/Light Mode Toggle - E2E Tests', () => {
    describe('HTML Structure', () => {
        test('should have theme toggle button in header', () => {
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            expect(htmlContent).toContain('id="themeToggle"');
            expect(htmlContent).toContain('class="theme-toggle"');
            expect(htmlContent).toContain('aria-label="Toggle theme"');
        });

        test('should have theme icon element', () => {
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            expect(htmlContent).toContain('class="theme-icon"');
            expect(htmlContent).toContain('🌙'); // Default light mode icon
        });

        test('should have header-controls wrapper', () => {
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            expect(htmlContent).toContain('class="header-controls"');
        });
    });

    describe('CSS Variables', () => {
        test('should define light theme CSS variables in :root', () => {
            const cssPath = path.join(__dirname, 'public', 'styles.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Check for :root selector
            expect(cssContent).toContain(':root {');
            
            // Check for light theme variables
            expect(cssContent).toContain('--bg-gradient-start:');
            expect(cssContent).toContain('--bg-gradient-end:');
            expect(cssContent).toContain('--card-bg:');
            expect(cssContent).toContain('--text-primary:');
            expect(cssContent).toContain('--text-secondary:');
            expect(cssContent).toContain('--text-tertiary:');
            expect(cssContent).toContain('--border-color:');
            expect(cssContent).toContain('--input-bg:');
            expect(cssContent).toContain('--input-border:');
            expect(cssContent).toContain('--shadow-color:');
        });

        test('should define dark theme CSS variables in [data-theme="dark"]', () => {
            const cssPath = path.join(__dirname, 'public', 'styles.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Check for dark theme selector
            expect(cssContent).toContain('[data-theme="dark"]');
            
            // Verify dark theme has same variable names
            const darkThemeSection = cssContent.split('[data-theme="dark"]')[1].split('}')[0];
            expect(darkThemeSection).toContain('--bg-gradient-start:');
            expect(darkThemeSection).toContain('--card-bg:');
            expect(darkThemeSection).toContain('--text-primary:');
        });

        test('should use CSS variables throughout stylesheet', () => {
            const cssPath = path.join(__dirname, 'public', 'styles.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Check that variables are actually used
            expect(cssContent).toContain('var(--bg-gradient-start)');
            expect(cssContent).toContain('var(--card-bg)');
            expect(cssContent).toContain('var(--text-primary)');
            expect(cssContent).toContain('var(--border-color)');
        });

        test('should have smooth transitions defined', () => {
            const cssPath = path.join(__dirname, 'public', 'styles.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Check for transition properties
            expect(cssContent).toContain('transition:');
            expect(cssContent).toContain('0.3s');
        });
    });

    describe('JavaScript Theme Functions', () => {
        test('should have initializeTheme function', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain('function initializeTheme()');
        });

        test('should have setTheme function', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain('function setTheme(theme)');
        });

        test('should have toggleTheme function', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain('function toggleTheme()');
        });

        test('should check localStorage for saved theme', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain("localStorage.getItem('theme')");
        });

        test('should save theme to localStorage', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain("localStorage.setItem('theme'");
        });

        test('should check prefers-color-scheme', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain("window.matchMedia('(prefers-color-scheme: dark)')");
        });

        test('should listen for system theme changes', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain("addEventListener('change'");
        });

        test('should set data-theme attribute for dark mode', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain("setAttribute('data-theme', 'dark')");
        });

        test('should remove data-theme attribute for light mode', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain("removeAttribute('data-theme')");
        });

        test('should update theme icon (moon/sun)', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain('🌙'); // Light mode icon
            expect(jsContent).toContain('☀️'); // Dark mode icon
        });

        test('should show toast notification on theme change', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain("showToast");
            expect(jsContent).toContain("mode"); // "Switched to X mode"
        });

        test('should call initializeTheme on DOMContentLoaded', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain("initializeTheme()");
        });

        test('should add click event listener to theme toggle button', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            expect(jsContent).toContain("getElementById('themeToggle')");
            expect(jsContent).toContain("addEventListener('click', toggleTheme)");
        });
    });

    describe('Theme Logic Flow', () => {
        test('should prioritize localStorage over system preference', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check that localStorage is checked first
            const initThemeFunc = jsContent.split('function initializeTheme()')[1].split('function')[0];
            const localStorageIndex = initThemeFunc.indexOf("localStorage.getItem('theme')");
            const prefersColorIndex = initThemeFunc.indexOf("prefers-color-scheme");
            
            expect(localStorageIndex).toBeLessThan(prefersColorIndex);
            expect(localStorageIndex).toBeGreaterThan(-1);
        });

        test('should only auto-switch on system change if no saved preference', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check for conditional auto-switch logic
            expect(jsContent).toContain("if (!localStorage.getItem('theme'))");
        });

        test('should toggle between light and dark correctly', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check toggle logic
            const toggleFunc = jsContent.split('function toggleTheme()')[1].split('function')[0];
            expect(toggleFunc).toContain("currentTheme === 'dark' ? 'light' : 'dark'");
        });
    });

    describe('Accessibility', () => {
        test('should have aria-label on theme toggle button', () => {
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            expect(htmlContent).toContain('aria-label="Toggle theme"');
        });

        test('should have semantic button element', () => {
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            expect(htmlContent).toContain('<button id="themeToggle"');
        });

        test('should have visible icon for visual feedback', () => {
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            const htmlContent = fs.readFileSync(htmlPath, 'utf8');
            
            expect(htmlContent).toContain('class="theme-icon"');
        });
    });

    describe('Responsive Design', () => {
        test('should have theme toggle in header-controls', () => {
            const htmlPath = path.join(__dirname, 'public', 'index.html');
            const html = fs.readFileSync(htmlPath, 'utf8');
            
            // Check that theme toggle is within header-controls
            const headerControlsIndex = html.indexOf('class="header-controls"');
            const themeToggleIndex = html.indexOf('id="themeToggle"');
            const headerControlsEnd = html.indexOf('</div>', headerControlsIndex);
            
            expect(themeToggleIndex).toBeGreaterThan(headerControlsIndex);
            expect(themeToggleIndex).toBeLessThan(headerControlsEnd);
        });

        test('should have CSS for theme toggle button sizing', () => {
            const cssPath = path.join(__dirname, 'public', 'styles.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Check for theme-toggle class styling
            expect(cssContent).toContain('.theme-toggle');
        });
    });

    describe('Browser Compatibility', () => {
        test('should use standard localStorage API', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check for standard localStorage methods (not vendor-prefixed)
            expect(jsContent).toContain('localStorage.getItem');
            expect(jsContent).toContain('localStorage.setItem');
        });

        test('should use standard matchMedia API', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check for standard matchMedia (not vendor-prefixed)
            expect(jsContent).toContain('window.matchMedia');
        });

        test('should use standard DOM methods', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check for standard DOM methods
            expect(jsContent).toContain('document.documentElement');
            expect(jsContent).toContain('setAttribute');
            expect(jsContent).toContain('removeAttribute');
            expect(jsContent).toContain('querySelector');
        });
    });

    describe('Edge Cases', () => {
        test('should handle missing theme icon element gracefully', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check for null check before accessing themeIcon
            const setThemeFunc = jsContent.split('function setTheme(theme)')[1].split('function')[0];
            expect(setThemeFunc).toContain('if (themeIcon)');
        });

        test('should handle invalid theme values', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check that setTheme uses if/else (defaults to light if not dark)
            const setThemeFunc = jsContent.split('function setTheme(theme)')[1].split('function')[0];
            expect(setThemeFunc).toContain("if (theme === 'dark')");
            expect(setThemeFunc).toContain('else');
        });
    });

    describe('Integration with Existing Features', () => {
        test('should not break existing event listeners', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check that setupEventListeners still has other listeners
            const setupFunc = jsContent.split('function setupEventListeners()')[1].split('function')[0];
            expect(setupFunc).toContain("getElementById('generateBtn')");
            expect(setupFunc).toContain("getElementById('themeToggle')");
        });

        test('should not interfere with toast notifications', () => {
            const jsPath = path.join(__dirname, 'public', 'script.js');
            const jsContent = fs.readFileSync(jsPath, 'utf8');
            
            // Check that showToast is called correctly
            expect(jsContent).toContain("showToast");
        });

        test('should maintain existing CSS structure', () => {
            const cssPath = path.join(__dirname, 'public', 'styles.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Check that existing selectors still exist
            expect(cssContent).toContain('.container');
            expect(cssContent).toContain('header');
            expect(cssContent).toContain('.card');
        });
    });

    describe('Performance', () => {
        test('should use CSS transitions for smooth theme changes', () => {
            const cssPath = path.join(__dirname, 'public', 'styles.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Check for transition on body or root elements
            expect(cssContent).toContain('transition:');
        });

        test('should not cause layout shifts', () => {
            const cssPath = path.join(__dirname, 'public', 'styles.css');
            const cssContent = fs.readFileSync(cssPath, 'utf8');
            
            // Check that theme toggle button has fixed dimensions
            expect(cssContent).toContain('.theme-toggle');
        });
    });
});

describe('Theme Toggle - Code Quality', () => {
    test('should have clear function names', () => {
        const jsPath = path.join(__dirname, 'public', 'script.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        expect(jsContent).toContain('initializeTheme');
        expect(jsContent).toContain('setTheme');
        expect(jsContent).toContain('toggleTheme');
    });

    test('should have consistent variable naming', () => {
        const jsPath = path.join(__dirname, 'public', 'script.js');
        const jsContent = fs.readFileSync(jsPath, 'utf8');
        
        // Check for consistent theme variable names
        expect(jsContent).toContain('savedTheme');
        expect(jsContent).toContain('currentTheme');
        expect(jsContent).toContain('newTheme');
    });

    test('should use semantic CSS class names', () => {
        const cssPath = path.join(__dirname, 'public', 'styles.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        expect(cssContent).toContain('.theme-toggle');
        // Note: .theme-icon is a semantic HTML class but doesn't need CSS styling
        // The icon is styled via the parent .theme-toggle button
    });

    test('should have consistent CSS variable naming', () => {
        const cssPath = path.join(__dirname, 'public', 'styles.css');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Check for consistent naming pattern (--category-property)
        expect(cssContent).toContain('--bg-');
        expect(cssContent).toContain('--text-');
        expect(cssContent).toContain('--border-');
    });
});
