/**
 * API Module
 * Handles all external API calls (Unsplash, Google Fonts, etc.).
 */

const UNSPLASH_API_KEY = import.meta.env.VITE_UNSPLASH_API_KEY;
const GOOGLE_FONTS_API_KEY = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;

/**
 * Fetches random photos from Unsplash based on a query.
 */
export async function fetchUnsplashImages(query = 'minimal') {
    if (!UNSPLASH_API_KEY || UNSPLASH_API_KEY === 'YOUR_UNSPLASH_API_KEY') {
        console.warn('Unsplash API key is not set.');
        return [];
    }
    try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}&count=10&client_id=${UNSPLASH_API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching from Unsplash:', error);
        return [];
    }
}

/**
 * Fetches a list of popular fonts from Google Fonts.
 */
export async function fetchGoogleFonts() {
    if (!GOOGLE_FONTS_API_KEY || GOOGLE_FONTS_API_KEY === 'YOUR_GOOGLE_FONTS_API_KEY') {
        console.warn('Google Fonts API key is not set. Using a default font list.');
        return Promise.resolve([
            { family: 'Merriweather' }, { family: 'Montserrat' }, { family: 'Roboto' }, { family: 'Poppins' }, { family: 'Lato' }
        ]);
    }
    try {
        const response = await fetch(`https://www.googleapis.com/webfonts/v1/webfonts?key=${GOOGLE_FONTS_API_KEY}&sort=popularity`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.items;
    } catch (error) {
        console.error('Error fetching from Google Fonts:', error);
        // Return a default list on error to ensure the app doesn't break
        return Promise.resolve([
            { family: 'Merriweather' }, { family: 'Montserrat' }
        ]);
    }
}