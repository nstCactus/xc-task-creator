define(function () {
    // Helper function to transliterate special characters to ASCII
    var transliterate = function (str) {
        const charMap = {
            'ä': 'ae',
            'ö': 'oe',
            'ü': 'ue',
            'ß': 'ss',
            'Ä': 'Ae',
            'Ö': 'Oe',
            'Ü': 'Ue',
            'é': 'e',
            'è': 'e',
            'ê': 'e',
            'á': 'a',
            'à': 'a',
            'â': 'a',
            'ç': 'c',
            'ñ': 'n',
            // Add more mappings as needed
        };

        return str.replace(/[^a-zA-Z0-9 ]/g, (char) => charMap[char] || ''); // Replace or remove unsupported characters
    };

    // Export the transliterate function
    return {
        transliterate: transliterate
    };
});