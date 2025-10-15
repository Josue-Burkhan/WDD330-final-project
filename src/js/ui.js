import { getStories, saveStory, deleteStory, getStory, createNewVolume } from './storage.js';
import { fetchGoogleFonts } from './api.js';
import { darkenColor, debounce } from './utils.js';
import { fetchColorPalette } from './palette-picker.js';

const app = document.getElementById('app');
let currentStory = null;
let activeVolumeIndex = 0;
let googleFonts = [];

// --- FONT MANAGEMENT ---
function loadGoogleFont(fontFamily) {
    if (!fontFamily || fontFamily === 'serif' || fontFamily === 'sans-serif') return;
    const fontId = `font-link-${fontFamily.replace(/\s+/g, '-')}`;
    if (document.getElementById(fontId)) return;

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@400;700&display=swap`;
    document.head.appendChild(link);
}

function updateColorPalette(palette) {
    const styleId = 'color-palette-style';
    let styleElement = document.getElementById(styleId);
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
    }

    let cssVariables = `:root {
`;
    if (palette) {
        for (const shade in palette) {
            if (Object.hasOwnProperty.call(palette, shade)) {
                cssVariables += `    --accent-${shade}: ${palette[shade]};
`;
            }
        }
    }
    cssVariables += `}
`;

    styleElement.innerHTML = cssVariables;
}

// --- DASHBOARD ---
export function renderDashboard() {
    const stories = getStories();
    app.innerHTML = `
        <div class="app-header"><h1>ChapterList Studio</h1><button id="new-story-btn" class="btn-primary">+ New Story</button></div>
        <main class="dashboard-container">
            <h2 class="first-title">My Stories</h2>
            <div class="project-list">${stories.length > 0 ? stories.map((story, index) => createStoryCard(story, index)).join('') : '<p class="empty-state">No stories yet.</p>'}</div>
        </main>
        <div id="new-story-modal" class="modal">
            <div class="modal-content">
                <h2>Create New Story</h2>
                <form id="new-story-form">
                    <input type="text" id="story-name-input" placeholder="Enter your story title..." required>
                    <div class="modal-actions"><button type="button" class="btn-secondary" id="cancel-story-btn">Cancel</button><button type="submit" class="btn-primary">Create</button></div>
                </form>
            </div>
        </div>
    `;
    addDashboardEventListeners();
}

function createStoryCard(story, index) {
    return `<div class="project-card" data-id="${story.id}" style="animation-delay: ${index * 75}ms"><h3>${story.name}</h3><p>Volumes: ${story.volumes.length}</p><div class="card-actions"><button class="edit-btn">Edit</button><button class="delete-btn">Delete</button></div></div>`;
}

function addDashboardEventListeners() {
    const modal = document.getElementById('new-story-modal');
    app.addEventListener('click', e => {
        if (e.target.id === 'new-story-btn') {
            modal.classList.add('show');
        } else if (e.target.id === 'cancel-story-btn') {
            modal.classList.remove('show');
        } else if (e.target.classList.contains('edit-btn')) {
            renderEditor(e.target.closest('.project-card').dataset.id);
        } else if (e.target.classList.contains('delete-btn')) {
            const storyId = e.target.closest('.project-card').dataset.id;
            if (confirm('Delete this story?')) { 
                deleteStory(storyId); 
                renderDashboard(); 
            }
        }
    });

    app.addEventListener('submit', e => {
        if (e.target.id === 'new-story-form') {
            e.preventDefault();
            const storyName = document.getElementById('story-name-input').value;
            if (storyName.trim()) {
                const newStory = { id: `story_${Date.now()}`, name: storyName.trim(), created: new Date().toISOString() };
                saveStory(newStory);
                renderEditor(newStory.id);
            }
        }
    });
}

// --- EDITOR ---

export async function renderEditor(storyId) {
    try {
        currentStory = getStory(storyId);
        if (!currentStory) { renderDashboard(); return; }
        activeVolumeIndex = 0;
        if (googleFonts.length === 0) { 
            googleFonts = await fetchGoogleFonts(); 
        }

        app.innerHTML = `
            <div class="app-header">
                <button id="toggle-sidebar-btn" class="burger-btn">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <h1>ChapterList Studio</h1>
                <div class="header-actions">
                    <button id="back-to-dash" class="btn-primary">Dashboard</button>
                    <button id="preview-btn" class="btn-primary">Preview</button>
                </div>
            </div>
            <div class="editor-container"><aside id="style-sidebar"></aside><main id="editor-canvas"></main></div>
        `;

        renderEditorContent();
        addEditorEventListeners();
    } catch (error) {
        console.error("Failed to render editor:", error);
        app.innerHTML = `<p>Error loading editor. Please try again.</p>`;
    }
}

function renderEditorContent() {
    renderStyleSidebar();
    renderLivePreview();
}

function addEditorEventListeners() {
    const debouncedInputHandler = debounce(handleSidebarInput, 500);
    app.addEventListener('click', handleAppClick);
    app.addEventListener('input', debouncedInputHandler);
    app.addEventListener('change', handleSidebarChange);
}

function handleAppClick(e) {
    const target = e.target;
    if (target.id === 'back-to-dash') {
        renderDashboard();
    } else if (target.id === 'preview-btn') {
        togglePreviewMode();
    } else if (target.matches('.volume-list li[data-index]')) {
        const newIndex = parseInt(e.target.dataset.index, 10);
        if (newIndex !== activeVolumeIndex) {
            activeVolumeIndex = newIndex;
            renderEditorContent();
        }
    } else if (target.id === 'add-volume-btn') {
        handleAddVolume();
    } else if (target.id === 'toggle-sidebar-btn' || target.closest('#toggle-sidebar-btn')) {
        document.getElementById('style-sidebar').classList.toggle('sidebar-open');
    } else if (target.id === 'toggle-nav-btn' || target.closest('#toggle-nav-btn')) {
        document.querySelector('.header-nav').classList.toggle('nav-open');
    }
}

async function handleSidebarInput(e) {
    const target = e.target;
    const id = target.id;
    const prop = target.dataset.styleProp;
    const value = target.value;

    if (id === 'story-title') {
        updateStoryDetails('name', value);
    } else if (id === 'story-synopsis') {
        updateStoryDetails('synopsis', value);
    } else if (id === 'story-hero-image-url') {
        updateVolumeStyle('heroImage', value);
    } else if (prop) {
        updateVolumeStyle(prop, value);
        if (prop === 'font') {
            loadGoogleFont(value);
        }
    }
}

async function handleSidebarChange(e) {
    const target = e.target;
    const id = target.id;
    const value = target.value;

    if (id === 'story-hero-image-upload') {
        const file = e.target.files[0];
        if (file) { 
            const reader = new FileReader(); 
            reader.onload = (ev) => updateVolumeStyle('heroImage', ev.target.result);
            reader.readAsDataURL(file); 
        }
    } else if (id === 'palette-color-picker') {
        const palette = await fetchColorPalette(value);
        if (palette) {
            updateVolumeStyle('palette', palette);
            updateVolumeStyle('accentColor', palette['500']);
        }
    }
}


function renderStyleSidebar() {
    const sidebar = document.getElementById('style-sidebar');
    const activeVolume = currentStory.volumes[activeVolumeIndex];

    const fontOptions = googleFonts.map(font => `<option value="${font.family}" ${activeVolume?.style.font === font.family ? 'selected' : ''}>${font.family}</option>`).join('');

    sidebar.innerHTML = `
        <h3>Story Details</h3>
        <div class="style-group"><label>Title</label><input type="text" id="story-title" value="${currentStory.name}"></div>
        <div class="style-group"><label>Synopsis</label><textarea id="story-synopsis" rows="5">${currentStory.synopsis}</textarea></div>
        
        <h3>Hero Image</h3>
        <div class="style-group">
            <label>Image URL</label><input type="text" id="story-hero-image-url" value="${activeVolume.style.heroImage}">
            <label for="story-hero-image-upload" class="btn-secondary" style="display:block;text-align:center;margin:0.5rem 0;">Upload</label>
            <input type="file" id="story-hero-image-upload" accept="image/*" style="display:none;">
        </div>

        <h3>Color Palette</h3>
        <div class="style-group">
            <label>Base Color</label>
            <div class="color-input-wrapper">
                <div class="color-input-swatch" style="background-color:${activeVolume.style.accentColor};"></div>
                <input type="color" id="palette-color-picker" value="${activeVolume.style.accentColor}">
            </div>
        </div>

        ${activeVolume ? `
            <div class="style-group"><label>Text</label><div class="color-input-wrapper"><div class="color-input-swatch" style="background-color:${activeVolume.style.textColor};"></div><input type="color" data-style-prop="textColor" value="${activeVolume.style.textColor}"></div></div>
            <div class="style-group"><label>Background</label><div class="color-input-wrapper"><div class="color-input-swatch" style="background-color:${activeVolume.style.backgroundColor};"></div><input type="color" data-style-prop="backgroundColor" value="${activeVolume.style.backgroundColor}"></div></div>
            <div class="style-group"><label>Font</label><select data-style-prop="font"><option value="serif">Serif (default)</option><option value="sans-serif">Sans-Serif (default)</option>${fontOptions}</select></div>
        ` : ''}
    `;
}

function updateStoryDetails(property, value) {
    currentStory[property] = value;
    saveStory(currentStory);
    renderLivePreview();
}

function updateVolumeStyle(property, value) {
    if (currentStory.isGlobalEdit) {
        currentStory.volumes.forEach(volume => {
            volume.style[property] = value;
        });
        currentStory.isGlobalEdit = false;
    } else {
        currentStory.volumes[activeVolumeIndex].style[property] = value;
    }
    saveStory(currentStory);
    renderEditorContent();
}

function renderLivePreview() {
    const canvas = document.getElementById('editor-canvas');
    const activeVolume = currentStory.volumes[activeVolumeIndex];

    if (!activeVolume) {
        canvas.innerHTML = `<div style="padding:2rem;">This story has no volumes. <button id="add-first-volume-btn" class="btn-primary">Add one</button></div>`;
        document.getElementById('add-first-volume-btn').addEventListener('click', handleAddVolume);
        return;
    }

    loadGoogleFont(activeVolume.style.font);

    const palette = activeVolume.style.palette;
    updateColorPalette(palette);

    const accentColor = palette && palette['500'] ? palette['500'] : activeVolume.style.accentColor;
    const accentHoverColor = palette && palette['700'] ? palette['700'] : darkenColor(activeVolume.style.accentColor, 15);

    document.body.style.setProperty('--bg-color', activeVolume.style.backgroundColor);
    document.body.style.setProperty('--surface-color-dark', darkenColor(activeVolume.style.backgroundColor, 10));
    document.body.style.setProperty('--text-color', activeVolume.style.textColor);
    document.body.style.setProperty('--accent-color', accentColor);
    document.body.style.setProperty('--accent-hover', accentHoverColor);
    document.body.style.setProperty('--font-body', `'${activeVolume.style.font}', sans-serif`);

    canvas.innerHTML = `
      <div id="page-preview-wrapper">
        <header class="page-header">
            <div class="header-logo">ChapterList Studio</div>
            <nav class="header-nav">
                <a href="#">Home</a><a href="#">Novels</a><a href="#">Wiki</a><a href="#">W.F. Writers</a>
            </nav>
            <div class="header-actions">
                <button class="btn">Login</button>
            </div>
        </header>

        <section class="hero-section" style="background-image: url('${activeVolume.style.heroImage}');">
            <div class="hero-content">
                <h1>${currentStory.name}</h1>
                <p>${currentStory.synopsis}</p>
                <a href="#" class="btn">Read the last chapter</a>
            </div>
        </section>

        <main class="content-section">
            <aside class="volumes-column">
                <h2>Volumes</h2>
                <ul class="volume-list">
                    ${currentStory.volumes.map((vol, index) => 
                        `<li class="${index === activeVolumeIndex ? 'active' : ''}" data-index="${index}">${vol.name}</li>`
                    ).join('')}
                    <li><button id="add-volume-btn" class="btn-secondary">+ Add Volume</button></li>
                </ul>
            </aside>
            <div class="chapters-column">
                <h2>Chapters</h2>
                <ul class="chapter-list">
                    ${activeVolume.chapters.map(ch => `<li>${ch.title}</li>`).join('')}
                </ul>
            </div>
        </main>

        <footer class="rating-section">
            <div class="rating-stars">★★★★★</div>
            <p>5.0</p>
            <h3>Comments</h3>
            <p>(Comment section placeholder)</p>
        </footer>
      </div>
    `;
}

function handleAddVolume() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    // Add 'show' class to make it visible and trigger animation
    modal.classList.add('show');
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Create New Volume</h2>
            <form id="new-volume-form">
                <input type="text" id="volume-name-input" placeholder="Enter volume name..." required value="Volume ${currentStory.volumes.length + 1}">
                <div class="modal-actions">
                    <button type="button" class="btn-secondary" id="cancel-volume-btn">Cancel</button>
                    <button type="submit" class="btn-primary">Create</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cancel-volume-btn').onclick = () => modal.remove();

    document.getElementById('new-volume-form').onsubmit = e => {
        e.preventDefault();
        const volumeName = document.getElementById('volume-name-input').value.trim();
        if (!volumeName) return;
        
        const story = getStory(currentStory.id);
        story.volumes.push(createNewVolume(volumeName));
        activeVolumeIndex = story.volumes.length - 1;
        saveStory(story);
        currentStory = story;
        renderEditorContent();
        modal.remove();
    };
}


function togglePreviewMode() {
    const isPreview = document.body.classList.toggle('preview-mode');
    const exitButton = document.getElementById('preview-exit-btn');
    if (isPreview && !exitButton) {
        const button = document.createElement('button');
        button.id = 'preview-exit-btn';
        button.className = 'preview-exit-btn';
        button.innerText = 'Exit Preview';
        button.onclick = togglePreviewMode;
        document.body.appendChild(button);
    } else if (!isPreview && exitButton) {
        exitButton.remove();
    }
}
