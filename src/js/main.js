/**
 * Main application entry point.
 * Initializes the app and renders the initial view.
 */
import '../css/style.css';
import { renderDashboard } from './ui.js';
import { getTheme } from './storage.js';

function init() {
    // Set initial theme class on body
    document.body.classList.add(getTheme());

    // Render initial view
    renderDashboard();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);