/**
 * Darkens a hex color by a given percentage.
 * @param {string} hex The hex color to darken.
 * @param {number} percent The percentage to darken by (0-100).
 * @returns {string} The new darker hex color.
 */
export function darkenColor(hex, percent) {
    // Remove the '#' from the beginning of the hex code
    hex = hex.replace('#', '');

    // Convert the hex code to RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Darken the color
    r = parseInt(r * (100 - percent) / 100);
    g = parseInt(g * (100 - percent) / 100);
    b = parseInt(b * (100 - percent) / 100);

    // Make sure the values are within the valid range (0-255)
    r = (r < 0) ? 0 : r;
    g = (g < 0) ? 0 : g;
    b = (b < 0) ? 0 : b;

    // Convert the RGB values back to a hex code
    const newHex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

    return newHex;
}
