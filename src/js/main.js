
import '../css/style.css';
import { renderDashboard } from './ui.js';
import { getTheme } from './storage.js';

function init() {
    document.body.classList.add(getTheme());

    renderDashboard();
}

document.addEventListener('DOMContentLoaded', init);