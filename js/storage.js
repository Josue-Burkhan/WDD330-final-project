/**
 * Storage Module
 * Manages all interactions with localStorage.
 */

const PROJECTS_KEY = 'webcraft_projects';
const THEME_KEY = 'webcraft_theme';

// --- Project Management ---

export function getProjects() {
    return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || [];
}

export function getProject(id) {
    const projects = getProjects();
    return projects.find(p => p.id === id);
}

export function saveProject(projectData) {
    const projects = getProjects();
    const existingIndex = projects.findIndex(p => p.id === projectData.id);

    if (existingIndex > -1) {
        // Update existing project
        projects[existingIndex] = projectData;
    } else {
        // Add new project
        projects.push(projectData);
    }
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function deleteProject(id) {
    let projects = getProjects();
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}


// --- Theme Management ---

export function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark-mode'; // Default to dark mode
}

export function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}
