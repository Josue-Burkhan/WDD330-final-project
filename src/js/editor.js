/**
 * Editor Module
 * Manages the visual editor canvas, section creation, and customization.
 */

import { saveProject } from './storage.js';

let currentProject = null;

/**
 * Renders all sections of a project into the canvas.
 * @param {object} project - The project object to render.
 */
export function renderCanvas(project) {
    currentProject = project;
    const canvas = document.getElementById('editor-canvas');
    if (!project || !canvas) return;

    if (project.sections.length === 0) {
        canvas.innerHTML = '<div class="canvas-empty-state">Add a section from the sidebar to begin.</div>';
    } else {
        canvas.innerHTML = project.sections.map(getSectionHtml).join('');
    }

    // Add click listeners to sections for editing
    canvas.querySelectorAll('.canvas-section').forEach(sectionEl => {
        sectionEl.addEventListener('click', () => {
            const sectionId = sectionEl.dataset.id;
            // Visually mark as selected
            canvas.querySelectorAll('.canvas-section').forEach(el => el.classList.remove('selected-section'));
            sectionEl.classList.add('selected-section');
            renderControls(project, sectionId);
        });
    });
}

/**
 * Renders the editing controls for a selected section.
 * @param {object} project - The current project.
 * @param {string} sectionId - The ID of the section to edit.
 */
function renderControls(project, sectionId) {
    const section = project.sections.find(s => s.id === sectionId);
    const controlsContainer = document.getElementById('section-controls');
    if (!section || !controlsContainer) return;

    let contentFields = Object.keys(section.content).map(key => {
        if (typeof section.content[key] === 'string') {
            return `<label>${key}</label><input type="text" data-property="content.${key}" value="${section.content[key]}">`;
        }
        return '';
    }).join('');

    let styleFields = Object.keys(section.styles).map(key => {
        const value = section.styles[key];
        const type = value.startsWith('#') ? 'color' : 'text';
        return `<label>${key}</label><input type="${type}" data-property="styles.${key}" value="${value}">`;
    }).join('');

    controlsContainer.innerHTML = `
        <h3>Edit Section</h3>
        <div class="controls-group">
            <h4>Content</h4>
            ${contentFields}
        </div>
        <div class="controls-group">
            <h4>Styles</h4>
            ${styleFields}
        </div>
    `;

    // Add event listeners to the new controls
    controlsContainer.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            updateSection(project, sectionId, e.target.dataset.property, e.target.value);
        });
    });

    // Add event listener for image search
    const searchBtn = document.getElementById('image-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const input = document.getElementById('image-search-input');
            const resultsContainer = document.getElementById('image-results');
            resultsContainer.innerHTML = '<em>Loading...</em>';
            
            const images = await fetchUnsplashImages(input.value);
            
            if (images.length > 0) {
                resultsContainer.innerHTML = images.map(img => 
                    `<img src="${img.urls.thumb}" data-full-url="${img.urls.regular}" alt="${img.alt_description}">`
                ).join('');
            } else {
                resultsContainer.innerHTML = '<em>No results found.</em>';
            }
        });
    }

    // Add click listener for image results
    const resultsContainer = document.getElementById('image-results');
    if (resultsContainer) {
        resultsContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                const newImageUrl = e.target.dataset.fullUrl;
                // For hero, we assume it's a background image. For image, it's the src.
                const propertyToUpdate = section.type === 'image' ? 'content.src' : 'styles.backgroundColor';
                
                if(section.type === 'hero') {
                    updateSection(project, sectionId, 'styles.backgroundColor', `url(${newImageUrl})`);
                } else {
                    updateSection(project, sectionId, 'content.src', newImageUrl);
                }
            }
        });
    }
}

/**
 * Updates a property of a section and saves the project.
 * @param {object} project - The current project.
 * @param {string} sectionId - The ID of the section to update.
 * @param {string} property - The property to update (e.g., 'content.title').
 * @param {string} value - The new value.
 */
function updateSection(project, sectionId, property, value) {
    const section = project.sections.find(s => s.id === sectionId);
    if (!section) return;

    const [mainProp, subProp] = property.split('.');
    if (section[mainProp] && typeof section[mainProp] === 'object') {
        section[mainProp][subProp] = value;
    } else {
        section[property] = value;
    }

    saveProject(project);
    updateLivePreview(sectionId, property, value);
}

/**
 * Updates a specific element in the live preview canvas without a full re-render.
 * @param {string} sectionId - The ID of the section to update.
 * @param {string} property - The property that changed.
 * @param {string} value - The new value.
 */
function updateLivePreview(sectionId, property, value) {
    const sectionEl = document.querySelector(`.canvas-section[data-id="${sectionId}"]`);
    if (!sectionEl) return;

    const [mainProp, subProp] = property.split('.');

    if (mainProp === 'styles') {
        // Handle style changes
        if (subProp === 'backgroundColor' && value.includes('url')) {
            sectionEl.style.backgroundImage = value;
            sectionEl.style.backgroundSize = 'cover';
            sectionEl.style.backgroundPosition = 'center';
        } else {
            sectionEl.style[subProp] = value;
        }
    } else if (mainProp === 'content') {
        // Handle content changes
        let elementToUpdate;
        switch (subProp) {
            case 'title':
                elementToUpdate = sectionEl.querySelector('h1');
                break;
            case 'subtitle':
                elementToUpdate = sectionEl.querySelector('p');
                break;
            case 'heading':
                elementToUpdate = sectionEl.querySelector('h2');
                break;
            case 'body':
                elementToUpdate = sectionEl.querySelector('p');
                break;
            case 'src':
                elementToUpdate = sectionEl.querySelector('img');
                if(elementToUpdate) elementToUpdate.src = value;
                break;
            case 'alt':
                elementToUpdate = sectionEl.querySelector('img');
                if(elementToUpdate) elementToUpdate.alt = value;
                break;
        }
        if (elementToUpdate && subProp !== 'src' && subProp !== 'alt') {
            elementToUpdate.innerText = value;
        }
    }
}

/**
 * Generates a self-contained HTML file for the project and triggers a download.
 * @param {object} project - The project to export.
 */
export function exportProjectAsHtml(project) {
    const sectionsHtml = project.sections.map(getSectionHtml).join('\n');
    
    // A very basic set of styles to make the export look decent.
    // For a real-world scenario, you might fetch the actual project CSS.
    const embeddedCss = `
        body { font-family: sans-serif; margin: 0; }
        h1, h2 { font-family: serif; }
        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }
        .gallery-grid img {
            width: 100%;
            height: auto;
        }
        section { padding: 2rem 1rem; text-align: center; }
    `;

    const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${project.name}</title>
            <style>${embeddedCss}</style>
        </head>
        <body>
            ${sectionsHtml}
        </body>
        </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '-').toLowerCase()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Adds a new section to the project.
 * @param {object} project - The project to add the section to.
 * @param {string} sectionType - The type of section to add (e.g., 'hero', 'text').
 */
export function addSection(project, sectionType) {
    const newSection = {
        id: `sec_${Date.now()}`,
        type: sectionType,
        content: getDefaultContent(sectionType),
        styles: getDefaultStyles(sectionType)
    };

    project.sections.push(newSection);
    saveProject(project);
    renderCanvas(project);
}

/**
 * Returns the default content for a new section.
 * @param {string} type - The section type.
 * @returns {object} The default content object.
 */
function getDefaultContent(type) {
    switch (type) {
        case 'hero':
            return { title: 'Welcome to Your Website', subtitle: 'This is a hero section. Click to edit.' };
        case 'text':
            return { heading: 'About Us', body: 'We are a company dedicated to excellence. This is a paragraph of text you can edit.' };
        case 'image':
            return { src: 'https://via.placeholder.com/1200x400', alt: 'Placeholder Image' };
        case 'gallery':
            return {
                images: [
                    { src: 'https://via.placeholder.com/400', alt: 'Placeholder 1' },
                    { src: 'https://via.placeholder.com/400', alt: 'Placeholder 2' },
                    { src: 'https://via.placeholder.com/400', alt: 'Placeholder 3' },
                ]
            };
        case 'contact':
            return { heading: 'Contact Us', email: 'contact@example.com', phone: '123-456-7890' };
        default:
            return {};
    }
}

/**
 * Returns the default styles for a new section.
 * @param {string} type - The section type.
 * @returns {object} The default styles object.
 */
function getDefaultStyles(type) {
    const baseStyles = {
        padding: '4rem 2rem',
        textAlign: 'center'
    };
    switch (type) {
        case 'hero':
            return {
                ...baseStyles,
                backgroundColor: '#2a9d8f',
                color: '#ffffff'
            };
        default:
            return baseStyles;
    }
}

/**
 * Generates the HTML for a single section object.
 * @param {object} section - The section data.
 * @returns {string} The HTML string for the section.
 */
function getSectionHtml(section) {
    const bgColor = section.styles?.backgroundColor || 'transparent';
    const isBgImage = bgColor.includes('url(');

    const styles = `
        ${isBgImage 
            ? `background-image: ${bgColor}; background-size: cover; background-position: center;` 
            : `background-color: ${bgColor};`
        }
        color: ${section.styles?.color || 'inherit'};
        padding: ${section.styles?.padding || '3rem 1rem'};
        text-align: ${section.styles?.textAlign || 'center'};
    `;

    switch (section.type) {
        case 'hero':
            return `
                <section class="canvas-section hero-section" data-id="${section.id}" style="${styles}">
                    <h1>${section.content?.title || 'Hero Title'}</h1>
                    <p>${section.content?.subtitle || 'Hero subtitle text goes here.'}</p>
                </section>
            `;
        case 'text':
            return `
                <section class="canvas-section text-section" data-id="${section.id}" style="${styles}">
                    <h2>${section.content?.heading || 'Section Heading'}</h2>
                    <p>${section.content?.body || 'This is a paragraph of text. You can edit this content.'}</p>
                </section>
            `;
        case 'image':
            return `
                <section class="canvas-section image-section" data-id="${section.id}" style="${styles}">
                    <img src="${section.content?.src}" alt="${section.content?.alt}" style="max-width: 100%; height: auto;">
                </section>
            `;
        case 'gallery':
            return `
                <section class="canvas-section gallery-section" data-id="${section.id}" style="${styles}">
                    <h2>Gallery</h2>
                    <div class="gallery-grid">
                        ${section.content.images.map(img => `<img src="${img.src}" alt="${img.alt}">`).join('')}
                    </div>
                </section>
            `;
        case 'contact':
            return `
                <section class="canvas-section contact-section" data-id="${section.id}" style="${styles}">
                    <h2>${section.content.heading}</h2>
                    <p>Email: ${section.content.email}</p>
                    <p>Phone: ${section.content.phone}</p>
                </section>
            `;
        default:
            return '<div class="unknown-section">Unknown section type</div>';
    }
}
