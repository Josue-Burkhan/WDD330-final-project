/**
 * Main application entry point.
 * Initializes the app, handles theme, and renders the initial view.
 */
import { renderDashboard } from './ui.js';
import { getTheme, saveTheme } from './storage.js';

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    // Set initial state
    themeToggle.checked = getTheme() === 'light-mode';

    themeToggle.addEventListener('change', () => {
        const newTheme = themeToggle.checked ? 'light-mode' : 'dark-mode';
        document.body.classList.remove('light-mode', 'dark-mode');
        document.body.classList.add(newTheme);
        saveTheme(newTheme);
    });
}

function init() {
    // Set initial theme class on body
    document.body.classList.add(getTheme());

    // Render initial view
    renderDashboard();
    
    // Set up the theme toggle after the view is rendered
    setupThemeToggle();
}

// Re-initialize theme toggle when UI changes
document.addEventListener('ui-rendered', setupThemeToggle);

// Initialize the application
document.addEventListener('DOMContentLoaded', init);
