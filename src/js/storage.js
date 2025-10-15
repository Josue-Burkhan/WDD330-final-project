const STORIES_KEY = 'chapterlist_stories';
const THEME_KEY = 'chapterlist_theme';

export function createNewVolume(name = 'Volume 1', heroImage = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1770&q=80') {
    const chapters = [];
    for (let i = 1; i <= 30; i++) {
        chapters.push({
            id: `ch_${Date.now()}_${i}`,
            title: `Chapter ${i}: The Beginning`
        });
    }
    return {
        id: `vol_${Date.now()}`,
        name,
        style: {
            backgroundColor: '#f7f7f7',
            textColor: '#333333',
            accentColor: '#c166fdff',
            font: 'serif',
            palette: {},
            heroImage: heroImage
        },
        chapters
    };
}

export function getStories() {
    return JSON.parse(localStorage.getItem(STORIES_KEY)) || [];
}

export function getStory(id) {
    const stories = getStories();
    return stories.find(s => s.id === id);
}

export function saveStory(storyData) {
    const stories = getStories();
    const existingIndex = stories.findIndex(s => s.id === storyData.id);

    if (existingIndex > -1) {
        stories[existingIndex] = storyData;
    } else {
        const newStory = {
            id: storyData.id,
            name: storyData.name,
            synopsis: 'This is a brief and exciting synopsis of your new story. Click here to edit it!',
            isGlobalEdit: true,
            created: storyData.created,
            volumes: [createNewVolume()],
        };
        stories.push(newStory);
    }
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

export function deleteStory(id) {
    let stories = getStories();
    stories = stories.filter(s => s.id !== id);
    localStorage.setItem(STORIES_KEY, JSON.stringify(stories));
}

export function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light-mode';
}

export function saveTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
}
