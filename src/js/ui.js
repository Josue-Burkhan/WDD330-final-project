/**
 * UI Module
 * Handles all DOM manipulations, component rendering, and UI events.
 */
import { getProjects, saveProject, deleteProject, getProject } from './storage.js';
import { renderCanvas, addSection, exportProjectAsHtml } from './editor.js';

const app = document.getElementById('app');

export function renderDashboard() {
    const projects = getProjects();
    
    app.innerHTML = `
        <header class="app-header">
            <h1>ChapterList Studio</h1>
            <div class="header-actions">
                <button id="new-project-btn" class="btn-primary">New Project</button>
            </div>
        </header>
        <main class="dashboard-container">
            <h2>My Projects</h2>
            <div id="project-list" class="project-list">
                ${projects.length > 0 ? projects.map(createProjectCard).join('') : '<p class="empty-state">No projects yet. Create one to get started!</p>'}
            </div>
        </main>
        <div id="new-project-modal" class="modal">
            <div class="modal-content">
                <h2>Create New Project</h2>
                <form id="new-project-form">
                    <label for="project-name-input">Project Name</label>
                    <input type="text" id="project-name-input" required>
                    <div class="modal-actions">
                        <button type="button" id="cancel-project-btn">Cancel</button>
                        <button type="submit">Create</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('new-project-btn').addEventListener('click', () => {
        document.getElementById('new-project-modal').style.display = 'flex';
    });
    document.getElementById('cancel-project-btn').addEventListener('click', () => {
        document.getElementById('new-project-modal').style.display = 'none';
    });
    document.getElementById('new-project-form').addEventListener('submit', handleNewProject);

    document.querySelectorAll('.project-card .edit-btn').forEach(btn => {
        btn.addEventListener('click', handleEditProject);
    });
    document.querySelectorAll('.project-card .delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteProject);
    });

    document.dispatchEvent(new CustomEvent('ui-rendered'));
}

function createProjectCard(project) {
    return `
        <div class="project-card" data-id="${project.id}">
            <h3>${project.name}</h3>
            <p>Created: ${new Date(project.created).toLocaleDateString()}</p>
            <div class="card-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        </div>
    `;
}

function handleNewProject(event) {
    event.preventDefault();
    const projectNameInput = document.getElementById('project-name-input');
    const projectName = projectNameInput.value;
    if (projectName && projectName.trim() !== '') {
        const newProject = {
            id: `proj_${Date.now()}`,
            name: projectName.trim(),
            created: new Date().toISOString(),
            sections: []
        };
        saveProject(newProject);
        renderEditor(newProject.id);
    }
}

function handleEditProject(event) {
    const projectId = event.target.closest('.project-card').dataset.id;
    renderEditor(projectId);
}

function handleDeleteProject(event) {
    event.stopPropagation(); 
    const projectId = event.target.closest('.project-card').dataset.id;
    if (confirm('Are you sure you want to delete this project?')) {
        deleteProject(projectId);
        renderDashboard();
    }
}

export function renderEditor(projectId) {
    const project = getProject(projectId);
    if (!project) {
        alert('Project not found!');
        renderDashboard();
        return;
    }

    app.innerHTML = `
        <header class="app-header editor-header">
            <button id="back-to-dash">Back to Dashboard</button>
            <span class="project-title">${project.name}</span>
            <div class="header-actions">
                <button id="export-html-btn" class="btn-secondary">Export HTML</button>
            </div>
        </header>
        <div class="editor-container">
            <aside class="editor-sidebar">
                <h3>Add Sections</h3>
                <button class="add-section-btn" data-type="hero">Hero</button>
                <button class="add-section-btn" data-type="text">Text</button>
                <button class="add-section-btn" data-type="image">Image</button>
                <button class="add-section-btn" data-type="gallery">Gallery</button>
                <button class="add-section-btn" data-type="contact">Contact</button>
                <hr>
                <div id="section-controls"></div>
            </aside>
            <main id="editor-canvas" class="editor-canvas">
                <!-- Sections will be rendered here by editor.js -->
            </main>
        </div>
    `;

    // Render the actual content
    renderCanvas(project);

    // Add event listeners
    document.getElementById('back-to-dash').addEventListener('click', renderDashboard);
    document.getElementById('export-html-btn').addEventListener('click', () => exportProjectAsHtml(project));
    
    document.querySelectorAll('.add-section-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionType = btn.dataset.type;
            addSection(project, sectionType);
        });
    });

    document.dispatchEvent(new CustomEvent('ui-rendered'));
}