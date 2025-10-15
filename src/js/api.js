const GOOGLE_FONTS_API_KEY = import.meta.env.VITE_GOOGLE_FONTS_API_KEY;

export async function fetchGoogleFonts() {
    if (!GOOGLE_FONTS_API_KEY || GOOGLE_FONTS_API_KEY === 'YOUR_GOOGLE_FONTS_API_KEY') {
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
        return Promise.resolve([
            { family: 'Merriweather' }, { family: 'Montserrat' }
        ]);
    }
}
