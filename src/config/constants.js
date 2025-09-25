export const THEME_COLORS = {
    green: getCssVar('--green') || '#10b981',
    yellow: getCssVar('--yellow') || '#f59e0b',
    red: getCssVar('--red') || '#ef4444',
};

export const MAP_DEFAULTS = {
    fitPadding: [50, 50],
    center: [14.6, 104.9],
    zoom: 7,
};

function getCssVar(name) {
    if (typeof document === 'undefined') return '';
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

