/**
 * Format price to show only necessary decimal places
 * @param {string|number} price - The price value
 * @param {string} currency - The currency (PYUSD)
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency) => {
    if (!price) return '0';

    const numPrice = parseFloat(price);

    // For PYUSD, show up to 2 decimal places if needed
    if (currency === 'PYUSD') {
        // Remove trailing zeros and unnecessary decimal places
        return numPrice.toFixed(2).replace(/\.?0+$/, '');
    }

    // Fallback: show up to 2 decimal places for stablecoins
    return numPrice.toFixed(2).replace(/\.?0+$/, '');
};

/**
 * Format price with currency symbol
 * @param {string|number} price - The price value
 * @param {string} currency - The currency (PYUSD)
 * @returns {string} Formatted price with currency
 */
export const formatPriceWithCurrency = (price, currency) => {
    const formattedPrice = formatPrice(price, currency);
    return `${formattedPrice} ${currency}`;
};
