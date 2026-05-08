// utils.js

/**
 * Generates a pseudo-random unique ID.
 */
export function generateId() {
    return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

/**
 * Formats a number as a currency string.
 * @param {number} amount 
 * @param {string} symbol 
 * @returns {string}
 */
export function formatCurrency(amount, symbol = '₹') {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR', // Using INR format rules as baseline
        currencyDisplay: 'code' // We'll manually replace the code with the symbol
    }).format(amount).replace('INR', symbol).trim();
}

/**
 * Formats an ISO date string (YYYY-MM-DD) to a localized, readable date.
 * @param {string} dateString 
 * @returns {string}
 */
export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Adjust for timezone offset to prevent off-by-one day issues
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
    
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(adjustedDate);
}

/**
 * Sanitizes a string to prevent XSS attacks before injecting into DOM via innerHTML.
 * For this app, we primarily use TextNodes, but if innerHTML is needed, use this.
 * @param {string} str 
 * @returns {string}
 */
export function sanitizeHTML(str) {
    if (typeof str !== 'string') return str;
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Creates a DOM element with specified classes and attributes.
 * @param {string} tag 
 * @param {string|string[]} className 
 * @param {Object} attributes 
 * @returns {HTMLElement}
 */
export function createElement(tag, className = '', attributes = {}) {
    const el = document.createElement(tag);
    if (className) {
        if (Array.isArray(className)) {
            el.classList.add(...className);
        } else {
            el.className = className;
        }
    }
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'textContent' || key === 'innerHTML') {
            el[key] = value;
        } else {
            el.setAttribute(key, value);
        }
    }
    return el;
}
