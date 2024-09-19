const { normalize } = require('@geolonia/normalize-japanese-addresses');

/**
 * Geocode a Japanese address.
 *
 * @param {string} address - The address to geocode.
 * @returns {Promise<Object>} - A promise that resolves to geocoding information.
 */
const geocodeAddress = async (address) => {
    try {
        const json = await normalize(address);
        if (json.level > 0) {
            return json; // Contains latitude, longitude, and other info
        } else {
            throw new Error('Address not found. Please correct the address and try again.');
        }
    } catch (error) {
        throw new Error('Geocoding failed: ' + error.message);
    }
};

module.exports = { geocodeAddress };
