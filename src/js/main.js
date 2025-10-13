/**
 * Main application entry point.
 * Initializes the app, handles theme, and renders the initial view.
 */
import { renderDashboard } from './ui.js';
import { getTheme, saveTheme } from './storage.js';

function createPersistentThemeToggle() {
    const themeSwitcher = document.createElement('div');
    themeSwitcher.className = 'theme-switcher-fixed';
    themeSwitcher.innerHTML = `
        <input type="checkbox" id="theme-toggle">
        <label for="theme-toggle">Toggle Theme</label>
    `;
    document.body.appendChild(themeSwitcher);
}

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

    // Create the persistent theme toggle
    createPersistentThemeToggle();

    // Render initial view
    renderDashboard();
    
    // Set up the theme toggle
    setupThemeToggle();
}



// Initialize the application
document.addEventListener('DOMContentLoaded', init);
