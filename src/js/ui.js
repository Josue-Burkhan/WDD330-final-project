import { getStories, saveStory, deleteStory, getStory, createNewVolume } from './storage.js';
import { fetchUnsplashImages, fetchGoogleFonts } from './api.js';
import { darkenColor } from './utils.js';
import { fetchColorPalette } from './palette-picker.js';

const app = document.getElementById('app');
let currentStory = null;
let activeVolumeIndex = 0;
let googleFonts = [];

// --- FONT MANAGEMENT ---
function loadGoogleFont(fontFamily) {
    if (!fontFamily || fontFamily === 'serif' || fontFamily === 'sans-serif') return;
    const fontId = `font-link-${fontFamily.replace(/\s+/g, '-')}`;
    if (document.getElementById(fontId)) return; // Already loaded

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
            <div class="project-list">${stories.length > 0 ? stories.map(createStoryCard).join('') : '<p class="empty-state">No stories yet.</p>'}</div>
        </main>
        <div id="new-story-modal" class="modal" style="display: none;">
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

function createStoryCard(story) {
    return `<div class="project-card" data-id="${story.id}"><h3>${story.name}</h3><p>Volumes: ${story.volumes.length}</p><div class="card-actions"><button class="edit-btn">Edit</button><button class="delete-btn">Delete</button></div></div>`;
}

function addDashboardEventListeners() {
    document.getElementById('new-story-btn').addEventListener('click', () => { document.getElementById('new-story-modal').style.display = 'flex'; });
    document.getElementById('cancel-story-btn').addEventListener('click', () => { document.getElementById('new-story-modal').style.display = 'none'; });
    document.getElementById('new-story-form').addEventListener('submit', e => {
        e.preventDefault();
        const storyName = document.getElementById('story-name-input').value;
        if (storyName.trim()) {
            const newStory = { id: `story_${Date.now()}`, name: storyName.trim(), created: new Date().toISOString() };
            saveStory(newStory);
            renderEditor(newStory.id);
        }
    });
    document.querySelectorAll('.edit-btn').forEach(btn => { btn.addEventListener('click', e => renderEditor(e.target.closest('.project-card').dataset.id)); });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const storyId = e.target.closest('.project-card').dataset.id;
            if (confirm('Delete this story?')) { deleteStory(storyId); renderDashboard(); }
        });
    });
}

// --- EDITOR ---

export async function renderEditor(storyId) {
    try {
        currentStory = getStory(storyId);
        if (!currentStory) { renderDashboard(); return; }
        activeVolumeIndex = 0;
        if (googleFonts.length === 0) { googleFonts = await fetchGoogleFonts(); }

        app.innerHTML = `
            <div class="app-header"><button id="back-to-dash">Dashboard</button><div class="header-actions"><button id="preview-btn">Preview</button></div></div>
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
    document.getElementById('back-to-dash').addEventListener('click', renderDashboard);
    document.getElementById('preview-btn').addEventListener('click', togglePreviewMode);
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
            <label>Image URL</label><input type="text" id="story-hero-image-url" value="${currentStory.heroImage}">
            <label for="story-hero-image-upload" class="btn-secondary" style="display:block;text-align:center;margin:0.5rem 0;">Upload</label>
            <input type="file" id="story-hero-image-upload" accept="image/*" style="display:none;">
        </div>
        <div class="style-group">
            <label>Search Unsplash</label>
            <div style="display:flex;gap:0.5rem;"><input type="text" id="unsplash-query"><button id="unsplash-search-btn" class="btn-primary">Go</button></div>
            <div id="unsplash-results" style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:1rem;max-height:200px;overflow-y:auto;"></div>
        </div>

        <hr>
        <h3>Color Palette</h3>
        <div class="style-group">
            <label>Base Color</label>
            <div class="color-input-wrapper">
                <div class="color-input-swatch" style="background-color:${activeVolume.style.accentColor};"></div>
                <input type="color" id="palette-color-picker" value="${activeVolume.style.accentColor}">
            </div>
        </div>

        ${activeVolume ? `
            <hr>
            <h3>Volume Styles (${activeVolume.name})</h3>
            <div class="style-group"><label>Background</label><div class="color-input-wrapper"><div class="color-input-swatch" style="background-color:${activeVolume.style.backgroundColor};"></div><input type="color" data-style-prop="backgroundColor" value="${activeVolume.style.backgroundColor}"></div></div>
            <div class="style-group"><label>Text</label><div class="color-input-wrapper"><div class="color-input-swatch" style="background-color:${activeVolume.style.textColor};"></div><input type="color" data-style-prop="textColor" value="${activeVolume.style.textColor}"></div></div>
            <div class="style-group"><label>Font</label><select data-style-prop="font"><option value="serif">Serif (default)</option><option value="sans-serif">Sans-Serif (default)</option>${fontOptions}</select></div>
        ` : ''}
    `;
    addSidebarEventListeners();
}

function addSidebarEventListeners() {
    // Story
    document.getElementById('story-title').addEventListener('input', e => updateStory('name', e.target.value));
    document.getElementById('story-synopsis').addEventListener('input', e => updateStory('synopsis', e.target.value));
    document.getElementById('story-hero-image-url').addEventListener('input', e => updateStory('heroImage', e.target.value));
    document.getElementById('story-hero-image-upload').addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) { const reader = new FileReader(); reader.onload = (ev) => updateStory('heroImage', ev.target.result); reader.readAsDataURL(file); }
    });

    // Unsplash
    document.getElementById('unsplash-search-btn').addEventListener('click', async () => {
        const query = document.getElementById('unsplash-query').value;
        const resultsContainer = document.getElementById('unsplash-results');
        resultsContainer.innerHTML = 'Loading...';
        const images = await fetchUnsplashImages(query);
        resultsContainer.innerHTML = images.map(img => `<img src="${img.urls.thumb}" data-full-url="${img.urls.regular}" style="width:100%;cursor:pointer;">`).join('');
        resultsContainer.querySelectorAll('img').forEach(img => img.addEventListener('click', e => updateStory('heroImage', e.target.dataset.fullUrl)));
    });

    // Palette
    document.getElementById('palette-color-picker').addEventListener('input', async (e) => {
        const value = e.target.value;
        const palette = await fetchColorPalette(value);
        if (palette) {
            currentStory.volumes[activeVolumeIndex].style.palette = palette;
            currentStory.volumes[activeVolumeIndex].style.accentColor = palette['500'];
            saveStory(currentStory);
            renderEditorContent();
        }
    });

    // Volume Styles
    document.querySelectorAll('[data-style-prop]').forEach(input => {
        input.addEventListener('input', async (e) => {
            const prop = e.target.dataset.styleProp;
            const value = e.target.value;
            currentStory.volumes[activeVolumeIndex].style[prop] = value;

            if (prop === 'font') loadGoogleFont(value);
            saveStory(currentStory);
            renderEditorContent();
        });
    });
}

function updateStory(property, value) {
    currentStory[property] = value;
    saveStory(currentStory);
    renderLivePreview();
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

    document.body.style.setProperty('--surface-color', activeVolume.style.backgroundColor);
    document.body.style.setProperty('--surface-color-dark', darkenColor(activeVolume.style.backgroundColor, 10));
    document.body.style.setProperty('--text-color', activeVolume.style.textColor);
    document.body.style.setProperty('--accent-color', accentColor);
    document.body.style.setProperty('--accent-hover', accentHoverColor);
    document.body.style.setProperty('--font-body', `'${activeVolume.style.font}', sans-serif`);

    canvas.innerHTML = `
      <div id="page-preview-wrapper">
        <header class="page-header">
            <div class="header-logo">Wild Fantasy</div>
            <nav class="header-nav">
                <a href="#">Novels</a><a href="#">Donates</a><a href="#">Wiki</a><a href="#">W.F. Writers</a>
            </nav>
            <div class="header-actions">
                <button class="btn">Login</button>
            </div>
        </header>

        <section class="hero-section" style="background-image: url('${currentStory.heroImage}');">
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
    addLivePreviewEventListeners();
}

function addLivePreviewEventListeners() {
    document.querySelectorAll('.volume-list li[data-index]').forEach(li => {
        li.addEventListener('click', e => {
            const newIndex = parseInt(e.target.dataset.index, 10);
            if (newIndex !== activeVolumeIndex) {
                activeVolumeIndex = newIndex;
                renderEditorContent();
            }
        });
    });
    const addVolumeBtn = document.getElementById('add-volume-btn');
    if (addVolumeBtn) {
        addVolumeBtn.addEventListener('click', handleAddVolume);
    }
}

function handleAddVolume() {
    const volumeName = prompt('New volume name:', `Volume ${currentStory.volumes.length + 1}`);
    if (volumeName) {
        currentStory.volumes.push(createNewVolume(volumeName));
        activeVolumeIndex = currentStory.volumes.length - 1;
        saveStory(currentStory);
        renderEditorContent();
    }
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
