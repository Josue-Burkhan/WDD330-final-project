/**
 * API Module
 * Handles all external API calls (Unsplash, Google Fonts, etc.).
 * IMPORTANT: Replace 'YOUR_API_KEY' with your actual keys.
 */

const UNSPLASH_API_KEY = import.meta.env.VITE_UNSPLASH_API_KEY;
const GOOGLE_FONTS_API_KEY = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;

/**
 * Fetches random photos from Unsplash based on a query.
 * @param {string} query - The search term for photos (e.g., 'nature', 'technology').
 * @returns {Promise<Array>} A promise that resolves to an array of photo objects.
 */
export async function fetchUnsplashImages(query = 'minimal') {
    if (UNSPLASH_API_KEY === 'YOUR_UNSPLASH_API_KEY') {
        console.warn('Unsplash API key is not set. Using placeholder data.');
        return Promise.resolve([]); // Return empty array or mock data
    }
    try {
        const response = await fetch(`https://api.unsplash.com/photos/random?query=${query}&count=10&client_id=${UNSPLASH_API_KEY}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching from Unsplash:', error);
        return [];
    }
}

/**
 * Fetches a list of popular fonts from Google Fonts.
 * @returns {Promise<Array>} A promise that resolves to an array of font objects.
 */
export async function fetchGoogleFonts() {
    if (GOOGLE_FONTS_API_KEY === 'YOUR_GOOGLE_FONTS_API_KEY') {
        console.warn('Google Fonts API key is not set. Using placeholder data.');
        // Return a small list of safe, common web fonts
        return Promise.resolve([
            { family: 'Roboto' }, { family: 'Poppins' }, { family: 'Montserrat' },
            { family: 'Lato' }, { family: 'Open Sans' }
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
        return [];
    }
}
