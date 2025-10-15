/**
 * Fetches a color palette from the tints.dev API.
 * @param {string} hex The hex color to generate the palette from (e.g., '#B043D8').
 * @returns {Promise<object|null>} A promise that resolves to the palette object or null if fetching fails.
 */
async function fetchTintsDevPalette(hex) {
    const hexWithoutHash = hex.replace('#', '');
    const url = `https://api.tints.dev/v1/palette?color=${hexWithoutHash}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        return null;
    }
}

/**
 * Fetches a color palette from thecolorapi.com and adapts it to the tints.dev format.
 * @param {string} hex The hex color to generate the palette from (e.g., '#B043D8').
 * @returns {Promise<object|null>} A promise that resolves to the adapted palette object or null if fetching fails.
 */
async function fetchTheColorApiPalette(hex) {
    const hexWithoutHash = hex.replace('#', '');
    const url = `https://www.thecolorapi.com/scheme?hex=${hexWithoutHash}&mode=monochrome&count=12`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Adapt the response to the format expected by the UI (similar to tints.dev)
        const palette = {};
        const shades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
        data.colors.slice(0, 11).forEach((color, index) => {
            const shade = shades[index];
            palette[shade] = color.hex.value;
        });

        return palette;
    } catch (error) {
        console.error('Failed to fetch from thecolorapi.com:', error.message);
        return null;
    }
}

/**
 * Fetches a color palette from multiple sources with fallback.
 * @param {string} hex The hex color to generate the palette from (e.g., '#B043D8').
 * @returns {Promise<object|null>} A promise that resolves to the palette object or null if all fetching fails.
 */
export async function fetchColorPalette(hex) {
    let palette = await fetchTintsDevPalette(hex);
    if (palette) {
        return palette;
    }

    palette = await fetchTheColorApiPalette(hex);
    if (palette) {
        return palette;
    }

    console.error('All color palette APIs failed. Please check your network connection.');
    return null;
}